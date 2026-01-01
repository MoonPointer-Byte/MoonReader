package com.moonpointer.xs.service;
import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.dto.NovelDTO;
import com.moonpointer.xs.entity.SysNovel;
import com.moonpointer.xs.entity.SysNovelBookmark;
import com.moonpointer.xs.mapper.NovelBookmarkMapper;
import com.moonpointer.xs.mapper.NovelMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class NovelService {

    private final NovelMapper novelMapper;
    private final NovelBookmarkMapper bookmarkMapper;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.novel-path}")
    private String novelBasePath;

    // 1. 获取小说列表 (用户端)
    public Result<List<SysNovel>> getNovelList() {
        // 只查询未删除的
        List<SysNovel> list = novelMapper.selectActiveNovels();
        return Result.success(list);
    }

    public Result<NovelDTO.ReadRes> readContent(NovelDTO.ReadReq req) {
        SysNovel novel = novelMapper.selectById(req.getNovelId());
        if (novel == null) return Result.error(404, "小说不存在");

        String filePath = novelBasePath + novel.getFileName();
        File file = new File(filePath);
        if (!file.exists()) return Result.error(500, "文件丢失");

        // 尝试从 Redis 缓存读取 (Key: "novel:content:{id}:{start}")
        // 实际场景建议缓存文本，这里为了演示 IO 逻辑先略过

        try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
            long fileLength = raf.length();
            long start = req.getStart() != null ? req.getStart() : 0;
            int size = req.getSize() != null ? req.getSize() : 2048; // 默认读 2KB

            // 防止越界
            if (start >= fileLength) {
                return Result.success(new NovelDTO.ReadRes("", start, start, fileLength, 1.0));
            }

            raf.seek(start);
            byte[] buffer = new byte[size];
            int bytesRead = raf.read(buffer);

            if (bytesRead == -1) {
                return Result.success(new NovelDTO.ReadRes("", start, start, fileLength, 1.0));
            }



            int validLength = bytesRead;
            // 如果读满了 buffer，且还没到文件末尾，才需要判断截断
            if (bytesRead == size && start + size < fileLength) {
                int checkIndex = bytesRead - 1;
                while (checkIndex > 0 && (buffer[checkIndex] & 0xC0) == 0x80) {
                    checkIndex--;
                }

                // checkIndex 现在指向最后一个字符的头部
                // 判断这个字符是否完整
                byte head = buffer[checkIndex];
                int charBytes = 0;
                if ((head & 0x80) == 0) charBytes = 1;       // 0xxxxxxx
                else if ((head & 0xE0) == 0xC0) charBytes = 2; // 110xxxxx
                else if ((head & 0xF0) == 0xE0) charBytes = 3; // 1110xxxx
                else if ((head & 0xF8) == 0xF0) charBytes = 4; // 11110xxx

                // 如果 (头部位置 + 该字符应有长度) > 实际读取长度，说明被截断了
                if (checkIndex + charBytes > bytesRead) {
                    // 截断了！这一页有效长度只到 checkIndex
                    validLength = checkIndex;
                }
            }

            // 构建字符串
            String content = new String(buffer, 0, validLength, StandardCharsets.UTF_8);
            long nextStart = start + validLength;

            // 计算进度
            double progress = (double) nextStart / fileLength;

            NovelDTO.ReadRes res = new NovelDTO.ReadRes();
            res.setContent(content);
            res.setCurrentStart(start);
            res.setNextStart(nextStart); // 前端下一页请求这个 offset
            res.setTotalSize(fileLength);
            res.setProgress((double) Math.round(progress * 10000) / 100); // 保留2位小数

            return Result.success(res);

        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(500, "读取文件失败");
        }
    }

    // 3. 保存书签
    public Result<String> saveBookmark(NovelDTO.BookmarkReq req) {
        Long userId = UserContext.getUserId();

        // 查询是否已有书签
        SysNovelBookmark bookmark = bookmarkMapper.selectByUserIdAndNovelId(userId, req.getNovelId());

        if (bookmark == null) {
            bookmark = new SysNovelBookmark();
            bookmark.setUserId(userId);
            bookmark.setNovelId(req.getNovelId());
            bookmark.setByteOffset(req.getByteOffset());
            bookmark.setUpdateTime(LocalDateTime.now());
            bookmarkMapper.insert(bookmark);
        } else {
            bookmark.setByteOffset(req.getByteOffset());
            bookmark.setUpdateTime(LocalDateTime.now());
            bookmarkMapper.update(bookmark);
        }
        return Result.success("书签已保存");
    }

    // 4. 获取书签
    public Result<Long> getBookmark(Long novelId) {
        Long userId = UserContext.getUserId();
        SysNovelBookmark bookmark = bookmarkMapper.selectByUserIdAndNovelId(userId, novelId);

        return Result.success(bookmark != null ? bookmark.getByteOffset() : 0L);
    }
}