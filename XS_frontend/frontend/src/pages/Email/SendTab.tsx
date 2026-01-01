// src/pages/Email/SendTab.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { emailApi } from '../../api';

const { TextArea } = Input;

const SendTab: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await emailApi.send(values);
      message.success('邮件发送成功');
      form.resetFields();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card bordered={false} title="发送邮件">
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 800 }}>
        <Form.Item label="收件人" name="to" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="recipient@example.com" />
        </Form.Item>
        
        <Form.Item label="主题" name="subject" rules={[{ required: true }]}>
          <Input placeholder="请输入邮件主题" />
        </Form.Item>

        <Form.Item label="正文内容" name="content" rules={[{ required: true }]}>
          <TextArea rows={10} placeholder="请输入邮件内容..." showCount maxLength={2000} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
            发送
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SendTab;