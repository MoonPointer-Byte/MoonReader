import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, Slider, message, Skeleton, 
  theme, Popover, Space, Radio,  ConfigProvider, Grid
} from 'antd';
import { 
  SettingOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { novelApi } from '../../api';

const { useBreakpoint } = Grid;

// 主题配置
const THEMES = {
  default: { name: '标准', bg: 'transparent', text: '' },
  light:   { name: '纯白', bg: '#ffffff', text: '#333333', border: '#eee' },
  warm:    { name: '护眼', bg: '#f5f1e8', text: '#5c5b59', border: '#e8e4db' },
  dark:    { name: '夜间', bg: '#1a1a1a', text: '#b3b3b3', border: '#333' },
};

const Reader: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const isMobile = screens.md === false;
  
  // 状态管理
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(isMobile ? 18 : 20);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [readTheme, setReadTheme] = useState<'default' | 'light' | 'warm' | 'dark'>('default');

  const [, setCurrentStart] = useState(0);
  const [nextStart, setNextStart] = useState(0);
  const historyStack = useRef<number[]>([]); 
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ✅ 手势处理相关的 Ref
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      try {
        const bookmark = await novelApi.getBookmark(Number(id));
        loadData(bookmark?.byteOffset || 0, true);
      } catch {
        loadData(0, true);
      }
    };
    init();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  // ✅ 手势事件监听：开始触摸
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  // ✅ 手势事件监听：触摸结束
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return; // 仅手机端启用手势翻页

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX.current; // 水平位移
    const dy = touchEndY - touchStartY.current; // 垂直位移

    // 逻辑：
    // 1. 水平位移必须大于垂直位移（防止上下滚动时误触翻页）
    // 2. 位移绝对值必须超过一定阈值（如 60px）
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) {
        // 向左划 -> 下一页
        handleNext();
      } else {
        // 向右划 -> 上一页
        handlePrev();
      }
    }
  };

  const loadData = async (start: number, isForward: boolean) => {
    setLoading(true);
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
    try {
      const res = await novelApi.getContent({ novelId: Number(id), start, size: 3000 });
      setContent(res.content);
      setProgress(res.progress);
      setCurrentStart(res.currentStart);
      setNextStart(res.nextStart);
      if (isForward && historyStack.current[historyStack.current.length - 1] !== start) {
           historyStack.current.push(start);
      }
      novelApi.addBookmark({ novelId: Number(id), byteOffset: start });
    } catch(e) {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (historyStack.current.length <= 1) {
        message.info('已经是第一页');
        return;
    }
    historyStack.current.pop(); 
    loadData(historyStack.current[historyStack.current.length - 1], false); 
  };

  const handleNext = () => {
    if (progress >= 1 && !nextStart) {
        message.success('全书读完');
        return;
    }
    loadData(nextStart, true);
  };

  const currentStyle = {
    bg: readTheme === 'default' ? token.colorBgContainer : THEMES[readTheme].bg,
    text: readTheme === 'default' ? token.colorText : THEMES[readTheme].text,
    subText: readTheme === 'dark' ? '#666' : (readTheme === 'default' ? token.colorTextSecondary : '#999'),
    border: readTheme === 'default' ? token.colorBorderSecondary : THEMES[readTheme].border,
  };

  const settingsContent = (
    <div style={{ width: isMobile ? 220 : 260 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6, fontSize: 12, color: token.colorTextSecondary }}>
            <span>字号</span><span>{fontSize}px</span>
        </div>
        <Slider min={14} max={40} value={fontSize} onChange={setFontSize} tooltip={{ open: false }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 12, color: token.colorTextSecondary }}>行距</div>
        <Radio.Group value={lineHeight} onChange={e => setLineHeight(e.target.value)} size="small" buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
          <Radio.Button value={1.6} style={{ flex: 1, textAlign: 'center' }}>紧</Radio.Button>
          <Radio.Button value={1.8} style={{ flex: 1, textAlign: 'center' }}>中</Radio.Button>
          <Radio.Button value={2.2} style={{ flex: 1, textAlign: 'center' }}>松</Radio.Button>
        </Radio.Group>
      </div>
      <div>
        <div style={{ marginBottom: 8, fontSize: 12, color: token.colorTextSecondary }}>主题</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {Object.entries(THEMES).map(([key, themeObj]) => (
                <div 
                    key={key}
                    onClick={() => setReadTheme(key as any)}
                    style={{
                        width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                        background: key === 'default' ? '#eee' : themeObj.bg,
                        border: readTheme === key ? `2px solid ${token.colorPrimary}` : '1px solid rgba(0,0,0,0.1)',
                        position: 'relative'
                    }}
                >
                   {key === 'default' && <div style={{ position: 'absolute', top: '50%', left: '50%', width: '1px', height: '60%', background: '#999', transform: 'translate(-50%,-50%) rotate(45deg)'}}/>}
                </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <ConfigProvider theme={{ algorithm: readTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        <div 
            ref={scrollContainerRef}
            onTouchStart={onTouchStart} // ✅ 绑定手势
            onTouchEnd={onTouchEnd}     // ✅ 绑定手势
            style={{ 
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                zIndex: 1000, overflowY: 'auto', overflowX: 'hidden',
                background: currentStyle.bg, transition: 'background 0.3s ease',
                color: currentStyle.text, scrollbarWidth: 'none',
            }}
        >
            {/* 顶部栏 */}
            <div style={{ 
                height: isMobile ? 54 : 60, display: 'flex', justifyContent: 'center', 
                borderBottom: `1px solid ${readTheme === 'default' ? 'transparent' : currentStyle.border}`,
                padding: isMobile ? '0 12px' : '0 16px', position: 'sticky', top: 0,
                background: currentStyle.bg, zIndex: 10, transition: 'background 0.3s ease'
            }}>
                <div style={{ width: '100%', maxWidth: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ color: currentStyle.text }}>
                        {!isMobile && '返回'}
                    </Button>
                    <Space size={isMobile ? 8 : 16}>
                        <span style={{ fontSize: 12, color: currentStyle.subText, opacity: 0.8 }}>{(progress * 100).toFixed(1)}%</span>
                        <Popover content={settingsContent} trigger="click" placement="bottomRight" arrow={false}>
                            <Button icon={<SettingOutlined />} type="text" style={{ color: currentStyle.text }} />
                        </Popover>
                    </Space>
                </div>
            </div>

            {/* 正文区域 */}
            <div style={{ 
                maxWidth: 800, margin: '0 auto', 
                padding: isMobile ? '10px 20px 40px' : '30px 40px 60px',
                minHeight: 'calc(100vh - 140px)' 
            }}>
                {loading ? (
                    <Skeleton active paragraph={{ rows: 15 }} title={false} />
                ) : (
                    <div style={{ 
                        fontSize: fontSize, lineHeight: lineHeight, 
                        whiteSpace: 'pre-wrap', textAlign: 'justify', letterSpacing: '0.02em',
                    }}>
                        {content}
                    </div>
                )}
            </div>

            {/* 底部翻页提示 */}
            <div style={{ padding: isMobile ? '10px 20px 60px' : '20px 40px 80px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <Button size="large" onClick={handlePrev} disabled={historyStack.current.length <= 1} style={{ flex: 1, borderRadius: 8 }}>
                        上一页
                    </Button>
                    <Button type="primary" size="large" onClick={handleNext} style={{ flex: 1, borderRadius: 8 }}>
                        下一页
                    </Button>
                </div>
                {isMobile && (
                  <div style={{ textAlign: 'center', marginTop: 16, color: currentStyle.subText, fontSize: 12, opacity: 0.5 }}>
                    — 支持左右滑动翻页 —
                  </div>
                )}
            </div>
        </div>
    </ConfigProvider>
  );
};

export default Reader;