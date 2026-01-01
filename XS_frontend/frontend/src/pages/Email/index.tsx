import React from 'react';
import { Tabs, theme, Grid } from 'antd'; // 1. 引入 Grid 用于响应式判断
import { SettingOutlined, SendOutlined, InboxOutlined } from '@ant-design/icons';
import ConfigTab from './ConfigTab';
import SendTab from './SendTab';
import InboxTab from './InboxTab';

const { useBreakpoint } = Grid;

const EmailPage: React.FC = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  
  // ✅ 适配判断：md (768px) 以下视为手机端
  const isMobile = screens.md === false;

  const items = [
    {
      key: '1',
      // ✅ 手机端如果空间极度有限，可以考虑只显示图标，但目前保留图标+文字
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <InboxOutlined />
          <span>收件箱</span>
        </span>
      ),
      children: <InboxTab />,
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SendOutlined />
          <span>写邮件</span>
        </span>
      ),
      children: <SendTab />,
    },
    {
      key: '3',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SettingOutlined />
          <span>配置</span>
        </span>
      ),
      children: <ConfigTab />,
    },
  ];

  return (
    <div 
      style={{ 
        background: token.colorBgContainer, 
        color: token.colorText,
        // ✅ 适配：手机端使用 12px 内边距，电脑端保持 24px
        padding: isMobile ? '16px 12px' : 24, 
        minHeight: isMobile ? 'auto' : 360,
        borderRadius: isMobile ? token.borderRadius : token.borderRadiusLG,
        border: isMobile ? `1px solid ${token.colorBorderSecondary}` : `1px solid ${token.colorBorder}`,
        // 确保移动端内容不溢出
        overflowX: 'hidden'
      }}
    >
      <Tabs 
        defaultActiveKey="1" 
        items={items} 
        // ✅ 适配：手机端使用更紧凑的尺寸
        size={isMobile ? "small" : "middle"}
        // ✅ 适配：手机端缩小标签之间的间距
        tabBarGutter={isMobile ? 16 : 32}
        // 允许左右滑动切换标签（Antd 默认支持，此处确保样式不干扰）
        style={{ marginBottom: 0 }}
      />
    </div>
  );
};

export default EmailPage;