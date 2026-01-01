package com.moonpointer.xs.service;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.entity.SysChatMsg;
import com.moonpointer.xs.entity.SysFriend;
import com.moonpointer.xs.entity.SysUser;
import com.moonpointer.xs.entity.VO.FriendVO;
import com.moonpointer.xs.mapper.ChatMsgMapper;
import com.moonpointer.xs.mapper.FriendMapper;
import com.moonpointer.xs.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final FriendMapper friendMapper;
    private final ChatMsgMapper chatMsgMapper;
    private final UserMapper userMapper;
    private final StringRedisTemplate redisTemplate;
    // 注入 template
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    @Value("${app.upload-path:./chat/}")
    private String uploadPath;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;


    // 1.1 搜索用户 (支持查看好友状态)
    public Result<List<Map<String, Object>>> searchUsers(String keyword) {
        Long currentUserId = UserContext.getUserId();
        // 调用 UserMapper 中的新方法
        List<Map<String, Object>> userList = userMapper.searchUsersWithStatus(currentUserId, keyword);
        return Result.success(userList);
    }

    // 1.2 发送好友请求
    public Result<String> sendFriendRequest(Long friendId) {
        Long userId = UserContext.getUserId();
        if (userId.equals(friendId)) return Result.error(400, "不能添加自己");

        // 检查是否已经是好友或已申请
        long count = friendMapper.countByUserIdAndFriendId(userId, friendId);
        if (count > 0) return Result.error(400, "已申请或已是好友");

        SysFriend friend = new SysFriend();
        friend.setUserId(userId);
        friend.setFriendId(friendId);
        friend.setStatus(0); // 0: 申请中
        friend.setCreateTime(LocalDateTime.now());
        friendMapper.insert(friend);

        return Result.success("好友请求已发送");
    }

    // 1.3 处理好友请求 (同意/拒绝)
    @Transactional(rollbackFor = Exception.class)
    public Result<String> processRequest(Long requestId, Integer action) { // action 1:同意, 2:拒绝
        SysFriend request = friendMapper.selectById(requestId);
        if (request == null) return Result.error(404, "请求不存在");

        // 只能处理别人发给自己的请求 (requestId 对应的那条记录 friend_id 必须是我)
        if (!request.getFriendId().equals(UserContext.getUserId())) {
            return Result.error(403, "无权处理");
        }

        request.setStatus(action);
        friendMapper.updateStatus(request);

        if (action == 1) {
            // 同意后，建立双向关系，插入 "我->他" 的记录，状态直接为 1
            // 原记录 "他->我" 已经在上面 updateStatus 更新为 1 了
            SysFriend reverse = new SysFriend();
            reverse.setUserId(UserContext.getUserId());
            reverse.setFriendId(request.getUserId());
            reverse.setStatus(1);
            reverse.setCreateTime(LocalDateTime.now());
            friendMapper.insert(reverse);
        }

        return Result.success(action == 1 ? "已同意" : "已拒绝");
    }

    // 1.4 删除好友
    @Transactional(rollbackFor = Exception.class)
    public Result<String> deleteFriend(Long friendId) {
        Long currentUserId = UserContext.getUserId();
        // 调用 FriendMapper 的双向删除
        int rows = friendMapper.deleteRelation(currentUserId, friendId);
        if (rows > 0) {
            return Result.success("删除成功");
        }
        return Result.fail("好友关系不存在");
    }

    // 1.5 获取好友列表
    public Result<List<FriendVO>> getFriendList() {
        Long userId = UserContext.getUserId();

        // 1. 查询所有 status=1 的好友关系
        List<SysFriend> relations = friendMapper.selectFriendsByUserId(userId);

        // 如果没有好友，直接返回空列表，防止后面报错
        if (relations == null || relations.isEmpty()) {
            return Result.success(Collections.emptyList());
        }

        // 2. 提取好友 ID 并查询好友详细信息
        List<Long> friendIds = relations.stream()
                .map(SysFriend::getFriendId)
                .collect(Collectors.toList());

        List<SysUser> friends = userMapper.selectByIds(friendIds);

        // 二次检查：防止有了关系但查不到用户的情况
        if (friends == null || friends.isEmpty()) {
            return Result.success(Collections.emptyList());
        }


        Set<String> onlineIds = stringRedisTemplate.opsForSet().members("app:online_users");

        // 如果 Redis 挂了或者没数据，给一个空的 Set，防止后面报错
        Set<String> safeOnlineIds = (onlineIds != null) ? onlineIds : Collections.emptySet();

        // 4. 组装 VO 并排序
        List<FriendVO> result = friends.stream().map(u -> {
                    FriendVO vo = new FriendVO();
                    vo.setId(u.getId());
                    vo.setUsername(u.getUsername());
                    vo.setNickname(u.getNickname());
                    vo.setAvatar(u.getAvatar());

                    boolean isOnline = safeOnlineIds.contains(String.valueOf(u.getId()));
                    vo.setOnline(isOnline);

                    return vo;
                })

                .sorted(Comparator.comparing(FriendVO::isOnline).reversed()
                        .thenComparing(FriendVO::getNickname, Comparator.nullsLast(String::compareTo)))
                .collect(Collectors.toList());

        return Result.success(result);
    }


    // 2.1 获取聊天记录 (分页)
    public Result<Map<String, Object>> getChatHistory(Long friendId, Integer page, Integer size) {
        Long currentUserId = UserContext.getUserId();

        // 使用 PageHelper 自动处理分页 SQL
        PageHelper.startPage(page, size);

        // 调用 ChatMsgMapper 查询双向历史
        List<SysChatMsg> list = chatMsgMapper.selectHistory(currentUserId, friendId);

        PageInfo<SysChatMsg> pageInfo = new PageInfo<>(list);

        Map<String, Object> data = new HashMap<>();
        data.put("total", pageInfo.getTotal());
        data.put("current", pageInfo.getPageNum());
        data.put("records", pageInfo.getList());

        return Result.success(data);
    }

    // 2.2 标记消息已读
    @Transactional(rollbackFor = Exception.class)
    public Result<String> readMessages(Long friendId) {
        Long currentUserId = UserContext.getUserId();
        chatMsgMapper.updateReadStatus(friendId, currentUserId);


        // 这里构造一个特殊消息，比如 type=99 代表已读回执
        Map<String, Object> receipt = new HashMap<>();
        receipt.put("senderId", currentUserId); // 谁读了消息
        receipt.put("type", 99); // 系统消息类型
        receipt.put("content", "READ");

        // 推送到 friendId 的订阅队列
        simpMessagingTemplate.convertAndSendToUser(
                friendId.toString(),
                "/queue/chat",
                receipt
        );
        // -------------------------------------------------------------

        return Result.success("已读");
    }

    // 2.3 发现"局域网"在线用户 (排除好友)
    public Result<List<SysUser>> discoverUsers() {
        Set<String> onlineIds = redisTemplate.opsForSet().members("app:online_users");
        if (onlineIds == null || onlineIds.isEmpty()) return Result.success(Collections.emptyList());

        Long currentUserId = UserContext.getUserId();

        // 1. 移除自己
        Set<String> targetIds = new HashSet<>(onlineIds);
        targetIds.remove(String.valueOf(currentUserId));
        if (targetIds.isEmpty()) return Result.success(Collections.emptyList());

        // 2. 获取我的好友ID，用于过滤
        List<SysFriend> myFriends = friendMapper.selectFriendsByUserId(currentUserId);
        Set<Long> friendIdSet = myFriends.stream().map(SysFriend::getFriendId).collect(Collectors.toSet());

        // 3. 查询用户并过滤
        List<Long> idList = targetIds.stream().map(Long::valueOf).collect(Collectors.toList());
        List<SysUser> users = userMapper.selectByIds(idList);

        List<SysUser> result = users.stream()
                .filter(u -> !friendIdSet.contains(u.getId())) // 排除已是好友的
                .peek(u -> u.setPassword(null)) // 脱敏
                .collect(Collectors.toList());

        return Result.success(result);
    }

    // 2.4 上传图片
    public Result<String> uploadImage(MultipartFile file) {
        if (!FileUtil.exist(uploadPath)) FileUtil.mkdir(uploadPath);
        System.out.println("已上传" + uploadPath);
        // 简单后缀检查
        String originalFilename = file.getOriginalFilename();
        String suffix = FileUtil.extName(originalFilename);
        if (suffix == null || !Arrays.asList("jpg", "jpeg", "png", "gif", "bmp").contains(suffix.toLowerCase())) {
            return Result.error(400, "仅支持图片格式");
        }

        String fileName = IdUtil.simpleUUID() + "." + suffix;
        try {
            // 1. 构建目标文件对象（推荐用这种写法，自动处理路径分隔符 / 或 \）
            File dest = new File(uploadPath, fileName);


            if (!dest.getParentFile().exists()) {
                boolean created = dest.getParentFile().mkdirs();
                if (!created) {
                    System.out.println("创建目录失败: " + dest.getParentFile().getAbsolutePath());
                    return Result.error(500, "服务器目录权限不足");
                }
            }

            // 3. 打印一下绝对路径，看看文件到底存哪儿去了（方便调试）
            System.out.println("文件保存路径: " + dest.getAbsolutePath());

            // 4. 保存文件
            file.transferTo(dest);

            String url = "/files/" + fileName;
            return Result.success(url);

        } catch (IOException e) {
            e.printStackTrace();
            return Result.error(500, "上传失败: " + e.getMessage());
        }
    }

    // 2.5 异步保存聊天记录 (被 WebSocket 模块调用)
    public void saveMessageAsync(SysChatMsg msg) {
        chatMsgMapper.insert(msg);
    }

    // === 新增方法：获取好友申请列表 ===
    public Result<List<Map<String, Object>>> getFriendRequests() {
        Long userId = UserContext.getUserId();
        List<Map<String, Object>> list = friendMapper.selectPendingRequests(userId);
        return Result.success(list);
    }

    /**
     * 10. 更新用户信息
     */
    public Result<String> updateUserInfo(Long userId, String nickname, String avatar, String password) {
        // 1.(利用 UserMapper 中已有的 selectById 方法)
        SysUser user = userMapper.selectById(userId);

        if (user == null) {
            return Result.error(404, "用户不存在");
        }

        // 2. 只修改需要更新的字段
        // 如果前端传了 nickname，就更新；没传就不动
        if (nickname != null && !nickname.trim().isEmpty()) {
            user.setNickname(nickname);
        }

        if (avatar != null && !avatar.trim().isEmpty()) {
            user.setAvatar(avatar);
        }

        // 如果前端传了密码，才更新
        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(password);
        }

        // 3. 此时 user 对象里包含了 username, role, create_time 等原有数据
        userMapper.update(user);

        return Result.success("修改成功");
    }


}