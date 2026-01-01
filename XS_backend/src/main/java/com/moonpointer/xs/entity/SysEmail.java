package com.moonpointer.xs.entity;

import lombok.Data;
import java.util.Date;

@Data
public class SysEmail {
    private Long id;

    private Long userId;        // 所属用户
    private String messageId;   // 邮件唯一ID
    private String sender;      // 发件人
    private String subject;     // 主题
    private String content;     // 简要内容
    private Date sentDate;      // 发送时间
    private Integer hasAttachment; // 0:无, 1:有
}