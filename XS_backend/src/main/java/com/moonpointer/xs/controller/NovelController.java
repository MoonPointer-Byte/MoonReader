package com.moonpointer.xs.controller;
import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.dto.NovelDTO;
import com.moonpointer.xs.entity.SysNovel;
import com.moonpointer.xs.service.NovelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/novel")
@RequiredArgsConstructor
public class NovelController {

    private final NovelService novelService;

    // 获取列表
    @GetMapping("/list")
    public Result<List<SysNovel>> getList() {
        return novelService.getNovelList();
    }

    // 阅读内容 (核心)
    @GetMapping("/content")
    public Result<NovelDTO.ReadRes> readContent(NovelDTO.ReadReq req) {
        return novelService.readContent(req);
    }

    // 获取某本书的书签
    @GetMapping("/bookmark/{novelId}")
    public Result<Long> getBookmark(@PathVariable Long novelId) {
        return novelService.getBookmark(novelId);
    }

    // 保存书签
    @PostMapping("/bookmark")
    public Result<String> saveBookmark(@RequestBody NovelDTO.BookmarkReq req) {
        return novelService.saveBookmark(req);
    }
}