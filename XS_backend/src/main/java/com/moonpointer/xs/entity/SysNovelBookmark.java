package com.moonpointer.xs.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SysNovelBookmark {
    private Long id;
    private Long userId;
    private Long novelId;

    private Long byteOffset;

    private LocalDateTime updateTime;
}