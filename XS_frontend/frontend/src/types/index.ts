// src/types/index.ts

// 1. 通用响应包装 (Result Wrapper)
export interface Result<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 2. 用户信息
export interface UserInfo {
  id: number;           // 对应 Long id
  username: string;     // 对应 String username
  nickname: string;     // 对应 String nickname
  avatar?: string;      // 对应 String avatar (可能为空，所以加 ?)
  role?: string;        // 对应 String role
  status?: number;      // 对应 Integer status
  createTime?: string;  // 对应 LocalDateTime (前端接收通常是字符串格式)
  
  // 如果你的登录接口会把 token 一起返回在这个对象里，可以加上它
  token?: string;     
}

// 3. 登录成功响应
export interface LoginRes {
  token: string;
  userInfo: UserInfo;
}

// 4. 小说列表项
export interface NovelItem {
  id: number;
  title: string;
  fileSize: number;
  uploaderName: string;
}

// 5. 小说内容片段
export interface NovelContent {
  novelId: number;
  content: string;
  currentStart: number;
  nextStart: number;
  totalSize: number;
  progress: number;
}