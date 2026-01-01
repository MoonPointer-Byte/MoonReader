import React, { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { 
  Input, Button, List, Avatar, Badge, Layout, Empty, 
  Popconfirm, message, Spin,  theme, 
  Image, Grid 
} from 'antd';
import { 
  SendOutlined, UserOutlined, ArrowLeftOutlined, 
  DeleteOutlined, SyncOutlined,
  MessageOutlined, PictureOutlined 
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore'; 
import axios from 'axios'; 

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

// ================= 0. 核心适配配置 =================

const getBaseUrl = () => {
  const { hostname, protocol, origin } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && window.location.port !== '') {
    return `${protocol}//${hostname}:8080`;
  }
  return origin;
};

const BASE_URL = getBaseUrl();
const WS_URL = BASE_URL.replace(/^http/, 'ws') + '/ws';

const MSG_TYPE = {
  TEXT: 0,
  IMAGE: 1,
};

// ================= 工具函数 =================

const getFullUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanUrl}`;
};

const isLikelyImagePath = (content: string) => {
  if (!content) return false;
  const lower = content.trim().toLowerCase();
  return lower.includes('/files/') || 
         lower.includes('/uploads/') || 
         lower.match(/\.(jpeg|jpg|gif|png|bmp|webp|svg)(\?.*)?$/) !== null;
};

// --- 新增辅助提醒函数 ---
const playNotificationSound = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
  audio.play().catch(() => {});
};

let flashTimer: any = null;
const flashTitle = () => {
  if (flashTimer) return;
  const oldTitle = document.title;
  flashTimer = setInterval(() => {
    document.title = document.title === oldTitle ? `【新消息】${oldTitle}` : oldTitle;
  }, 500);
  const stop = () => { clearInterval(flashTimer); flashTimer = null; document.title = oldTitle; window.removeEventListener('mousedown', stop); };
  window.addEventListener('mousedown', stop);
};

// ================= 类型定义 =================

interface Friend {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  online: boolean; 
}

interface ChatMessage {
  id?: number;
  senderId: number;
  receiverId?: number;
  content: string;
  type: number; 
  createTime?: string;
  isRead?: number; 
}

// ================= 组件实现 =================

const ChatRoom: React.FC = () => {
  const { token: authToken, userInfo } = useAuthStore();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  
  const isMobile = screens.md === false;

  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeUser, setActiveUser] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>({});
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState({ friends: false, history: false, uploading: false });
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  
  // --- 新增状态：未读数统计 ---
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = {
    layout: { 
        height: '100%', 
        background: token.colorBgContainer, 
        borderRadius: isMobile ? 0 : token.borderRadiusLG, 
        overflow: 'hidden', 
        border: isMobile ? 'none' : `1px solid ${token.colorBorder}`,
        display: 'flex'
    },
    sider: { 
        background: token.colorBgContainer, 
        borderRight: `1px solid ${token.colorBorder}`, 
        display: (isMobile && showChatOnMobile) ? 'none' : 'flex',
        flexDirection: 'column' as const,
        flex: isMobile ? '1 0 100%' : 'none' 
    },
    header: { 
        height: 64, 
        padding: isMobile ? '0 12px' : '0 24px', 
        background: token.colorBgContainer, 
        borderBottom: `1px solid ${token.colorBorder}`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        zIndex: 1,
        flexShrink: 0
    },
    chatArea: { 
        flex: 1, 
        padding: isMobile ? '16px 12px' : '20px 24px', 
        overflowY: 'auto' as const, 
        background: token.colorBgLayout,
        WebkitOverflowScrolling: 'touch' as const
    },
    inputArea: { 
        padding: isMobile ? '8px 12px' : '16px 24px', 
        background: token.colorBgContainer, 
        borderTop: `1px solid ${token.colorBorder}`,
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : '16px'
    },
    bubbleMe: { 
        background: token.colorPrimary, 
        color: '#fff', 
        padding: '10px 14px', 
        borderRadius: '8px 0 8px 8px', 
        maxWidth: '100%', 
        wordBreak: 'break-all' as const, 
        fontSize: 14 
    },
    bubbleOther: { 
        background: token.colorBgContainer, 
        color: token.colorText, 
        padding: '10px 14px', 
        borderRadius: '0 8px 8px 8px', 
        maxWidth: '100%', 
        wordBreak: 'break-all' as const, 
        fontSize: 14 
    }
  };

  // --- WebSocket 初始化 ---
  useEffect(() => {
    fetchFriendList();
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${userInfo?.id}` }, 
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/chat', (msg) => handleReceiveMessage(JSON.parse(msg.body)));
        client.subscribe('/topic/notice', () => fetchFriendList());
      },
    });
    client.activate();
    stompClient.current = client;
    return () => { client.deactivate(); };
  }, [authToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeUser]);

  useEffect(() => {
    if (activeUser && messages[activeUser.id]) {
      const msgs = messages[activeUser.id];
      const hasUnread = msgs.some(m => m.senderId === activeUser.id && m.isRead === 0);
      if (hasUnread) {
        doMarkAsRead(activeUser.id);
      }
    }
  }, [activeUser, messages]);

  // --- 新增：同步标题总未读数 ---
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    document.title = total > 0 ? `(${total}) MoonChat` : 'MoonChat';
  }, [unreadCounts]);

  // ================= 逻辑函数 =================

  const fetchFriendList = async () => {
    try {
      const res = await axios.get('/api/friend/list', { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.data.code === 200) setFriends(res.data.data);
    } catch (e) {}
  };

  const doMarkAsRead = async (friendId: number) => {
    try {
      await axios.put('/api/chat/read', { friendId }, { headers: { Authorization: `Bearer ${authToken}` } });
      setMessages(prev => {
        const chatList = prev[friendId] || [];
        return { 
            ...prev, 
            [friendId]: chatList.map(msg => (msg.senderId === friendId && msg.isRead === 0) ? { ...msg, isRead: 1 } : msg) 
        };
      });
    } catch (e) {}
  };

  const loadHistory = async (friendId: number) => {
    setLoading(prev => ({...prev, history: true}));
    try {
      const res = await axios.get('/api/chat/history', { 
          params: { friendId, page: 1, size: 50 }, 
          headers: { Authorization: `Bearer ${authToken}` } 
      });
      if (res.data.code === 200) {
        const historyList = (res.data.data.records as ChatMessage[]).map(msg => ({
          ...msg,
          type: (msg.type === MSG_TYPE.TEXT && isLikelyImagePath(msg.content)) ? MSG_TYPE.IMAGE : msg.type
        }));
        setMessages(prev => ({ ...prev, [friendId]: [...historyList].reverse() }));
      }
    } finally {
      setLoading(prev => ({...prev, history: false}));
    }
  };

  const handleSelectUser = (user: Friend) => {
    setActiveUser(user);
    loadHistory(user.id);
    // --- 选中时清除未读数 ---
    setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }));
    if (isMobile) setShowChatOnMobile(true);
  };

  const sendMessage = (contentStr: string, msgType: number = MSG_TYPE.TEXT) => {
    if (!contentStr || !activeUser || !stompClient.current) return;
    const payload = { receiverId: activeUser.id, content: contentStr, type: msgType };
    stompClient.current.publish({ destination: '/app/send', body: JSON.stringify(payload) });
    const myMsg: ChatMessage = { senderId: userInfo!.id, receiverId: activeUser.id, content: contentStr, type: msgType, createTime: new Date().toISOString(), isRead: 0 };
    setMessages((prev) => ({ ...prev, [activeUser.id]: [...(prev[activeUser.id] || []), myMsg] }));
    if (msgType === MSG_TYPE.TEXT) setInputText('');
  };

  const handleReceiveMessage = (msgData: any) => {
    const targetId = msgData.senderId;
    
    if (msgData.type === 99) {
      setMessages(prev => ({ 
        ...prev, 
        [targetId]: (prev[targetId] || []).map(m => m.senderId === userInfo?.id ? { ...m, isRead: 1 } : m) 
      }));
      return;
    }

    const newMsg: ChatMessage = { ...msgData, isRead: 0, createTime: new Date().toISOString() };
    
    if (activeUser && activeUser.id === targetId) {
      newMsg.isRead = 1;
      axios.put('/api/chat/read', { friendId: targetId }, { headers: { Authorization: `Bearer ${authToken}` } });
    } else {
      // --- 非当前对话收到新消息：提醒逻辑 ---
      setUnreadCounts(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + 1 }));
      playNotificationSound();
      flashTitle();
    }

    setMessages((prev) => ({ ...prev, [targetId]: [...(prev[targetId] || []), newMsg] }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(prev => ({ ...prev, uploading: true }));
    try {
      const res = await axios.post(`${BASE_URL}/api/chat/upload`, formData, { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.data.code === 200) sendMessage(res.data.data, MSG_TYPE.IMAGE);
    } catch (err) { message.error('上传失败'); } finally {
      setLoading(prev => ({ ...prev, uploading: false }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isMe = msg.senderId === userInfo?.id;
    const isImage = msg.type === MSG_TYPE.IMAGE || isLikelyImagePath(msg.content);
    return (
      <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 16, alignItems: 'flex-start' }}>
        {!isMe && <Avatar src={getFullUrl(activeUser?.avatar)} style={{ marginRight: 8 }} icon={<UserOutlined />} />}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: isMobile ? '80%' : '75%' }}>
          <div style={{ fontSize: 10, color: token.colorTextDescription, marginBottom: 2 }}>{msg.createTime?.substring(11, 16)}</div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
             {isMe && (
               <div style={{ 
                 marginRight: 8, 
                 fontSize: 12, 
                 color: msg.isRead ? token.colorTextDescription : token.colorPrimary,
                 whiteSpace: 'nowrap',
                 marginBottom: 4
               }}>
                 {msg.isRead ? '已读' : '未读'}
               </div>
             )}

             <div style={isImage ? {} : (isMe ? styles.bubbleMe : styles.bubbleOther)}>
                {isImage ? (
                  <Image 
                    width={isMobile ? 140 : 180} 
                    src={getFullUrl(msg.content?.trim())} 
                    style={{ borderRadius: 8, border: `1px solid ${token.colorBorderSecondary}` }} 
                    fallback="https://via.placeholder.com/150?text=Image+Error"
                  />
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                )}
             </div>
          </div>
        </div>
        {isMe && <Avatar src={getFullUrl(userInfo?.avatar)} style={{ marginLeft: 8 }} icon={<UserOutlined />} />}
      </div>
    );
  };

  return (
    <Layout style={styles.layout}>
      <Sider width={isMobile ? '100%' : 260} style={styles.sider} trigger={null}>
        <div style={{ padding: '0 16px', borderBottom: `1px solid ${token.colorBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}><MessageOutlined /> 消息列表</span>
          <Button type="text" icon={<SyncOutlined />} onClick={fetchFriendList} size="small" />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {friends.length === 0 ? <Empty style={{ marginTop: 60 }} description="暂无好友" /> :
            <List dataSource={friends} renderItem={(item) => (
              <List.Item onClick={() => handleSelectUser(item)} style={{ padding: '12px 16px', cursor: 'pointer', background: activeUser?.id === item.id ? token.controlItemBgActive : 'transparent', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <List.Item.Meta
                  // --- 修改：头像处添加未读数 Badge ---
                  avatar={
                    <Badge count={unreadCounts[item.id]} size="small" offset={[-2, 0]}>
                      <Badge status={item.online ? "success" : "default"} dot offset={[-2, 32]}>
                        <Avatar shape="square" size={48} src={getFullUrl(item.avatar)} icon={<UserOutlined />} />
                      </Badge>
                    </Badge>
                  }
                  title={<span style={{ fontWeight: 500 }}>{item.nickname}</span>}
                  description={
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', marginRight: 6, backgroundColor: item.online ? '#52c41a' : '#d9d9d9', boxShadow: item.online ? '0 0 4px #52c41a' : 'none' }} />
                      <span style={{ fontSize: 12 }}>{item.online ? '在线' : '离线'}</span>
                    </div>
                  }
                />
              </List.Item>
            )} />
          }
        </div>
      </Sider>

      <Content style={{ 
        display: (isMobile && !showChatOnMobile) ? 'none' : 'flex', 
        flexDirection: 'column', 
        background: token.colorBgContainer,
        flex: 1 
      }}>
        {activeUser ? (
          <>
            <div style={styles.header}>
               <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                 {isMobile && <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setShowChatOnMobile(false)} style={{ marginRight: 8 }} />}
                 <Avatar src={getFullUrl(activeUser.avatar)} size="small" style={{ marginRight: 8 }} />
                 <span style={{ fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUser.nickname}</span>
               </div>
               <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="text" icon={<SyncOutlined />} onClick={() => loadHistory(activeUser.id)} />
                  <Popconfirm title="确认删除好友?" onConfirm={() => { /* 删除逻辑 */ }} okText="确认" cancelText="取消">
                    <Button danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>
               </div>
            </div>

            <div style={styles.chatArea}>
              {loading.history ? <div style={{ textAlign: 'center', marginTop: 20 }}><Spin /></div> : (messages[activeUser.id] || []).map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputArea}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleUpload} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button type="text" icon={<PictureOutlined style={{fontSize: 20}} />} onClick={() => fileInputRef.current?.click()} loading={loading.uploading} />
                <Input.TextArea 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  placeholder="请输入消息..." 
                  autoSize={{ minRows: 1, maxRows: 3 }} 
                  onPressEnter={e => { if(!e.shiftKey){ e.preventDefault(); sendMessage(inputText); }}}
                  style={{ borderRadius: 8 }}
                />
                <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={() => sendMessage(inputText)} disabled={!inputText.trim()} />
              </div>
            </div>
          </>
        ) : (
          !isMobile && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: token.colorBgLayout, color: token.colorTextQuaternary }}>
              <MessageOutlined style={{ fontSize: 64, marginBottom: 16 }} />
              <div style={{ fontSize: 18 }}>MoonChat</div>
            </div>
          )
        )}
      </Content>
    </Layout>
  );
};

export default ChatRoom;