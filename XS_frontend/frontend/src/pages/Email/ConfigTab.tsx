// src/pages/Email/ConfigTab.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Alert, Grid} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { emailApi } from '../../api';

const { useBreakpoint } = Grid;

const ConfigTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
 // const { token } = theme.useToken();
  const screens = useBreakpoint();
  
  // ✅ 适配判断：手机端
  const isMobile = screens.md === false;

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 将端口转为数字处理（可选，视后端需求定）
      const formattedValues = {
        ...values,
        smtpPort: parseInt(values.smtpPort, 10),
        pop3Port: parseInt(values.pop3Port, 10),
      };
      await emailApi.saveConfig(formattedValues);
      message.success('配置已保存');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      bordered={!isMobile} 
      title={isMobile ? undefined : "邮箱服务设置"} // 手机端通常作为 Tab 内容，不重复显示标题
      // ✅ 适配：手机端减小卡片内边距
      styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
      style={{ background: 'transparent' }}
    >
    {!isMobile &&(<Alert 
        message="配置提示" 
        description="请使用支持 POP3/SMTP 的邮箱（如 QQ、163），并填入授权码（非登录密码）。" 
        type="info" 
        showIcon 
        style={{ marginBottom: 20, fontSize: isMobile ? '13px' : '14px' }}
      />)}
      
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          smtpPort: 465,
          pop3Port: 995,
          smtpHost: 'smtp.qq.com',
          pop3Host: 'pop.qq.com'
        }}
        // ✅ 适配：手机端去掉最大宽度限制，占满可用空间
        style={{ maxWidth: isMobile ? '100%' : 600 }}
      >
        <Form.Item label="邮箱账号" name="emailAccount" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]}>
          <Input placeholder="example@qq.com" size={isMobile ? 'middle' : 'large'} />
        </Form.Item>
        
        <Form.Item label="授权码 (非密码)" name="authCode" rules={[{ required: true, message: '请输入授权码' }]}>
          <Input.Password placeholder="请输入邮箱授权码" size={isMobile ? 'middle' : 'large'} />
        </Form.Item>

        {/* ✅ SMTP 组合适配：手机端垂直堆叠，电脑端并排 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: isMobile ? 0 : 16 
        }}>
          <Form.Item label="SMTP 服务器" name="smtpHost" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="smtp.xxx.com" />
          </Form.Item>
          <Form.Item label="SMTP 端口" name="smtpPort" rules={[{ required: true }]} style={{ width: isMobile ? '100%' : 120 }}>
            <Input type="number" placeholder="465" />
          </Form.Item>
        </div>

        {/* ✅ POP3 组合适配：手机端垂直堆叠，电脑端并排 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: isMobile ? 0 : 16 
        }}>
          <Form.Item label="POP3 服务器" name="pop3Host" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="pop.xxx.com" />
          </Form.Item>
          <Form.Item label="POP3 端口" name="pop3Port" rules={[{ required: true }]} style={{ width: isMobile ? '100%' : 120 }}>
            <Input type="number" placeholder="995" />
          </Form.Item>
        </div>

        <Form.Item style={{ marginTop: 12 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            icon={<SaveOutlined />} 
            block={isMobile} // ✅ 适配：手机端按钮占满一行，方便点击
            size="large"
          >
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ConfigTab;