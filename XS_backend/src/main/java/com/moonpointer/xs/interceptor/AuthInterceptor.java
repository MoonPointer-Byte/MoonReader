package com.moonpointer.xs.interceptor;

import com.moonpointer.xs.annotation.RequireAdmin;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.method.HandlerMethod;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 1. 处理 OPTIONS 预检请求 (CORS)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 2. 获取 Token
        String token = request.getHeader("Authorization");
        if (!StringUtils.hasText(token) || !token.startsWith("Bearer ")) {
            response.setStatus(401);
            return false;
        }
        token = token.substring(7);

        try {
            // 3. 解析 Token (JWT 自身验签)
            Claims claims = jwtUtil.parseToken(token);
            Long userId = claims.get("userId", Long.class);
            String role = claims.get("role", String.class);

            // 4. 【双重校验】查询 Redis 中是否存在
            // 如果管理员踢人，会删除 Redis Key，此时即使 JWT 没过期，也无法通过
            String redisKey = "auth:token:" + userId;
            if (Boolean.FALSE.equals(redisTemplate.hasKey(redisKey))) {
                response.setStatus(401); // 登录已失效
                return false;
            }

            // 5. 存储上下文，供 Controller 使用
            UserContext.set(userId, role);

            if (handler instanceof HandlerMethod) {
                HandlerMethod handlerMethod = (HandlerMethod) handler;
                RequireAdmin requireAdmin = handlerMethod.getMethodAnnotation(RequireAdmin.class);

                // 如果方法上有 @RequireAdmin 注解，且当前角色不是 ADMIN
                if (requireAdmin != null && !"ADMIN".equals(role)) {
                    response.setStatus(403); // 无权限
                    return false;
                }
            }
            return true;

        } catch (Exception e) {
            response.setStatus(401);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // 请求结束后清理 ThreadLocal，防止内存泄漏
        UserContext.remove();
    }
}