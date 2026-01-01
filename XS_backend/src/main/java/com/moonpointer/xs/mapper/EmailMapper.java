package com.moonpointer.xs.mapper;

import com.moonpointer.xs.entity.SysEmail;
import org.apache.ibatis.annotations.*;

import java.util.Date;
import java.util.List;

@Mapper
public interface EmailMapper {
    @Select("SELECT * FROM sys_email WHERE user_id = #{userId} ORDER BY sent_date DESC")
    List<SysEmail> selectByUserId(Long userId);

    @Select("SELECT COUNT(*) FROM sys_email WHERE user_id = #{userId} AND subject = #{subject} AND sent_date = #{sentDate}")
    long countByUniqueKey(@Param("userId") Long userId, @Param("subject") String subject, @Param("sentDate") Date sentDate);

    @Insert("INSERT INTO sys_email (user_id, message_id, sender, subject, content, sent_date, has_attachment) VALUES (#{userId}, #{messageId}, #{sender}, #{subject}, #{content}, #{sentDate}, #{hasAttachment})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(SysEmail email);
}