package com.moonpointer.xs.controller;

import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.entity.SysUser;
import com.moonpointer.xs.entity.VO.FriendVO;
import com.moonpointer.xs.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatHttpController {

    private final ChatService chatService;


    /**
     * 1. 全局搜索用户
     * 用于查找陌生人，返回结果包含是否已是好友的状态
     */
    @GetMapping("/friend/search")
    public Result<List<Map<String, Object>>> searchUsers(@RequestParam("keyword") String keyword) {
        return chatService.searchUsers(keyword);
    }

    /**
     * 2. 获取好友列表 (路径优化)
     * /api/friend/list
     */
    @GetMapping("/friend/list")
    public Result<List<FriendVO>> getFriends() {
        return chatService.getFriendList();
    }

    /**
     * 3. 删除好友
     * 双向删除好友关系
     */
    @DeleteMapping("/friend/{friendId}")
    public Result<String> deleteFriend(@PathVariable Long friendId) {
        return chatService.deleteFriend(friendId);
    }

    /**
     * 4. 发送好友请求
     */
    @PostMapping("/friend/request")
    public Result<String> addFriend(@RequestBody Map<String, Long> body) {
        return chatService.sendFriendRequest(body.get("friendId"));
    }

    /**
     * 5. 处理好友申请 (接受/拒绝)
     */
    @PostMapping("/friend/process")
    public Result<String> processRequest(@RequestBody Map<String, Object> body) {
        // 建议使用 DTO 对象接收参数，这里沿用 Map 写法
        Long requestId = Long.valueOf(body.get("requestId").toString());
        Integer action = Integer.parseInt(body.get("action").toString());
        return chatService.processRequest(requestId, action);
    }

    // =========================== 聊天模块 (Chat Module) ===========================

    /**
     * 6. 获取聊天历史记录
     * 支持分页，进入聊天窗口时调用
     */
    @GetMapping("/chat/history")
    public Result<Map<String, Object>> getChatHistory(
            @RequestParam Long friendId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return chatService.getChatHistory(friendId, page, size);
    }

    /**
     * 7. 标记消息为已读
     * 消除未读红点
     */
    @PutMapping("/chat/read")
    public Result<String> readMessages(@RequestBody Map<String, Long> body) {
        return chatService.readMessages(body.get("friendId"));
    }

    /**
     * 8. 上传聊天图片
     * 路径明确为 /chat/upload
     */
    @PostMapping("/chat/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) {
        System.out.println("上传" + file.getOriginalFilename());
        return chatService.uploadImage(file);
    }

    /**
     * 9. 发现在线用户
     * 路径明确为 /chat/online
     */
    @GetMapping("/chat/online")
    public Result<List<SysUser>> discovery() {
        return chatService.discoverUsers();
    }

    // === 新增接口 ===
    @GetMapping("/friend/requests")
    public Result<List<Map<String, Object>>> getFriendRequests() {
        return chatService.getFriendRequests();
    }
    @PutMapping("/user/update")
    public Result<String> updateUserInfo(@RequestBody Map<String, String> body) {
        // 1. 从 Token/Context 中获取当前登录用户的 ID
        Long currentUserId = com.moonpointer.xs.common.UserContext.getUserId();

        // 2. 获取参数
        String nickname = body.get("nickname");
        String avatar = body.get("avatar");
        String password = body.get("password");
        System.out.println("====== 开始更新用户信息 ======");
        System.out.println("用户ID: " + currentUserId);
        System.out.println("接收到的头像: " + avatar);
        System.out.println("接收到的昵称: " + nickname);

        // 3. 调用 Service
        return chatService.updateUserInfo(currentUserId, nickname, avatar, password);
    }
}