package com.moonpointer.xs.controller;

import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.entity.SysChatMsg;
import com.moonpointer.xs.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller; // 注意是 Controller 不是 RestController
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    /**
     * 接收前端发来的消息
     * 前端发送路径: /app/send
     * 对应 Payload: { "receiverId": 1002, "content": "你好", "type": 0 }
     */
    @MessageMapping("/send")
    public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
        if (principal == null) {
            log.error("WebSocket消息发送失败: 未认证的用户");
            return;
        }

        try {
            // 1. 获取发送者 ID (假设 Principal.getName() 存的是 UserId)
            Long senderId = Long.valueOf(principal.getName());

            // 2. 解析参数
            Long receiverId = Long.valueOf(payload.get("receiverId").toString());
            String content = (String) payload.get("content");
            Integer type = (Integer) payload.getOrDefault("type", 0);


            // 4. 构建消息实体并保存入库
            SysChatMsg msg = new SysChatMsg();
            msg.setSenderId(senderId);
            msg.setReceiverId(receiverId);
            msg.setContent(content);
            msg.setMsgType(type);
            msg.setIsRead(0); // 默认为未读
            msg.setCreateTime(LocalDateTime.now());

            // 异步保存到数据库
            chatService.saveMessageAsync(msg);

            // 5. 推送给接收者
            // 路径: /user/{receiverId}/queue/chat
            // 前端订阅: /user/queue/chat (Stomp会自动匹配)
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(receiverId),
                    "/queue/chat",
                    msg
            );

            log.info("消息发送成功: {} -> {}", senderId, receiverId);

        } catch (Exception e) {
            log.error("消息处理异常", e);
        }
    }
}