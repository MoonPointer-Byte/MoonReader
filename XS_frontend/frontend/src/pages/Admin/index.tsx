// src/pages/Admin/index.tsx
import React from 'react';
import { Tabs } from 'antd';
import { CloudUploadOutlined, TeamOutlined } from '@ant-design/icons';
import UploadTab from './UploadTab';
import UserTab from './UserTab';

const AdminPage: React.FC = () => {
  const items = [
    { key: '1', label: <span><CloudUploadOutlined />小说上传</span>, children: <UploadTab /> },
    { key: '2', label: <span><TeamOutlined />用户管理</span>, children: <UserTab /> },
  ];
  return <Tabs defaultActiveKey="1" items={items} />;
};
export default AdminPage;