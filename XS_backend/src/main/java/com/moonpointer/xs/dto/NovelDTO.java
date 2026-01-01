package com.moonpointer.xs.dto;
import lombok.Data;

public class NovelDTO {

    @Data
    public static class ReadReq {
        private Long novelId;
        private Long start;    // 起始字节位置
        private Integer size;
    }

    @Data
    public static class ReadRes {
        private String content;   // 文本内容
        private Long currentStart;// 当前页起始字节
        private Long nextStart;   // 下一页起始字节
        private Long totalSize;   // 总字节数
        private Double progress;  // 进度百分比
        public ReadRes(String s, long start, long start1, long fileLength, double v) {
        }

        public ReadRes() {

        }
    }

    @Data
    public static class BookmarkReq {
        private Long novelId;
        private Long byteOffset;
    }
}
