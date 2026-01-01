// src/pages/Auth/Register.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Grid, message, theme } from 'antd';
import { UserOutlined, LockOutlined, SmileOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const screens = useBreakpoint();
  theme.useToken();
  const isPC = screens.md;

  const onFinish = async (values: any) => {
  setLoading(true);
  try {
    // 1. 解构出 confirm，剩下的字段组成 params
    const { confirm, ...params } = values;
    
    // 2. 发送清洗后的数据 (只包含 username, password, nickname)
    await authApi.register(params);
    
    message.success('注册成功，请登录');
    navigate('/login');
  } catch (error) {
    console.error(error);
    // 如果后端返回了具体 msg，request.ts 会自动 message.error 显示
    // 这里不需要额外处理
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
        background: isPC 
          ? 'linear-gradient(135deg, #1890ff 0%, #001529 100%)' 
          : '#f0f2f5',
        overflow: 'hidden',
      }}
    >
      <Card
        bordered={false}
        style={{
          width: isPC ? 420 : '90%',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          padding: isPC ? 20 : 0,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>用户注册</Title>
          <Text type="secondary">创建您的 Novel System 账户</Text>
        </div>

        <Form
          name="register_form"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input prefix={<SmileOutlined />} placeholder="昵称 (如: 张三)" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          
          {/* 确认密码 (前端验证) */}
          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
             <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册并登录
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            已有账号？ <Link to="/login">去登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;