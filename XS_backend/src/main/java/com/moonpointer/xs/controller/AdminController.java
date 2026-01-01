package com.moonpointer.xs.controller;
import com.moonpointer.xs.common.PageResult;
import com.moonpointer.xs.annotation.RequireAdmin;
import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.entity.SysUser;
import com.moonpointer.xs.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // 获取用户列表
    @RequireAdmin // 必须是管理员
    @GetMapping("/users")
    public Result<PageResult<SysUser>> getUserList(@RequestParam(defaultValue = "1") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        return adminService.getUserList(page, size);
    }

    // 封禁/解封用户
    @RequireAdmin
    @PutMapping("/user/{userId}/status")
    public Result<String> updateUserStatus(@PathVariable Long userId, @RequestBody StatusDTO dto) {
        return adminService.updateUserStatus(userId, dto.getStatus());
    }

    // 上传小说
    @RequireAdmin
    @PostMapping("/novels/upload")
    public Result<String> uploadNovel(@RequestParam("file") MultipartFile file,
                                      @RequestParam(required = false) String title) {
        return adminService.uploadNovel(file, title);
    }

    // 简单的内部 DTO
    @lombok.Data
    static class StatusDTO {
        private Integer status;
    }
}