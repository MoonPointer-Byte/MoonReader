import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Dropdown, Avatar, Space, Grid, theme, 
  Badge, Button, Modal, Form, Input, Upload, message, Tooltip, List, Tag, Empty} from 'antd';
import type { MenuProps, UploadProps } from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { 
  BookOutlined, WechatOutlined, MailOutlined, LogoutOutlined,
  SettingOutlined, UserOutlined, BellOutlined, UploadOutlined,
  EditOutlined, LockOutlined, MenuUnfoldOutlined, MenuFoldOutlined,
  UserAddOutlined, CheckOutlined, CloseOutlined,
  SunOutlined, MoonOutlined 
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore'; 
import axios from 'axios';

import type { UserInfo } from '../types/index';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

// ================= 0. 全局配置 (已修复硬编码问题) =================

const getBaseUrl = () => {
  const { hostname, protocol, origin } = window.location;
  // 如果是本地开发环境，指向 8080 端口
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && window.location.port !== '') {
    return `${protocol}//${hostname}:8080`;
  }
  // 如果是外网/CF 访问，直接使用当前域名 (origin)
  // 这样图片请求会经过 Vite 的 proxy 转发或直接访问同域资源
  return origin;
};

const BASE_URL = getBaseUrl();

const getAvatarUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  // 确保路径以 / 开头
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanUrl}`;
};

interface FriendRequest {
  requestId: number;
  senderId: number;
  nickname: string;
  avatar?: string;
  createTime: string;
}

interface SearchUser {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  relationStatus: number; 
}

// ================= 1. 个人中心模态框 =================

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: UserInfo | null;
  token: string | null;
  onUpdateSuccess: (newInfo: Partial<UserInfo>) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose, currentUser, token, onUpdateSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentUser?.avatar);

  useEffect(() => {
    if (visible && currentUser) {
      form.setFieldsValue({ nickname: currentUser.nickname, password: '' });
      setImageUrl(currentUser.avatar);
    }
  }, [visible, currentUser, form]);

  const handleUploadChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'done') {
        const responseData = info.file.response;
        const serverUrl = responseData.data || responseData.result || responseData;
        if (serverUrl && typeof serverUrl === 'string') {
            setImageUrl(serverUrl); 
            message.success('头像上传成功');
        }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const finalAvatar = imageUrl || currentUser?.avatar;
      await axios.put('/api/user/update', {
        nickname: values.nickname,
        avatar: finalAvatar,
        password: values.password
      }, { headers: { Authorization: `Bearer ${token}` } });
      message.success('修改成功');
      onUpdateSuccess({ nickname: values.nickname, avatar: finalAvatar });
      onClose();
    } catch (error) { message.error('修改失败'); } finally { setLoading(false); }
  };

  return (
    <Modal title="个人中心" open={visible} onCancel={onClose} onOk={handleSubmit} confirmLoading={loading} okText="保存" cancelText="取消" width={400} centered>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <Avatar size={80} src={getAvatarUrl(imageUrl)} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
        {/* ✅ 此处 action 也同步使用了动态 BASE_URL */}
        <Upload showUploadList={false} action={`${BASE_URL}/api/chat/upload`} headers={{ Authorization: `Bearer ${token}` }} onChange={handleUploadChange}>
          <Button icon={<UploadOutlined />}>更换头像</Button>
        </Upload>
      </div>
      <Form form={form} layout="vertical">
        <Form.Item label="账号" style={{marginBottom: 12}}><Input value={currentUser?.username} disabled /></Form.Item>
        <Form.Item label="昵称" name="nickname" rules={[{ required: true }]} style={{marginBottom: 12}}><Input prefix={<EditOutlined/>} /></Form.Item>
        <Form.Item label="新密码" name="password" help="留空则不修改" style={{marginBottom: 0}}><Input.Password prefix={<LockOutlined/>} /></Form.Item>
      </Form>
    </Modal>
  );
};

// ================= 2. 主布局组件 =================

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, token, logout, setUserInfo } = useAuthStore();
  
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  const screens = useBreakpoint();
  const { token: { colorText } } = theme.useToken();
  
  const isMobile = screens.md === false;
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isRequestOpen, setRequestOpen] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const themeColors = {
    headerBg: isDarkMode ? '#141414' : '#ffffff',
    siderBg: isDarkMode ? '#141414' : '#ffffff',
    contentBg: isDarkMode ? '#000000' : '#f5f7fa',
    border: isDarkMode ? '#303030' : '#f0f0f0',
    logoText: isDarkMode ? '#177ddc' : '#1677ff',
    cardBg: isDarkMode ? '#1f1f1f' : '#ffffff',
    shadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.05)'
  };

  useEffect(() => { fetchFriendRequests(); }, [token]);

  const fetchFriendRequests = async () => {
    try {
      const res = await axios.get('/api/friend/requests', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.code === 200) setRequests(res.data.data);
    } catch (e) {}
  };

  const handleSearch = async () => {
    if(!searchKeyword) return;
    try {
      const res = await axios.get('/api/friend/search', { params: { keyword: searchKeyword }, headers: { Authorization: `Bearer ${token}` } });
      if(res.data.code===200) {
        const rawData = res.data.data as SearchUser[];
        const uniqueData = Array.from(new Map(rawData.map(item => [item.id, item])).values());
        setSearchResults(uniqueData);
      }
    } catch(e) { message.error("搜索失败"); }
  };

  const sendFriendRequest = async (friendId: number) => {
    try {
      await axios.post('/api/friend/request', { friendId }, { headers: { Authorization: `Bearer ${token}` } });
      message.success("已发送申请");
      setSearchResults(prev => prev.map(u => u.id === friendId ? {...u, relationStatus: 0} : u));
    } catch(e) { message.error("发送失败"); }
  };

  const handleProcessRequest = async (requestId: number, action: number) => {
    try {
      await axios.post('/api/friend/process', { requestId, action }, { headers: { Authorization: `Bearer ${token}` } });
      message.success(action === 1 ? "已同意" : "已拒绝");
      fetchFriendRequests(); 
    } catch(e) { message.error("操作失败"); }
  };

  const handleLogout = () => {
    Modal.confirm({ title: '确认退出', content: '确定要退出当前账号吗？', onOk: () => { logout(); navigate('/login'); } });
  };

  const menuItems = [
    { key: '/novel', icon: <BookOutlined />, label: '阅读' },
    { key: '/chat', icon: <WechatOutlined />, label: '消息' },
    { key: '/email', icon: <MailOutlined />, label: '邮件' },
    ...(userInfo?.role === 'ADMIN' ? [{ key: '/admin', icon: <SettingOutlined />, label: '后台管理' }] : []),
  ];

  const userMenu: MenuProps = {
    items: [
      { key: 'profile', label: '个人中心', icon: <UserOutlined />, onClick: () => setProfileOpen(true) },
      { type: 'divider' },
      { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true, onClick: handleLogout }
    ]
  };

  const MobileTabBar = () => (
    <div style={{ 
      position: 'fixed', bottom: 0, left: 0, width: '100%', height: '56px', 
      background: themeColors.headerBg, 
      borderTop: `1px solid ${themeColors.border}`, 
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)' 
    }}>
      {menuItems.map(item => (
        <div key={item.key} onClick={() => navigate(item.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: location.pathname.startsWith(item.key) ? '#1677ff' : (isDarkMode ? '#888' : '#999'), fontSize: '10px', flex: 1 }}>
          <div style={{ fontSize: '20px', marginBottom: 2 }}>{item.icon}</div><div>{item.label}</div>
        </div>
      ))}
      <div onClick={() => setProfileOpen(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: (isDarkMode ? '#888' : '#999'), fontSize: '10px', flex: 1 }}>
         <Avatar size={22} src={getAvatarUrl(userInfo?.avatar)} icon={<UserOutlined />} /><div>我的</div>
      </div>
    </div>
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <UserProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} currentUser={userInfo} token={token} onUpdateSuccess={(d) => userInfo && setUserInfo({...userInfo, ...d})} />

      <Modal title="添加好友" open={isSearchOpen} onCancel={() => setSearchOpen(false)} footer={null}>
        <Input.Search placeholder="输入账号/昵称搜索" value={searchKeyword} onChange={e=>setSearchKeyword(e.target.value)} onSearch={handleSearch} enterButton />
        <List dataSource={searchResults} style={{marginTop: 16}} rowKey="id" locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无搜索结果" /> }}
          renderItem={item => (
            <List.Item actions={[
              item.relationStatus === 1 ? <Tag color="green">好友</Tag> : item.relationStatus === 0 ? <Tag color="orange">已申请</Tag> : 
              <Button size="small" type="primary" onClick={()=>sendFriendRequest(item.id)}>添加</Button>
            ]}>
               <List.Item.Meta avatar={<Avatar src={getAvatarUrl(item.avatar)} icon={<UserOutlined/>}/>} title={item.nickname} description={`账号: ${item.username}`}/>
            </List.Item>
        )}/>
      </Modal>

      <Modal title="新朋友验证" open={isRequestOpen} onCancel={() => setRequestOpen(false)} footer={null}>
         <List dataSource={requests} rowKey="requestId" locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无新请求" /> }}
            renderItem={item => (
              <List.Item>
                 <List.Item.Meta avatar={<Avatar src={getAvatarUrl(item.avatar)} icon={<UserOutlined/>}/>} title={item.nickname} description={item.createTime?.substring(5,16)}/>
                 <Space>
                   <Button size="small" danger icon={<CloseOutlined/>} onClick={() => handleProcessRequest(item.requestId, 2)}/>
                   <Button size="small" type="primary" icon={<CheckOutlined/>} onClick={() => handleProcessRequest(item.requestId, 1)}/>
                 </Space>
              </List.Item>
         )}/>
      </Modal>

      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={220} 
          style={{ height: '100vh', borderRight: `1px solid ${themeColors.border}`, background: themeColors.siderBg }}
        >
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: themeColors.logoText, fontSize: 18, fontWeight: 'bold', borderBottom: `1px solid ${themeColors.border}` }}>
             <BookOutlined style={{fontSize: 24}} />{!collapsed && <span>MoonReader</span>}
          </div>
          <Menu theme={isDarkMode ? 'dark' : 'light'} mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={(e) => navigate(e.key)} style={{ borderRight: 0, marginTop: 10, background: 'transparent' }} />
        </Sider>
      )}

      <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column', background: themeColors.contentBg }}>
        <Header style={{ 
          padding: '0 24px', 
          background: themeColors.headerBg, 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          borderBottom: `1px solid ${themeColors.border}`, 
          height: 64, flexShrink: 0, zIndex: 99 
        }}>
           <div style={{ display: 'flex', alignItems: 'center' }}>
             {!isMobile && React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, { onClick: () => setCollapsed(!collapsed), style: { fontSize: '18px', cursor: 'pointer', marginRight: 20, color: colorText } })}
             {isMobile && <span style={{ fontWeight: 'bold', fontSize: 18, color: colorText }}>MoonReader</span>}
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             
             <Tooltip title={isDarkMode ? "切换到日间模式" : "切换到夜间模式"}>
               <Button 
                 type="text" 
                 shape="circle" 
                 icon={!isDarkMode ? <SunOutlined style={{color: '#faad14'}}/> : <MoonOutlined style={{color: '#1890ff'}}/>} 
                 onClick={toggleTheme}
                 style={{ fontSize: 18 }}
               />
             </Tooltip>

             <Tooltip title="添加好友">
                <Button type="text" shape="circle" icon={<UserAddOutlined style={{fontSize: 18, color: colorText}} />} onClick={() => setSearchOpen(true)}/>
             </Tooltip>

             <Tooltip title="新朋友">
                <Badge count={requests.length} size="small" offset={[-2, 4]}>
                  <Button type="text" shape="circle" icon={<BellOutlined style={{fontSize: 18, color: colorText}} />} onClick={() => setRequestOpen(true)} />
                </Badge>
             </Tooltip>

             <div style={{width: 1, height: 24, background: themeColors.border}}></div>

             <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'all 0.3s' }}>
                <Avatar src={getAvatarUrl(userInfo?.avatar)} icon={<UserOutlined />} style={{border: `1px solid ${themeColors.border}`}}/>
                {!isMobile && <span style={{ fontWeight: 500, fontSize: 14, color: colorText }}>{userInfo?.nickname || userInfo?.username}</span>}
              </Space>
            </Dropdown>
           </div>
        </Header>

        <Content style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '12px' : '20px', background: themeColors.contentBg, paddingBottom: isMobile ? 70 : 20 }}>
           <div style={{ 
             height: '100%', 
             ...(location.pathname.startsWith('/chat') ? {} : { 
               background: themeColors.cardBg, 
               borderRadius: 8, 
               padding: 24, 
               boxShadow: themeColors.shadow,
               minHeight: '100%' 
             }) 
           }}>
              <Outlet />
           </div>
        </Content>

        {isMobile && <MobileTabBar />}
      </Layout>
    </Layout>
  );
};

export default MainLayout;