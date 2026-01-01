package com.moonpointer.xs.mapper;

import com.moonpointer.xs.entity.SysFriend;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

@Mapper
public interface FriendMapper {
    @Select("SELECT COUNT(*) FROM sys_friend WHERE user_id = #{userId} AND friend_id = #{friendId}")
    long countByUserIdAndFriendId(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Insert("INSERT INTO sys_friend (user_id, friend_id, status, create_time) VALUES (#{userId}, #{friendId}, #{status}, #{createTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(SysFriend friend);

    @Select("SELECT * FROM sys_friend WHERE id = #{id}")
    SysFriend selectById(Long id);

    @Update("UPDATE sys_friend SET status = #{status} WHERE id = #{id}")
    void updateStatus(SysFriend friend);

    @Select("SELECT * FROM sys_friend WHERE user_id = #{userId} AND status = 1")
    List<SysFriend> selectFriendsByUserId(Long userId);

    @Delete("DELETE FROM sys_friend " +
            "WHERE (user_id = #{userId} AND friend_id = #{friendId}) " +
            "   OR (user_id = #{friendId} AND friend_id = #{userId})")
    int deleteRelation(@Param("userId") Long userId, @Param("friendId") Long friendId);

    @Select("SELECT f.id as requestId, f.user_id as senderId, f.create_time as createTime, " +
            "u.username, u.nickname, u.avatar " +
            "FROM sys_friend f " +
            "LEFT JOIN sys_user u ON f.user_id = u.id " +
            "WHERE f.friend_id = #{userId} AND f.status = 0")
    List<Map<String, Object>> selectPendingRequests(Long userId);


}