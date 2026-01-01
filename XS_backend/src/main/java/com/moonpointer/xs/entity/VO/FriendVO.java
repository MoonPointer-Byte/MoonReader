package com.moonpointer.xs.entity.VO; // 建议放在 vo 包下

import lombok.Data;

@Data
public class FriendVO {
    private Long id;
    private String username;
    private String nickname;
    private String avatar;
    private boolean online;
}