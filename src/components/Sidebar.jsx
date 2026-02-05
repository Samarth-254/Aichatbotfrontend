import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  LogOut,
  User,
  Bot,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentChatId, onNewChat, onSelectChat, chatType, refreshTrigger, onChatDeleted }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadChats();
  }, [token, chatType, refreshTrigger]);

  const loadChats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const filteredChats = data.filter(chat => chat.chatType === chatType);
        setChats(filteredChats);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this chat?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setChats(chats.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          onChatDeleted();
        }
      }
    } catch (error) {
    }
  };

  const handleChatClick = async (chat) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chat.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const fullChat = await response.json();
        onSelectChat(fullChat);
      } else {
        onSelectChat(chat);
      }
    } catch (error) {
      onSelectChat(chat);
    }
    setIsMobileOpen(false);
  };

  const handleNewChat = () => {
    onNewChat();
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const groupChatsByDate = () => {
    const groups = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: []
    };

    const now = new Date();
    chats.forEach(chat => {
      const chatDate = new Date(chat.updatedAt);
      const diffDays = Math.floor((now - chatDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups.today.push(chat);
      else if (diffDays === 1) groups.yesterday.push(chat);
      else if (diffDays < 7) groups.last7Days.push(chat);
      else if (diffDays < 30) groups.last30Days.push(chat);
      else groups.older.push(chat);
    });

    return groups;
  };

  const groupedChats = groupChatsByDate();

  const renderChatGroup = (title, chats) => {
    if (chats.length === 0) return null;

    return (
      <div className="chat-group" key={title}>
        <div className="chat-group-title">{title}</div>
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
            onClick={() => handleChatClick(chat)}
          >
            <div className="chat-item-icon">
              {chat.chatType === 'investors' ? <Bot size={16} /> : <TrendingUp size={16} />}
            </div>
            <div className="chat-item-content">
              <div className="chat-item-title">{chat.title}</div>
              <div className="chat-item-meta">
                {chat.messageCount} messages • {formatDate(chat.updatedAt)}
              </div>
            </div>
            <button
              className="chat-item-delete"
              onClick={(e) => handleDeleteChat(chat.id, e)}
              title="Delete chat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Bot size={24} />
          {!isCollapsed && <span>AI Assistant</span>}
        </div>
        <button
          className="sidebar-toggle-desktop"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button
          className="sidebar-close-mobile"
          onClick={() => setIsMobileOpen(false)}
        >
          <X size={24} />
        </button>
      </div>

      <button className="new-chat-button" onClick={handleNewChat}>
        <Plus size={20} />
        {!isCollapsed && <span>New Chat</span>}
      </button>

      <div className="chat-list">
        {loading ? (
          <div className="chat-loading">
            <div className="spinner-small"></div>
            {!isCollapsed && <span>Loading chats...</span>}
          </div>
        ) : chats.length === 0 ? (
          !isCollapsed && (
            <div className="empty-chats">
              <MessageSquare size={32} />
              <p>No chats yet</p>
              <span>Start a new conversation</span>
            </div>
          )
        ) : (
          <>
            {renderChatGroup('Today', groupedChats.today)}
            {renderChatGroup('Yesterday', groupedChats.yesterday)}
            {renderChatGroup('Last 7 Days', groupedChats.last7Days)}
            {renderChatGroup('Last 30 Days', groupedChats.last30Days)}
            {renderChatGroup('Older', groupedChats.older)}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <User size={18} />
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          )}
        </div>
        <button className="logout-button" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </>
  );

  return (
    <>
      <button 
        className="sidebar-toggle-mobile"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu size={24} />
      </button>

      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {sidebarContent}
      </div>

      {isMobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
