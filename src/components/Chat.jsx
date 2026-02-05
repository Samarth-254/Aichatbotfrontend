import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, X, Eye, ChevronRight, ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Chat = ({ onBack, chatId, setChatId, loadedChat, onChatCreated }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am your AI Investment Assistant. Tell me about your startup idea.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [matchedInvestors, setMatchedInvestors] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [chatComplete, setChatComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const { token } = useAuth();

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  useEffect(() => {
    if (loadedChat && loadedChat.chatType === 'investors') {
      setMessages(loadedChat.messages || []);
      if (loadedChat.metadata?.matchedInvestors) {
        setMatchedInvestors(loadedChat.metadata.matchedInvestors);
        setChatComplete(true);
      }
    } else if (!chatId) {
      setMessages([{ role: 'ai', content: 'Hello! I am your AI Investment Assistant. Tell me about your startup idea.' }]);
      setMatchedInvestors([]);
      setChatComplete(false);
      setInput('');
      setSessionId(Math.random().toString(36).substring(7));
    }
  }, [loadedChat, chatId]);

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
            chatType: 'investors',
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
      console.error('Chat save error:', error);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
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
      if (data.chatComplete) {
        setChatComplete(true);
      }
      
      if (data.matchedInvestors && data.matchedInvestors.length > 0) {
        setMatchedInvestors(data.matchedInvestors);
        metadata.matchedInvestors = data.matchedInvestors;
      } else if (data.noMatchesFound) {
        metadata.noMatchesFound = true;
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

  return (
    <div className="chat-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      position: 'relative'
    }}>
      {/* Header - RESPONSIVE */}
      <div className="chat-header" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        backgroundColor: '#0a0a0a',
        borderBottom: '1px solid #333',
        gap: '14px',
        minHeight: '64px',
        flexShrink: 0
      }}>
        {/* Menu Button - ONLY ON MOBILE (hidden on desktop) */}
        <button 
          onClick={onBack} 
          className="menu-button-mobile" 
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            minHeight: '40px',
            flexShrink: 0
          }}
        >
          <Menu size={24} />
        </button>
        
        {/* Bot Icon */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Bot size={22} color="#000" />
        </div>
        
        {/* Title Section */}
        <div style={{ 
          flex: 1, 
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '17px', 
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.3'
          }}>
            Investment AI
          </h2>
          <span style={{ 
            fontSize: '13px', 
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '2px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              display: 'inline-block'
            }}></span>
            Online
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#000'
      }}>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message-wrapper ${msg.role === 'user' ? 'user-wrapper' : 'ai-wrapper'}`}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            <div 
              className={`message-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}
              style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: '16px',
                backgroundColor: msg.role === 'user' ? '#1a1a1a' : '#1a1a1a',
                color: '#fff',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                border: '1px solid #333',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              <div className="message-icon" style={{
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="message-content" style={{
                flex: 1,
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message-wrapper ai-wrapper" style={{
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div className="message-bubble ai-bubble loading-bubble" style={{
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              border: '1px solid #333'
            }}>
              <Loader2 className="spinner" size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '14px' }}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area" style={{
        padding: '12px 16px 16px 16px',
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid #333',
        flexShrink: 0
      }}>
        {matchedInvestors.length > 0 ? (
          <button 
            className="view-matches-btn"
            onClick={() => setShowMatches(true)}
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: '#fbbf24',
              color: '#000',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              minHeight: '48px'
            }}
          >
            View Your Investor Matches <ChevronRight size={20} />
          </button>
        ) : chatComplete ? (
          <div style={{
            width: '100%',
            padding: '16px',
            textAlign: 'center',
            color: '#888',
            fontSize: '14px',
            border: '1px solid #333',
            borderRadius: '12px',
            backgroundColor: '#0a0a0a'
          }}>
            Chat completed. Start a new chat to continue.
          </div>
        ) : (
          <div className="input-wrapper" style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                resize: 'none',
                fontFamily: 'inherit',
                minHeight: '48px',
                maxHeight: '120px'
              }}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="send-button"
              style={{
                padding: '12px',
                backgroundColor: input.trim() ? '#fff' : '#333',
                color: input.trim() ? '#000' : '#666',
                border: 'none',
                borderRadius: '12px',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                minHeight: '48px',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
            >
              <Send size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Matches Modal */}
      {showMatches && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#0a0a0a',
            color: '#fff',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '70vh',
            borderRadius: '12px',
            padding: '16px',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid #333'
          }}>
            <button 
              onClick={() => setShowMatches(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#888',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
            >
              <X size={18} />
            </button>
            
            <h2 style={{
              marginTop: 0,
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid #222',
              color: '#fff',
              fontSize: '17px',
              fontWeight: '600',
              paddingRight: '40px'
            }}>
              Matched Investors
            </h2>
            
            <div className="investors-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {matchedInvestors.map((inv, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#0f0f0f',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  border: '1px solid #222'
                }}>
                  <div>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {inv.name}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#888',
                      lineHeight: '1.4'
                    }}>
                      {inv.sectors.join(', ')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedInvestor(inv)}
                    style={{
                      backgroundColor: '#1a1a1a',
                      color: '#aaa',
                      border: '1px solid #333',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontWeight: '500',
                      fontSize: '12px',
                      minHeight: '32px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#252525';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = '#444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                      e.currentTarget.style.color = '#aaa';
                      e.currentTarget.style.borderColor = '#333';
                    }}
                  >
                    <Eye size={14} /> View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Investor Details Modal */}
      {selectedInvestor && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 1100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#0a0a0a',
            color: '#fff',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '85vh',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            border: '1px solid #333',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            overflowY: 'auto'
          }}>
            <button 
              onClick={() => setSelectedInvestor(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px'
              }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{
              color: '#fbbf24',
              marginTop: 0,
              marginBottom: '24px',
              fontSize: '20px',
              fontWeight: '600',
              paddingRight: '50px',
              lineHeight: '1.3'
            }}>
              {selectedInvestor.name}
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <strong style={{
                  color: '#aaa',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Ticket Size
                </strong>
                <p style={{
                  margin: 0,
                  fontSize: '15px',
                  lineHeight: '1.5'
                }}>
                  ₹{selectedInvestor.ticket_min.toLocaleString()} - ₹{selectedInvestor.ticket_max.toLocaleString()}
                </p>
              </div>
              
              <div>
                <strong style={{
                  color: '#aaa',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Sectors
                </strong>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {selectedInvestor.sectors.map((s, i) => (
                    <span key={i} style={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <strong style={{
                  color: '#aaa',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Portfolio
                </strong>
                <p style={{
                  margin: 0,
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  {selectedInvestor.portfolio.join(', ')}
                </p>
              </div>

              {selectedInvestor.description && (
                <div>
                  <strong style={{
                    color: '#aaa',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    About
                  </strong>
                  <p style={{
                    margin: 0,
                    fontSize: '15px',
                    lineHeight: '1.6'
                  }}>
                    {selectedInvestor.description}
                  </p>
                </div>
              )}
              
              {selectedInvestor.website && (
                <div>
                  <strong style={{
                    color: '#aaa',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Website
                  </strong>
                  <p style={{ margin: 0 }}>
                    <a 
                      href={selectedInvestor.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#fbbf24',
                        textDecoration: 'none',
                        fontSize: '15px',
                        wordBreak: 'break-all'
                      }}
                    >
                      {selectedInvestor.website}
                    </a>
                  </p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedInvestor(null)}
              style={{
                width: '100%',
                marginTop: '28px',
                padding: '14px',
                backgroundColor: '#fbbf24',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px',
                minHeight: '48px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .messages-area::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-area::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        
        .messages-area::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }
        
        .modal-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .modal-content::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        
        .modal-content::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }
        
        textarea:focus {
          outline: none;
          border-color: #fbbf24;
        }

        /* HIDE HAMBURGER MENU ON DESKTOP (screens > 768px) */
        @media (min-width: 769px) {
          .menu-button-mobile {
            display: none !important;
          }
        }

        /* SHOW HAMBURGER MENU ON MOBILE ONLY (screens <= 768px) */
        @media (max-width: 768px) {
          .menu-button-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
