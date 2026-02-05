import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ToolSelection from './components/ToolSelection';
import InvestorChat from './components/Chat';
import FinancialChat from './components/FinancialChat';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const InvestorChatPage = () => {
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loadedChat, setLoadedChat] = useState(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const navigate = useNavigate();

  const handleNewChat = () => {
    setCurrentChatId(null);
    setLoadedChat(null);
  };

  const handleSelectChat = async (chat) => {
    setLoadedChat(chat);
    setCurrentChatId(chat.id);
  };

  const handleChatCreated = (chatId) => {
    setCurrentChatId(chatId);
    setRefreshSidebar(prev => prev + 1);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        chatType="investors"
        refreshTrigger={refreshSidebar}
        onChatDeleted={handleBack}
      />
      <div className="main-content">
        <InvestorChat 
          onBack={handleBack} 
          chatId={currentChatId}
          setChatId={setCurrentChatId}
          loadedChat={loadedChat}
          onChatCreated={handleChatCreated}
        />
      </div>
    </div>
  );
};

const FinancialChatPage = () => {
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loadedChat, setLoadedChat] = useState(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const navigate = useNavigate();

  const handleNewChat = () => {
    setCurrentChatId(null);
    setLoadedChat(null);
  };

  const handleSelectChat = async (chat) => {
    setLoadedChat(chat);
    setCurrentChatId(chat.id);
  };

  const handleChatCreated = (chatId) => {
    setCurrentChatId(chatId);
    setRefreshSidebar(prev => prev + 1);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        chatType="financial"
        refreshTrigger={refreshSidebar}
        onChatDeleted={handleBack}
      />
      <div className="main-content">
        <FinancialChat 
          onBack={handleBack}
          chatId={currentChatId}
          setChatId={setCurrentChatId}
          loadedChat={loadedChat}
          onChatCreated={handleChatCreated}
        />
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  const handleSelectTool = (tool) => {
    navigate(`/${tool}`);
  };

  return (
    <div className="app-container">
      <div className="main-content full-width">
        <ToolSelection onSelectTool={handleSelectTool} />
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investors"
            element={
              <ProtectedRoute>
                <InvestorChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financial"
            element={
              <ProtectedRoute>
                <FinancialChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
