import React, { useEffect, useState} from 'react';
import type{CSSProperties } from 'react';
import { 
  Table, Button, message,  Modal, 
  Descriptions, Divider, Typography, theme, Grid 
} from 'antd';
import { 
  SyncOutlined, ReloadOutlined, EyeOutlined 
} from '@ant-design/icons';
import { emailApi } from '../../api';

const { useBreakpoint } = Grid;

interface EmailItem {
  id: string | number;
  sender: string;
  subject: string;
  receivedTime: string;
  content: string;
}

const InboxTab: React.FC = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  
  // ✅ 适配判断：手机端
  const isMobile = screens.md === false;

  const [data, setData] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<EmailItem | null>(null);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await emailApi.getInbox();
      setData(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await emailApi.sync();
      message.success('同步任务已在后台启动');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSyncing(false), 3000);
    }
  };

  const handleView = (record: EmailItem) => {
    setCurrentEmail(record);
    setViewModalOpen(true);
  };

  // ✅ 适配：根据屏幕尺寸动态定义表格列
  const columns = [
    { 
      title: '发件人', 
      dataIndex: 'sender', 
      width: isMobile ? 100 : 220, 
      ellipsis: true 
    },
    { 
      title: '主题', 
      dataIndex: 'subject',
      ellipsis: true, 
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    // ✅ 手机端隐藏“接收时间”列，以腾出横向空间
    ...(!isMobile ? [
      { title: '接收时间', dataIndex: 'receivedTime', width: 180 }
    ] : []),
    { 
      title: '操作', 
      key: 'action', 
      width: isMobile ? 60 : 100,
      align: 'center' as const,
      render: (_: any, record: EmailItem) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => handleView(record)}
        >
          {isMobile ? '' : '查看'}
        </Button> 
      )
    }
  ];

  // ================= 样式优化 =================
  const styles = {
    wrapper: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as CSSProperties['flexDirection'],
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      // ✅ 适配：手机端缩小内边距
      padding: isMobile ? '12px' : '24px', 
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      overflow: 'hidden',
      boxSizing: 'border-box' as CSSProperties['boxSizing'],
    },
    header: {
      marginBottom: 16,
      display: 'flex',
      justifyContent: 'space-between',
      flexShrink: 0,
      gap: 8
    },
    tableContainer: {
      flex: 1,
      overflow: 'hidden',
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* 头部操作栏 */}
      <div style={styles.header}>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 10 }}>
          <Button 
            type="primary" 
            icon={<SyncOutlined spin={syncing} />} 
            onClick={handleSync} 
            loading={syncing}
            size={isMobile ? 'small' : 'middle'}
          >
            {isMobile ? '同步' : '同步邮件'}
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchInbox} 
            loading={loading}
            size={isMobile ? 'small' : 'middle'}
          />
        </div>
      </div>

      {/* 表格区域 */}
      <div style={styles.tableContainer}>
        <Table 
          rowKey="id"
          columns={columns} 
          dataSource={data} 
          loading={loading}
          size={isMobile ? 'small' : 'middle'}
          pagination={{ 
            pageSize: isMobile ? 3 : 5, 
            simple: isMobile, // ✅ 手机端使用简单分页
            showSizeChanger: !isMobile, 
            showTotal: (total) => isMobile ? `${total}条` : `共 ${total} 条` 
          }}
          // 手机端如果依然觉得挤，可以开启横向滚动，但目前列精简后通常不需要
          scroll={isMobile ? { x: 400 } : undefined} 
        />
      </div>

      {/* 详情弹窗 */}
      <Modal
        title="邮件详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[<Button key="close" onClick={() => setViewModalOpen(false)}>关闭</Button>]}
        width={isMobile ? '95%' : 800} // ✅ 适配：手机端 95% 宽度
        centered
        bodyStyle={{ padding: isMobile ? '12px 8px' : '24px' }}
      >
        {currentEmail && (
          <div>
            <Descriptions 
              column={1} 
              bordered={!isMobile} 
              size="small" 
              layout={isMobile ? "vertical" : "horizontal"}
            >
              <Descriptions.Item label="主题">
                <Typography.Text strong>{currentEmail.subject}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="发件人">{currentEmail.sender}</Descriptions.Item>
              <Descriptions.Item label="时间">{currentEmail.receivedTime}</Descriptions.Item>
            </Descriptions>
            
            <Divider dashed style={{ margin: isMobile ? '12px 0' : '24px 0' }} />
            
            <div 
              style={{ 
                minHeight: isMobile ? '150px' : '200px', 
                maxHeight: isMobile ? '50vh' : '60vh', 
                overflowY: 'auto',
                padding: isMobile ? '10px' : '16px', 
                background: token.colorFillAlter, // 适配系统颜色
                borderRadius: '8px',
                border: `1px solid ${token.colorBorderSecondary}`,
                wordBreak: 'break-word' // ✅ 适配：防止长单词撑破布局
              }}
            >
              {/* 邮件正文适配 */}
              <div 
                className="email-content-wrapper"
                style={{ fontSize: isMobile ? '14px' : '16px', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: currentEmail.content }} 
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InboxTab;