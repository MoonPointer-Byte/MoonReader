package com.moonpointer.xs.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 允许跨域
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 客户端订阅路径前缀
        registry.enableSimpleBroker("/topic", "/queue");
        // 客户端发送路径前缀 (对应 @MessageMapping)
        registry.setApplicationDestinationPrefixes("/app");
        // 点对点推送前缀 (convertAndSendToUser)
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * 核心配置：拦截器，从 Token 中提取 UserID 作为 WebSocket 的 Principal
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // 只有在 CONNECT 阶段才校验 Token
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {

                    // 1. 获取 Token (前端通常放在 connectHeaders: { Authorization: "Bearer ..." })
                    List<String> authorization = accessor.getNativeHeader("Authorization");
                    if (authorization != null && !authorization.isEmpty()) {
                        String token = authorization.get(0).replace("Bearer ", "");


                        String userIdStr = null;
                        try {

                            System.out.println("WebSocket 收到 Token: " + token);

                            userIdStr = token;
                        } catch (Exception e) {
                            return null; // 认证失败，拒绝连接
                        }
                        // === 临时模拟代码 End ===

                        if (userIdStr != null) {
                            String finalUserId = userIdStr;


                            if (accessor.getSessionAttributes() != null) {
                                accessor.getSessionAttributes().put("userId", finalUserId);
                            }

                            accessor.setUser(new Principal() {
                                @Override
                                public String getName() {
                                    return finalUserId; // 必须返回 UserID
                                }
                            });
                        }
                    }
                }
                return message;
            }
        });
    }
}