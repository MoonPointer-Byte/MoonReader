package com.moonpointer.xs.mapper;

import com.moonpointer.xs.entity.SysEmailConfig;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;


@Mapper
public interface EmailConfigMapper {
    @Select("SELECT * FROM sys_email_config WHERE user_id = #{userId}")
    SysEmailConfig selectByUserId(Long userId);

    @Insert("INSERT INTO sys_email_config (user_id, email_account, auth_code, smtp_host, smtp_port, pop3_host, pop3_port) VALUES (#{userId}, #{emailAccount}, #{authCode}, #{smtpHost}, #{smtpPort}, #{pop3Host}, #{pop3Port})")
    void insert(SysEmailConfig config);

    @Update("UPDATE sys_email_config SET email_account = #{emailAccount}, auth_code = #{authCode}, smtp_host = #{smtpHost}, smtp_port = #{smtpPort}, pop3_host = #{pop3Host}, pop3_port = #{pop3Port} WHERE user_id = #{userId}")
    void update(SysEmailConfig config);
}