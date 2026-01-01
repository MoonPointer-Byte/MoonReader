package com.moonpointer.xs.common;

import lombok.Data;

@Data
public class Result<T> {
    // 核心记录：200成功，401没有登录，500业务逻辑错误/系统错误
    private Integer code;
    private String msg;
    private T data;

    // 成功 - 带数据
    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.code = 200;
        r.msg = "操作成功";
        r.data = data;
        return r;
    }

    // 成功 - 不带数据
    public static <T> Result<T> success() {
        return success(null);
    }

    // 失败 - 自定义错误码和消息
    public static <T> Result<T> error(Integer code, String msg) {
        Result<T> r = new Result<>();
        r.code = code;
        r.msg = msg;
        return r;
    }

    // 默认使用 500 作为业务逻辑错误的通用状态码
    public static <T> Result<T> fail(String msg) {
        return error(500, msg);
    }
}