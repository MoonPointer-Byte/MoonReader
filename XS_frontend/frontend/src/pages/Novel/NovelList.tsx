import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography, Input, theme, Skeleton, Empty,
  Dropdown, Button, Tooltip, Grid
} from 'antd';
import {
  SearchOutlined,
  SortAscendingOutlined,
  MoreOutlined,
  DeleteOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { novelApi } from '../../api';
import type { NovelItem } from '../../types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// ================= 辅助：生成确定性的随机渐变色 =================
const getBookCoverStyle = (id: number, isDark: boolean) => {
  const gradients = isDark ? [
    'linear-gradient(135deg, #1f1c2c, #928dab)',
    'linear-gradient(135deg, #232526, #414345)',
    'linear-gradient(135deg, #0f2027, #2c5364)',
    'linear-gradient(135deg, #200122, #6f0000)',
    'linear-gradient(135deg, #000428, #004e92)',
  ] : [
    'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  ];
  return gradients[id % gradients.length];
};

const NovelList: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const screens = useBreakpoint();

  // ✅ 适配判断：竖屏或小屏
  const isMobile = screens.md === false;

  const [list, setList] = useState<NovelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [hoverId, setHoverId] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await novelApi.getList();
        setList(data);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    init();
  }, []);

  const filteredList = useMemo(() => {
    if (!searchText) return list;
    return list.filter(item => item.title.toLowerCase().includes(searchText.toLowerCase()));
  }, [list, searchText]);

  const isDark = token.colorBgContainer === '#141414';

  return (
    <div style={{
      width: '100%',
      maxWidth: 1800,
      margin: '0 auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: isMobile ? '12px 16px 0 16px' : '24px 32px 0 32px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* 头部区域 */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        marginBottom: isMobile ? 12 : 24,
        paddingBottom: 16,
        borderBottom: isMobile ? 'none' : `1px solid ${token.colorBorderSecondary}`,
        flexShrink: 0,
        gap: isMobile ? 12 : 0
      }}>
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
              书架集合
            </Title>
            <Text type="secondary" style={{ marginTop: 4, fontSize: 12 }}>
              {list.length} 本书籍
            </Text>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto' }}>
          <Input
            prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
            placeholder="搜寻书籍..."
            variant="filled"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: isMobile ? '100%' : 240, borderRadius: 20, height: isMobile ? 36 : 40 }}
          />
          {!isMobile && (
            <Tooltip title="排序">
              <Button shape="circle" icon={<SortAscendingOutlined />} type="text" />
            </Tooltip>
          )}
        </div>
      </div>

      {/* 滚动区域 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: isMobile ? 80 : 24,
        paddingRight: isMobile ? 0 : 8,
        minHeight: 0
      }}>
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: isMobile ? '16px' : '24px'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <Skeleton.Button active style={{ width: '100%', height: 180, borderRadius: 8 }} />
                <Skeleton active paragraph={{ rows: 1 }} title={false} style={{ marginTop: 10 }} />
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 100 }} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: isMobile ? '20px 12px' : '24px',
            justifyContent: 'start'
          }}>
            {filteredList.map((item) => {
              const isHover = hoverId === item.id;

              return (
                <div
                  key={item.id}
                  style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                  onMouseEnter={() => !isMobile && setHoverId(item.id)}
                  onMouseLeave={() => !isMobile && setHoverId(null)}
                  onClick={() => navigate(`/novel/read/${item.id}`)}
                >
                  {/* 书籍封面 */}
                  <div style={{
                    width: '100%',
                    aspectRatio: isMobile ? '3 / 4.2' : '2 / 3',
                    borderRadius: isMobile ? '4px 8px 8px 4px' : '6px 12px 12px 6px',
                    background: getBookCoverStyle(item.id, isDark),
                    boxShadow: (isHover && !isMobile) ? `0 12px 24px -8px rgba(0,0,0,0.4)` : `0 4px 10px -4px rgba(0,0,0,0.2)`,
                    transform: (isHover && !isMobile) ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    border: `1px solid ${token.colorBorderSecondary}`
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: isMobile ? 8 : 12, background: 'rgba(0,0,0,0.15)',
                      zIndex: 2, boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{
                      padding: isMobile ? '16px 10px 16px 16px' : '20px 16px 20px 24px',
                      color: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)',
                      fontWeight: 700, fontSize: isMobile ? 14 : 16, lineHeight: 1.4,
                      height: '100%', display: 'flex', flexDirection: 'column',
                      justifyContent: 'flex-start', wordBreak: 'break-all', overflow: 'hidden'
                    }}>
                      {item.title}
                    </div>
                    {!isMobile && (
                      <div style={{
                        position: 'absolute', bottom: 12, right: 12,
                        width: 36, height: 36, borderRadius: '50%',
                        background: token.colorBgContainer, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        opacity: isHover ? 1 : 0, transition: '0.3s'
                      }}>
                        <ReadOutlined style={{ color: token.colorPrimary }} />
                      </div>
                    )}
                  </div>

                  {/* 元数据信息 */}
                  <div style={{ marginTop: 10, width: '100%', padding: '0 2px' }}>
                    <div style={{
                      fontSize: isMobile ? 13 : 15,
                      fontWeight: 600,
                      color: token.colorText,
                      marginBottom: 4,
                      // ✅ 解决手机端两行显示的语法兼容性写法
                      display: '-webkit-box',
                      WebkitLineClamp: isMobile ? 2 : 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      height: isMobile ? '2.8em' : '1.5em',
                      lineHeight: '1.4em'
                    } as React.CSSProperties}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {(item.fileSize / 1024).toFixed(1)} KB
                      </Text>
                      <div onClick={e => e.stopPropagation()}>
                        <Dropdown
                          menu={{
                            items: [{ key: 'del', label: '移除', icon: <DeleteOutlined />, danger: true }]
                          }}
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <Button type="text" size="small" icon={<MoreOutlined style={{ fontSize: 18 }} />} style={{ padding: '0 4px', height: 'auto' }} />
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NovelList;