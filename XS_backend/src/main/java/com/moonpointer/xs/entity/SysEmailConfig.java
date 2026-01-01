package com.moonpointer.xs.entity;

import lombok.Data;

@Data
public class SysEmailConfig {
    // 使用 userId 作为主键 (1对1关系)
    private Long userId;

    private String emailAccount; // 邮箱账号
    private String authCode;     // 授权码

    // SMTP (发送)
    private String smtpHost;     // e.g., smtp.qq.com
    private Integer smtpPort;    // e.g., 465

    // POP3 (接收)
    private String pop3Host;     // e.g., pop.qq.com
    private Integer pop3Port;    // e.g., 995
}