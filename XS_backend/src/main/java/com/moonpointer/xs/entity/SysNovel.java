package com.moonpointer.xs.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SysNovel {
    private Long id;
    private String title;
    private String fileName;      // 存储在磁盘上的唯一文件名
    private String originalName;  // 原始文件名
    private Long fileSize;        // 字节数
    private Long uploaderId;
    private Integer isDeleted;    // 0:正常, 1:删除
    private LocalDateTime createTime;
}