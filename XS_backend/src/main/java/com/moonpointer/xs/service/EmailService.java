package com.moonpointer.xs.service;

import com.moonpointer.xs.common.Result;
import com.moonpointer.xs.common.UserContext;
import com.moonpointer.xs.dto.EmailDTO;
import com.moonpointer.xs.entity.SysEmail;
import com.moonpointer.xs.entity.SysEmailConfig;
import com.moonpointer.xs.mapper.EmailConfigMapper;
import com.moonpointer.xs.mapper.EmailMapper;
import jakarta.mail.*;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeUtility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailConfigMapper configMapper;
    private final EmailMapper emailMapper;

    private final ExecutorService emailExecutor = new ThreadPoolExecutor(
            2, 4, 60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(100),
            Executors.defaultThreadFactory(),
            new ThreadPoolExecutor.DiscardOldestPolicy()
    );

    // 1. 保存/更新配置
    @Transactional
    public Result<String> saveConfig(EmailDTO.ConfigReq req) {
        Long userId = UserContext.getUserId();
        SysEmailConfig config = new SysEmailConfig();
        config.setUserId(userId);
        config.setEmailAccount(req.getEmailAccount());
        config.setAuthCode(req.getAuthCode());
        config.setSmtpHost(req.getSmtpHost());
        config.setSmtpPort(req.getSmtpPort());
        config.setPop3Host(req.getPop3Host());
        config.setPop3Port(req.getPop3Port());

        if (configMapper.selectByUserId(userId) == null) {
            configMapper.insert(config);
        } else {
            configMapper.update(config);
        }
        return Result.success("邮箱配置已保存");
    }

    // 2. 发送邮件 (SMTP)
    public Result<String> sendEmail(EmailDTO.SendReq req) {
        Long userId = UserContext.getUserId();
        SysEmailConfig config = configMapper.selectByUserId(userId);
        if (config == null) return Result.error(400, "请先配置邮箱");

        try {
            // 动态构建 Sender
            JavaMailSenderImpl sender = new JavaMailSenderImpl();
            sender.setHost(config.getSmtpHost());
            sender.setPort(config.getSmtpPort());
            sender.setUsername(config.getEmailAccount());
            sender.setPassword(config.getAuthCode());
            sender.setDefaultEncoding("UTF-8");

            Properties props = sender.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            // 关键：SSL 配置 (QQ邮箱/Gmail必须)
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.timeout", "5000");

            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(config.getEmailAccount());
            helper.setTo(req.getTo());
            helper.setSubject(req.getSubject());
            helper.setText(req.getContent(), true); // true = 支持HTML

            sender.send(message);
            return Result.success("发送成功");
        } catch (Exception e) {
            log.error("邮件发送失败", e);
            return Result.error(500, "发送失败: " + e.getMessage());
        }
    }

    // 3. 触发异步同步 (POP3)
    public Result<String> syncEmails() {
        Long userId = UserContext.getUserId();
        SysEmailConfig config = configMapper.selectByUserId(userId);
        if (config == null) return Result.error(400, "请先配置邮箱");

        // 使用 CompletableFuture 提交任务到线程池
        // 注意：这里不能在异步线程里使用 UserContext，必须通过参数传递 userId
        CompletableFuture.runAsync(() -> doFetchPop3(userId, config), emailExecutor);

        return Result.success("正在后台同步邮件...");
    }

    // 4. 获取邮件列表
    public Result<List<SysEmail>> getInbox() {
        Long userId = UserContext.getUserId();
        List<SysEmail> list = emailMapper.selectByUserId(userId);
        return Result.success(list);
    }


    private void doFetchPop3(Long userId, SysEmailConfig config) {
        Store store = null;
        Folder folder = null;
        try {
            Properties props = new Properties();
            props.put("mail.store.protocol", "pop3");
            props.put("mail.pop3.ssl.enable", "true");
            props.put("mail.pop3.host", config.getPop3Host());
            props.put("mail.pop3.port", config.getPop3Port());

            Session session = Session.getInstance(props);
            store = session.getStore("pop3");
            store.connect(config.getPop3Host(), config.getEmailAccount(), config.getAuthCode());

            folder = store.getFolder("INBOX");
            folder.open(Folder.READ_ONLY);

            Message[] messages = folder.getMessages();
            int total = messages.length;
            int start = Math.max(1, total - 19);

            for (int i = total; i >= start; i--) {
                Message msg = messages[i - 1];

                // 去重检查 (通过 Message-ID 或 主题+时间)
                // 这里简化：使用 Subject + SentDate
                String subject = msg.getSubject();
                Date sentDate = msg.getSentDate();
                if (sentDate == null) sentDate = new Date();

                Long exists = emailMapper.countByUniqueKey(userId, subject, sentDate);

                if (exists > 0) continue; // 已存在

                // 解析邮件
                SysEmail email = new SysEmail();
                email.setUserId(userId);
                email.setSubject(subject);
                email.setSentDate(sentDate);
                email.setSender(parseFrom(msg.getFrom()));
                // 解析正文 (这是一个复杂的过程，这里简化处理)
                email.setContent(parseContent(msg));
                email.setHasAttachment(0); // 暂不处理附件下载

                emailMapper.insert(email);
            }
        } catch (Exception e) {
            log.error("POP3 同步异常: User-{}", userId, e);
        } finally {
            try {
                if (folder != null && folder.isOpen()) folder.close(false);
                if (store != null && store.isConnected()) store.close();
            } catch (Exception e) { /* ignore */ }
        }
    }

    // 解析发件人
    private String parseFrom(Address[] addresses) throws Exception {
        if (addresses == null || addresses.length == 0) return "";
        return MimeUtility.decodeText(addresses[0].toString());
    }

    // 简易解析正文 (递归处理 Multipart)
    private String parseContent(Part part) throws Exception {
        if (part.isMimeType("text/plain")) {
            return part.getContent().toString();
        } else if (part.isMimeType("text/html")) {
            return part.getContent().toString();
        } else if (part.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) part.getContent();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);
                // 优先取 Text/Html
                if (bodyPart.isMimeType("text/plain") || bodyPart.isMimeType("text/html")) {
                    sb.append(parseContent(bodyPart));
                }
            }
            return sb.length() > 0 ? sb.toString() : "[复杂邮件或纯附件]";
        }
        return "[不支持的格式]";
    }
}