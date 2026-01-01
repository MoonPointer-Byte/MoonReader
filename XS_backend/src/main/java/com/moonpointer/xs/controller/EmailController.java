package com.moonpointer.xs.controller;
import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.dto.EmailDTO;
import com.moonpointer.xs.entity.SysEmail;
import com.moonpointer.xs.entity.SysEmailConfig;
import com.moonpointer.xs.mapper.EmailConfigMapper;
import com.moonpointer.xs.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;
    private final EmailConfigMapper configMapper;

    // 1. 获取配置 (回显用)
    @GetMapping("/config")
    public Result<SysEmailConfig> getConfig() {
        Long userId = UserContext.getUserId();
        SysEmailConfig config = configMapper.selectByUserId(userId);
        return Result.success(config);
    }

    // 2. 保存配置
    @PostMapping("/config")
    public Result<String> saveConfig(@RequestBody EmailDTO.ConfigReq req) {
        return emailService.saveConfig(req);
    }

    // 3. 发送邮件
    @PostMapping("/send")
    public Result<String> send(@RequestBody EmailDTO.SendReq req) {
        return emailService.sendEmail(req);
    }

    // 4. 同步邮件 (异步)
    @PostMapping("/sync")
    public Result<String> sync() {
        return emailService.syncEmails();
    }

    // 5. 获取收件箱
    @GetMapping("/inbox")
    public Result<List<SysEmail>> getInbox() {
        return emailService.getInbox();
    }
}