package com.moonpointer.xs.mapper;
import com.moonpointer.xs.entity.SysNovel;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface NovelMapper {
    @Select("SELECT * FROM sys_novel WHERE is_deleted = 0 ORDER BY create_time DESC")
    List<SysNovel> selectActiveNovels();

    @Select("SELECT * FROM sys_novel WHERE id = #{id}")
    SysNovel selectById(Long id);

    @Insert("INSERT INTO sys_novel (title, file_name, original_name, file_size, uploader_id, is_deleted, create_time) VALUES (#{title}, #{fileName}, #{originalName}, #{fileSize}, #{uploaderId}, #{isDeleted}, #{createTime})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(SysNovel novel);

    @Update("UPDATE sys_novel SET title=#{title}, file_name=#{fileName}, original_name=#{originalName}, file_size=#{fileSize}, uploader_id=#{uploaderId}, is_deleted=#{isDeleted}, create_time=#{createTime} WHERE id=#{id}")
    void update(SysNovel novel);
}