-- 1. 用户表
CREATE TABLE `sys_user` (
                            `id` BIGINT NOT NULL AUTO_INCREMENT,
                            `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '账号',
                            `password` VARCHAR(100) NOT NULL COMMENT 'BCrypt加密密码',
                            `nickname` VARCHAR(50) COMMENT '昵称',
                            `role` VARCHAR(20) DEFAULT 'USER' COMMENT '角色: USER, ADMIN',
                            `status` TINYINT DEFAULT 1 COMMENT '1:正常, 0:封禁',
                            `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (`id`)
);
-- 在 sys_user 表中增加 avatar 字段
ALTER TABLE `sys_user`
    ADD COLUMN `avatar` VARCHAR(255) DEFAULT NULL COMMENT '用户头像URL' AFTER `nickname`;

-- 2. 邮件配置表
CREATE TABLE `sys_email_config` (
                                    `user_id` BIGINT NOT NULL,
                                    `smtp_host` VARCHAR(100),
                                    `smtp_port` INT,
                                    `pop3_host` VARCHAR(100),
                                    `pop3_port` INT,
                                    `email_account` VARCHAR(100),
                                    `auth_code` VARCHAR(200) COMMENT '授权码(加密存储)',
                                    PRIMARY KEY (`user_id`)
);

-- 3. 小说信息表 (增加管理字段)
CREATE TABLE `sys_novel` (
                             `id` BIGINT NOT NULL AUTO_INCREMENT,
                             `title` VARCHAR(100) NOT NULL COMMENT '书名',
                             `file_name` VARCHAR(255) NOT NULL COMMENT '磁盘文件名(UUID防止重名)',
                             `original_name` VARCHAR(255) COMMENT '原始文件名',
                             `file_size` BIGINT COMMENT '文件总字节数',
                             `uploader_id` BIGINT COMMENT '上传管理员ID',
                             `is_deleted` TINYINT DEFAULT 0 COMMENT '0:在架, 1:下架',
                             `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
                             PRIMARY KEY (`id`)
);

-- 4. 小说书签表 (用户数据)
CREATE TABLE `sys_novel_bookmark` (
                                      `id` BIGINT NOT NULL AUTO_INCREMENT,
                                      `user_id` BIGINT NOT NULL,
                                      `novel_id` BIGINT NOT NULL,
                                      `byte_offset` BIGINT DEFAULT 0 COMMENT '当前读取的字节位置',
                                      `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                      PRIMARY KEY (`id`),
                                      UNIQUE KEY `uk_read` (`user_id`, `novel_id`)
);

-- 5. 好友关系表
CREATE TABLE `sys_friend` (
                              `id` BIGINT NOT NULL AUTO_INCREMENT,
                              `user_id` BIGINT NOT NULL,
                              `friend_id` BIGINT NOT NULL,
                              `status` TINYINT DEFAULT 0 COMMENT '0:申请, 1:好友, 2:拉黑',
                              PRIMARY KEY (`id`)
);
ALTER TABLE `sys_friend`
    ADD COLUMN `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
-- 6. 聊天记录表
CREATE TABLE `sys_chat_msg` (
                                `id` BIGINT NOT NULL AUTO_INCREMENT,
                                `sender_id` BIGINT NOT NULL,
                                `receiver_id` BIGINT NOT NULL,
                                `content` TEXT,
                                `msg_type` TINYINT DEFAULT 0 COMMENT '0:文本, 1:图片',
                                `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,

                                PRIMARY KEY (`id`)
);
ALTER TABLE `sys_chat_msg`
    ADD COLUMN `is_read` TINYINT DEFAULT 0 COMMENT '0:未读, 1:已读' AFTER `msg_type`;
-- 7. 操作日志表 (新增，用于管理员审计)
CREATE TABLE `sys_log` (
                           `id` BIGINT NOT NULL AUTO_INCREMENT,
                           `user_id` BIGINT COMMENT '操作人ID',
                           `operation` VARCHAR(50) COMMENT '操作类型(如: BAN_USER)',
                           `details` VARCHAR(255) COMMENT '详情',
                           `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
                           PRIMARY KEY (`id`)
);

-- 8. 邮件收件箱表
CREATE TABLE `sys_email` (
                             `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
                             `user_id` bigint(20) NOT NULL COMMENT '所属用户ID',
                             `message_id` varchar(255) DEFAULT NULL COMMENT '邮件唯一标识(UID)',
                             `sender` varchar(255) DEFAULT NULL COMMENT '发件人',
                             `subject` varchar(500) DEFAULT NULL COMMENT '邮件主题',
                             `content` longtext COMMENT '邮件正文(可能包含HTML)',
                             `sent_date` datetime DEFAULT NULL COMMENT '发送时间',
                             `has_attachment` tinyint(1) DEFAULT '0' COMMENT '是否有附件: 0-否, 1-是',
                             PRIMARY KEY (`id`),
                             KEY `idx_user_id` (`user_id`) USING BTREE COMMENT '用户ID索引，优化查询速度'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统邮件收件箱表';