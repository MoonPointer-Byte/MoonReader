package com.moonpointer.xs.dto;

import lombok.Data;

public class EmailDTO {
    @Data
    public static class ConfigReq {
        private String emailAccount;
        private String authCode;
        private String smtpHost;
        private Integer smtpPort;
        private String pop3Host;
        private Integer pop3Port;
    }

    @Data
    public static class SendReq {
        private String to;
        private String subject;
        private String content;
    }
}