package com.moonpointer.xs.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SysUser {
    private Long id;
    private String username;
    private String password; // 存储加密后的密码
    private String nickname;
    private String role;     // USER, ADMIN
    private Integer status;  // 1:正常, 0:封禁
    private LocalDateTime createTime;
    private String avatar;
}