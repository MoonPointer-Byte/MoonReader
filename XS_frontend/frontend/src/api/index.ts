// src/api/index.ts
import request from '../utils/request';
import type{ LoginRes, Result } from '../types';
import type { NovelItem, NovelContent } from '../types';

// --- 认证模块 ---
export const authApi = {
  // 登录
  login: (params: { username: string; password: string }) => 
    request.post<any, LoginRes>('/auth/login', params),
  
  // 注册
  register: (params: { username: string; password: string; nickname: string }) =>
    request.post<any, null>('/auth/register', params),
    
  // 登出
  logout: () => request.post('/auth/logout'),
};

// --- 管理员模块 (预留) ---
export const adminApi = {
  // 上传小说 (FormData)
  uploadNovel: (formData: FormData) => 
    request.post('/admin/novels/upload', formData), // 获取用户列表
  getUsers: (params: { page: number; size: number; keyword?: string }) => 
    request.get('/admin/users', { params }),

  // 封禁/解封用户 (status: 0封禁, 1正常)
  changeStatus: (userId: number, status: number) => 
    request.put(`/admin/users/${userId}/status`, { status }),

};

export const novelApi = {
  // 1. 获取小说列表
  getList: () => 
    request.get<any, NovelItem[]>('/novel/list'),

  // 2. 获取内容 (核心)
  // start: 起始字节位置, size: 读取长度 (推荐 2000-5000)
  getContent: (params: { novelId: number; start: number; size: number }) => 
    request.get<any, NovelContent>('/novel/content', { params }),

  // 3. 获取书签 (返回 { byteOffset: 12345 })
  getBookmark: (novelId: number) => 
    request.get<any, { byteOffset: number }>(`/novel/bookmark/${novelId}`),

  // 4. 保存书签
  addBookmark: (data: { novelId: number; byteOffset: number }) => 
    request.post('/novel/bookmark', data),
};

// ================= 4. 聊天模块 =================
export const chatApi = {
  // 获取在线用户列表
  getOnlineUsers: () => 
    request.get<any, any[]>('/chat/friends'),

  // 上传图片 (返回URL)
  uploadImage: (formData: FormData) => 
    request.post<any, { url: string }>('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } // 注意：这里通常由浏览器自动处理，如果报错去掉此行
    }),
};

// ================= 5. 邮件模块 =================
export const emailApi = {
  // 1. 保存邮箱配置
  saveConfig: (data: any) => 
    request.post('/email/config', data),

  // 2. 发送邮件
  send: (data: { to: string; subject: string; content: string }) => 
    request.post('/email/send', data),

  // 3. 触发同步 (异步任务)
  sync: () => 
    request.post('/email/sync'),

  // 4. 获取收件箱列表
  getInbox: () => 
    request.get<any, any[]>('/email/inbox'),
};