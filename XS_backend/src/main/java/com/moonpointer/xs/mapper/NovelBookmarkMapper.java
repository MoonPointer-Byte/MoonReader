package com.moonpointer.xs.mapper;

import com.moonpointer.xs.entity.SysNovelBookmark;
import org.apache.ibatis.annotations.*;

@Mapper
public interface NovelBookmarkMapper {
    @Select("SELECT * FROM sys_novel_bookmark WHERE user_id = #{userId} AND novel_id = #{novelId}")
    SysNovelBookmark selectByUserIdAndNovelId(@Param("userId") Long userId, @Param("novelId") Long novelId);

    @Insert("INSERT INTO sys_novel_bookmark (user_id, novel_id, byte_offset, update_time) VALUES (#{userId}, #{novelId}, #{byteOffset}, #{updateTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(SysNovelBookmark bookmark);

    @Update("UPDATE sys_novel_bookmark SET byte_offset = #{byteOffset}, update_time = #{updateTime} WHERE id = #{id}")
    void update(SysNovelBookmark bookmark);
}