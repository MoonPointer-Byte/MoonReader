package com.moonpointer.xs.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SysFriend {
    private Long id;

    private Long userId;     // 申请人
    private Long friendId;   // 被申请人

    private boolean online;

    // 0:申请中, 1:已添加, 2:拒绝
    private Integer status;

    private LocalDateTime createTime;
}