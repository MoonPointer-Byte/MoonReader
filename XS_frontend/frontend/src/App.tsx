// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd'; // ✅ 引入 Antd 主题配置
import { useThemeStore } from './store/themeStore'; // ✅ 引入主题状态管理

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import MainLayout from './layout/MainLayout';
import PrivateRoute from './components/PrivateRoute';

// 引入业务组件
import AdminPage from './pages/Admin';
import NovelList from './pages/Novel/NovelList';
import Reader from './pages/Novel/Reader';
import ChatRoom from './pages/Chat/ChatRoom';
import EmailPage from './pages/Email';

function App() {
  // ✅ 获取当前主题状态 (true: 黑夜, false: 白天)
  const { isDarkMode } = useThemeStore();

  return (
    // ✅ 核心配置：ConfigProvider 会自动将主题样式应用到所有 Antd 组件 (Modal, Button, Input 等)
    <ConfigProvider
      theme={{
        // 根据状态切换算法：darkAlgorithm 会自动把组件变为深色风格
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff', // 全局主色调 (你也可以根据 isDarkMode 动态改变主色)
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 受保护的主布局 */}
          <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            {/* 默认跳转到小说页 */}
            <Route index element={<Navigate to="/novel" replace />} />
            
            {/* 1. 小说模块 */}
            <Route path="novel" element={<NovelList />} />
            <Route path="novel/read/:id" element={<Reader />} />
            
            {/* 2. 后台管理模块 */}
            <Route path="admin" element={<AdminPage />} />
            
            {/* 3. 聊天模块 */}
            <Route path="chat" element={<ChatRoom />} />
            
            {/* 4. 邮件模块 */}
            <Route path="email" element={<EmailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;