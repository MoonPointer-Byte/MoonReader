//package com.moonpointer.xs.component;
//
//import com.moonpointer.xs.utils.JwtUtil;
//import io.jsonwebtoken.Claims;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.context.event.EventListener;
//import org.springframework.data.redis.core.StringRedisTemplate;
//import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
//import org.springframework.stereotype.Component;
//import org.springframework.util.StringUtils;
//import org.springframework.web.socket.messaging.SessionConnectedEvent;
//import org.springframework.web.socket.messaging.SessionDisconnectEvent;
//
//import java.util.List;
//
//@Slf4j
//@Component
//@RequiredArgsConstructor
//public class WebSocketEventListener {
//
//    private final StringRedisTemplate redisTemplate;
//    private final JwtUtil jwtUtil;
//
//    private static final String ONLINE_KEY = "app:online_users";
//
//    // 监听连接建立
//    @EventListener
//    public void handleConnectListener(SessionConnectedEvent event) {
//        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
//
//        // 前端连接时需要在 Stomp Headers 中放入 "Authorization": "Bearer token"
//        // 或者在连接参数中传递，这里假设前端放在 nativeHeaders 中
//        List<String> authList = accessor.getNativeHeader("Authorization");
//
//        if (authList != null && !authList.isEmpty()) {
//            String token = authList.get(0).replace("Bearer ", "");
//            try {
//                Claims claims = jwtUtil.parseToken(token);
//                Long userId = claims.get("userId", Long.class);
//
//                // 【核心】将用户ID加入在线列表
//                redisTemplate.opsForSet().add(ONLINE_KEY, String.valueOf(userId));
//
//                // 将 userId 存入 WebSocket Session 属性中，方便断开时获取
//                accessor.getSessionAttributes().put("userId", userId);
//
//                log.info("用户上线: {}", userId);
//            } catch (Exception e) {
//                log.error("WebSocket认证失败");
//            }
//        }
//    }
//
//    // 监听连接断开
//    @EventListener
//    public void handleDisconnectListener(SessionDisconnectEvent event) {
//        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
//        Object userIdObj = accessor.getSessionAttributes().get("userId");
//
//        if (userIdObj != null) {
//            String userId = String.valueOf(userIdObj);
//            // 【核心】从在线列表中移除
//            redisTemplate.opsForSet().remove(ONLINE_KEY, userId);
//            log.info("用户下线: {}", userId);
//        }
//    }
//}
package com.moonpointer.xs.component;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Slf4j
@Component
public class WebSocketEventListener {

    @Autowired
    private StringRedisTemplate stringRedisTemplate; // 确保用的是 StringRedisTemplate

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final String ONLINE_USER_KEY = "app:online_users";

    /**
     * 监听用户上线
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        Principal user = event.getUser();

        if (user != null) {
            String userId = user.getName();
            log.info("🟢 [WebSocket] 用户上线: {}", userId);

            // 1. 写入 Redis
            stringRedisTemplate.opsForSet().add(ONLINE_USER_KEY, userId);

            messagingTemplate.convertAndSend("/topic/notice", "online");
        } else {
            log.warn("⚠️ [WebSocket] 连接建立，但无法获取用户信息 (Principal is null)");
        }
    }

    /**
     * 监听用户下线
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal user = event.getUser();

        if (user != null) {
            String userId = user.getName();
            log.info("🔴 [WebSocket] 用户下线: {}", userId);

            // 1. 移除 Redis
            stringRedisTemplate.opsForSet().remove(ONLINE_USER_KEY, userId);

            // 2. 广播通知
            messagingTemplate.convertAndSend("/topic/notice", "offline");
        }
    }
}