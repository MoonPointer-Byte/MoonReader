package com.moonpointer.xs.mapper;
import com.moonpointer.xs.entity.SysUser;
import org.apache.ibatis.annotations.*;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper {
    @Select("SELECT COUNT(*) FROM sys_user WHERE username = #{username}")
    long countByUsername(String username);

    @Select("SELECT * FROM sys_user WHERE username = #{username}")
    SysUser selectByUsername(String username);

    @Select("<script>" +
            "SELECT * FROM sys_user WHERE id IN " +
            "<foreach item='id' collection='ids' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    List<SysUser> selectByIds(@Param("ids") Collection<Long> ids);

    @Select("SELECT * FROM sys_user WHERE id = #{id}")
    SysUser selectById(Long id);


    @Select("SELECT COUNT(*) FROM sys_user")
    long countAll();

    // status: NULL/-1=陌生人, 0=申请中, 1=好友
    @Select("SELECT u.id, u.username, u.nickname, u.avatar, " +
            "IFNULL(f.status, -1) as relationStatus " +
            "FROM sys_user u " +
            "LEFT JOIN sys_friend f ON u.id = f.friend_id AND f.user_id = #{currentUserId} " +
            "WHERE (u.username LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%')) " +
            "AND u.id != #{currentUserId}")
    List<Map<String, Object>> searchUsersWithStatus(@Param("currentUserId") Long currentUserId,
                                                    @Param("keyword") String keyword);

    @Insert("INSERT INTO sys_user (username, password, nickname, avatar, role, status, create_time) " +
            "VALUES (#{username}, #{password}, #{nickname}, #{avatar}, #{role}, #{status}, #{createTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(SysUser user);

    @Update("UPDATE sys_user SET " +
            "username=#{username}, " +
            "password=#{password}, " +
            "nickname=#{nickname}, " +
            "avatar=#{avatar}, " +  // 增加这一行
            "role=#{role}, " +
            "status=#{status}, " +
            "create_time=#{createTime} " +
            "WHERE id=#{id}")
    void update(SysUser user);

    @Select("SELECT id, username, nickname, avatar, role, status, create_time " +
            "FROM sys_user " +
            "ORDER BY create_time DESC LIMIT #{limit} OFFSET #{offset}")
    List<SysUser> selectList(@Param("offset") int offset, @Param("limit") int limit);

}