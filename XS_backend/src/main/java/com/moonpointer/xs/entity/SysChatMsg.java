package com.moonpointer.xs.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SysChatMsg {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;  // 文本内容或图片URL
    private Integer msgType; // 0:文本, 1:图片
    private LocalDateTime createTime;
    private Integer isRead;
}