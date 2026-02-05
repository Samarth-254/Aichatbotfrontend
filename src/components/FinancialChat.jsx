import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, X, ArrowLeft, Download, TrendingUp, DollarSign, Users as UsersIcon, AlertTriangle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../context/AuthContext';
import './FinancialChat.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const FinancialChat = ({ onBack, chatId, setChatId, loadedChat, onChatCreated }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I\'m your Financial Projection Assistant. Let\'s build a detailed 3-year financial model for your startup. What type of business model do you have?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [projections, setProjections] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const messagesEndRef = useRef(null);
  const { token } = useAuth();

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  useEffect(() => {
    if (loadedChat && loadedChat.chatType === 'financial') {
      setMessages(loadedChat.messages || []);
      if (loadedChat.metadata?.projections) {
        setProjections(loadedChat.metadata.projections);
        setFinancialData(loadedChat.metadata.financialData);
        setWarnings(loadedChat.metadata.warnings || []);
      }
    }
  }, [loadedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveChatToDatabase = async (updatedMessages, metadata = {}) => {
    try {
      if (!chatId) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            chatType: 'financial',
            messages: updatedMessages,
            metadata
          })
        });

        if (response.ok) {
          const data = await response.json();
          setChatId(data._id);
          if (onChatCreated) onChatCreated(data._id);
        }
      } else {
        await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messages: updatedMessages,
            metadata
          })
        });
      }
    } catch (error) {
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/financial-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: userMessage
        }),
      });

      const data = await response.json();
      
      const finalMessages = [...newMessages, { role: 'ai', content: data.reply.content }];
      setMessages(finalMessages);
      
      let metadata = {};
      if (data.projections) {
        setProjections(data.projections);
        setFinancialData(data.financialData);
        setWarnings(data.warnings || []);
        metadata = {
          projections: data.projections,
          financialData: data.financialData,
          warnings: data.warnings
        };
      }

      await saveChatToDatabase(finalMessages, metadata);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/export-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'financial-projections.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
    }
  };

  const revenueChartData = projections ? {
    labels: projections.map(p => `M${p.month}`),
    datasets: [
      {
        label: 'Revenue',
        data: projections.map(p => p.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Expenses',
        data: projections.map(p => p.totalExpenses),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  } : null;

  const cashChartData = projections ? {
    labels: projections.map(p => `M${p.month}`),
    datasets: [{
      label: 'Cash Balance',
      data: projections.map(p => p.cash),
      backgroundColor: '#fbbf24',
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#fff' }
      },
    },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
      y: { ticks: { color: '#aaa' }, grid: { color: '#333' } }
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={onBack} style={{background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginRight: '10px'}}>
          <ArrowLeft size={24} />
        </button>
        <div className="logo-container">
          <TrendingUp size={24} className="bot-icon" />
        </div>
        <div>
          <h2>Financial Projection AI</h2>
          <span className="status-indicator">Online</span>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'user-wrapper' : 'ai-wrapper'}`}>
            <div className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
              <div className="message-icon">
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper ai-wrapper">
            <div className="message-bubble ai-bubble loading-bubble">
              <Loader2 className="spinner" size={20} />
              <span>Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        {projections ? (
          <button 
            className="view-matches-btn"
            onClick={() => setShowResults(true)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            View Financial Projections <TrendingUp size={20} />
          </button>
        ) : (
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </div>
        )}
      </div>

      {showResults && projections && (
        <div className="modal-overlay">
          <div className="results-modal">
            <button onClick={() => setShowResults(false)} className="close-btn">
              <X size={24} />
            </button>
            
            <h2 style={{color: '#10b981', marginBottom: '20px'}}>Your 3-Year Financial Projection</h2>
            
            {warnings.length > 0 && (
              <div className="warnings-section">
                <h3><AlertTriangle size={18} /> Warnings</h3>
                {warnings.map((w, i) => (
                  <p key={i} className="warning-text">{w}</p>
                ))}
              </div>
            )}
            
            <div className="metrics-grid">
              <div className="metric-card">
                <DollarSign size={24} color="#10b981" />
                <h3>Final Revenue</h3>
                <p>₹{projections[projections.length - 1].revenue.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <UsersIcon size={24} color="#fbbf24" />
                <h3>Final Customers</h3>
                <p>{projections[projections.length - 1].customers.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <TrendingUp size={24} color="#3b82f6" />
                <h3>Final Cash</h3>
                <p>₹{projections[projections.length - 1].cash.toLocaleString()}</p>
              </div>
            </div>

            <div className="charts-section">
              <div className="chart-container">
                <h3>Revenue vs Expenses</h3>
                <Line data={revenueChartData} options={chartOptions} />
              </div>
              <div className="chart-container">
                <h3>Cash Balance Over Time</h3>
                <Bar data={cashChartData} options={chartOptions} />
              </div>
            </div>

            <button onClick={handleExport} className="export-btn">
              <Download size={18} /> Export to Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialChat;
