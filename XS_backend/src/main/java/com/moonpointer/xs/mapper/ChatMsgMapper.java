package com.moonpointer.xs.mapper;

import com.moonpointer.xs.entity.SysChatMsg;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ChatMsgMapper {
    @Insert("INSERT INTO sys_chat_msg (sender_id, receiver_id, content, msg_type, create_time) VALUES (#{senderId}, #{receiverId}, #{content}, #{msgType}, #{createTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(SysChatMsg msg);

    @Select("SELECT * FROM sys_chat_msg " +
            "WHERE (sender_id = #{userId} AND receiver_id = #{friendId}) " +
            "   OR (sender_id = #{friendId} AND receiver_id = #{userId}) " +
            "ORDER BY create_time DESC")
    List<SysChatMsg> selectHistory(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Update("UPDATE sys_chat_msg SET is_read = 1 " +
            "WHERE sender_id = #{friendId} AND receiver_id = #{userId} AND is_read = 0")
    void updateReadStatus(@Param("friendId") Long friendId, @Param("userId") Long userId);


}