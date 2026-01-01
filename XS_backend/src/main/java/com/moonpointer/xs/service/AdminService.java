package com.moonpointer.xs.service;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import com.moonpointer.xs.common.PageResult;
import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.entity.SysNovel;
import com.moonpointer.xs.entity.SysUser;
import com.moonpointer.xs.mapper.NovelMapper;
import com.moonpointer.xs.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserMapper userMapper;
    private final NovelMapper novelMapper;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.novel-path}")
    private String novelBasePath;

    // 1. 获取用户列表
    public Result<PageResult<SysUser>> getUserList(int page, int size) {
        int offset = (page - 1) * size;
        List<SysUser> users = userMapper.selectList(offset, size);
        long total = userMapper.countAll();
        return Result.success(new PageResult<>(total, users));
    }

    // 2. 封禁/解封用户
    public Result<String> updateUserStatus(Long userId, Integer status) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) return Result.error(404, "用户不存在");

        user.setStatus(status);
        userMapper.update(user);

        if (status == 0) {
            String redisKey = "auth:token:" + userId;
            redisTemplate.delete(redisKey);
        }

        return Result.success(status == 1 ? "用户已解封" : "用户已封禁并强制下线");
    }

    // 3. 上传小说
    @Transactional
    public Result<String> uploadNovel(MultipartFile file, String title) {
        if (file.isEmpty()) return Result.error(400, "文件为空");

        // 确保目录存在
        if (!FileUtil.exist(novelBasePath)) {
            FileUtil.mkdir(novelBasePath);
        }

        // 生成唯一文件名，防止重名覆盖
        String originalFilename = file.getOriginalFilename();
        String suffix = FileUtil.getSuffix(originalFilename); // 获取 .txt
        if (!"txt".equalsIgnoreCase(suffix)) {
            return Result.error(400, "只支持 TXT 格式");
        }

        String storageName = IdUtil.fastSimpleUUID() + ".txt";
        File dest = new File(novelBasePath + storageName);

        try {
            // 保存文件到磁盘
            file.transferTo(dest);

            // 保存记录到数据库
            SysNovel novel = new SysNovel();
            novel.setTitle(title != null ? title : FileUtil.mainName(originalFilename));
            novel.setFileName(storageName); // 存磁盘上的名字
            novel.setOriginalName(originalFilename);
            novel.setFileSize(dest.length()); // 字节大小
            novel.setUploaderId(UserContext.getUserId());
            novel.setIsDeleted(0);
            novel.setCreateTime(LocalDateTime.now());

            novelMapper.insert(novel);

            return Result.success("上传成功");
        } catch (IOException e) {
            e.printStackTrace();
            return Result.error(500, "上传失败: " + e.getMessage());
        }
    }
}