package com.moonpointer.xs.controller;
import com.moonpointer.xs.entity.SysChatMsg;
import com.moonpointer.xs.service.ChatService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class ChatWsController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    // 前端发送目的地: /app/private
    @MessageMapping("/private")
    public void sendPrivateMessage(WsMessageDTO msg) {
        // 构建消息实体
        SysChatMsg dbMsg = new SysChatMsg();
        dbMsg.setSenderId(msg.getSenderId());
        dbMsg.setReceiverId(msg.getReceiverId());
        dbMsg.setContent(msg.getContent());
        dbMsg.setMsgType(msg.getType()); // 0:text, 1:image
        dbMsg.setCreateTime(LocalDateTime.now());

        // 1. 异步入库
        chatService.saveMessageAsync(dbMsg);

        // 2. 推送给接收者
        // 订阅地址: /user/{userId}/queue/messages
        messagingTemplate.convertAndSendToUser(
                String.valueOf(msg.getReceiverId()),
                "/queue/messages",
                dbMsg
        );

        messagingTemplate.convertAndSendToUser(
                String.valueOf(msg.getSenderId()),
                "/queue/messages",
                dbMsg
        );
    }

    @Data
    public static class WsMessageDTO {
        private Long senderId;
        private Long receiverId;
        private String content;
        private Integer type; // 0:text, 1:image
    }
}