package com.moonpointer.xs.service;

import cn.hutool.crypto.digest.BCrypt;
import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.dto.LoginDTO;
import com.moonpointer.xs.dto.RegisterDTO;
import com.moonpointer.xs.entity.SysUser;
import com.moonpointer.xs.mapper.UserMapper;
import com.moonpointer.xs.utils.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor // Lombok自动注入构造器
public class AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    // 注册
    public Result<String> register(RegisterDTO dto) {
        // 1. 检查用户名是否存在
        long count = userMapper.countByUsername(dto.getUsername());
        if (count > 0) {
            return Result.error(400, "用户名已存在");
        }

        // 2. 创建用户
        SysUser user = new SysUser();
        user.setUsername(dto.getUsername());
        user.setPassword(BCrypt.hashpw(dto.getPassword()));
        user.setNickname(dto.getNickname() != null ? dto.getNickname() : dto.getUsername());
        user.setRole("USER"); // 默认角色
        user.setStatus(1);    // 默认正常
        user.setCreateTime(LocalDateTime.now());

        userMapper.insert(user);
        return Result.success("注册成功");
    }

    // 登录
    public Result<Map<String, Object>> login(@Valid LoginDTO dto) {
        // 1. 查询用户
        SysUser user = userMapper.selectByUsername(dto.getUsername());

        // 2. 校验账号密码
        if (user == null || !BCrypt.checkpw(dto.getPassword(), user.getPassword())) {
            return Result.error(400, "账号或密码错误");
        }

        // 3. 校验状态
        if (user.getStatus() == 0) {
            return Result.error(403, "账号已被封禁");
        }

        // 4. 生成 JWT
        String token = jwtUtil.createToken(user.getId(), user.getUsername(), user.getRole());

        String redisKey = "auth:token:" + user.getId();
        redisTemplate.opsForValue().set(redisKey, token, 7, TimeUnit.DAYS);

        // 6. 返回结果
        Map<String, Object> map = new HashMap<>();
        map.put("token", token);
        map.put("userInfo", user);
        return Result.success(map);
    }

    // 退出
    public Result<String> logout(Long userId) {
        String redisKey = "auth:token:" + userId;
        redisTemplate.delete(redisKey);
        return Result.success("退出成功");
    }

    public Result<String> updateAvatar(String avatarUrl) {
        Long userId = UserContext.getUserId();
        SysUser user = userMapper.selectById(userId);
        if (user == null) return Result.error(404, "用户不存在");

        user.setAvatar(avatarUrl);
        userMapper.update(user);
        return Result.success("头像更新成功");
    }
}