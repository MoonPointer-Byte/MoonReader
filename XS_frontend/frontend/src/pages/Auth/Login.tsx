// src/pages/Auth/Login.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Grid, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate,Link } from 'react-router-dom';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [loading, setLoading] = useState(false);
  const screens = useBreakpoint();
  const { token } = theme.useToken();

  // 判断是否为 PC 端 (md及以上算PC)
  const isPC = screens.md;

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data = await authApi.login(values);
      setLogin(data.token, data.userInfo);
      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        // PC 端给个漂亮的渐变背景，移动端简单一点
        background: isPC 
          ? 'linear-gradient(135deg, #1890ff 0%, #001529 100%)' 
          : '#f0f2f5',
        overflow: 'hidden',
      }}
    >
      <Card
        bordered={false}
        style={{
          // 核心修复：PC端固定宽，移动端适配宽
          width: isPC ? 420 : '90%',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', // 加深阴影增加立体感
          padding: isPC ? 20 : 0, // PC端内部多点留白
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Logo 占位 */}
          <div style={{ marginBottom: 12 }}>
             <span style={{ fontSize: 36, color: token.colorPrimary }}>📚</span>
          </div>
          <Title level={3} style={{ margin: 0 }}>My Novel System</Title>
          <Text type="secondary">欢迎回来，请登录您的账户</Text>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: token.colorTextDescription }} />} 
              placeholder="请输入用户名" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: token.colorTextDescription }} />} 
              placeholder="请输入密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 8 }}>
              立即登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            没有账号？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </Card>

      {/* PC 端底部版权信息 (可选) */}
      {isPC && (
        <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          © 2025 Novel System. All Rights Reserved.
        </div>
      )}
    </div>
  );
};

export default Login;