package com.moonpointer.xs.controller;

import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.dto.LoginDTO;
import com.moonpointer.xs.dto.RegisterDTO;
import com.moonpointer.xs.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Result<String> register(@RequestBody @Valid RegisterDTO dto) {
        return authService.register(dto);
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody @Valid LoginDTO dto) {
        return authService.login(dto);
    }

    @PostMapping("/logout")
    public Result<String> logout() {
        // 从拦截器设置的 ThreadLocal 中获取当前用户ID
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.error(401, "未登录");
        }
        return authService.logout(userId);
    }

    @PostMapping("/avatar")
    public Result<String> updateAvatar(@RequestBody Map<String, String> body) {
        String avatarUrl = body.get("avatar");
        return authService.updateAvatar(avatarUrl);
    }
}