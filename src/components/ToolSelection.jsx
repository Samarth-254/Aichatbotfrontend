import React from 'react';
import { Users, TrendingUp, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ToolSelection.css';

const ToolSelection = ({ onSelectTool }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="tool-selection-container">
      <div className="tool-selection-header">
        <h1>Startup Investment Tools</h1>
        <p>Everything you need to raise capital and grow your startup. Choose the tool that fits your current needs.</p>
      </div>
      
      <div className="tools-grid">
        <div className="tool-card" onClick={() => onSelectTool('investors')}>
          <div className="tool-icon" style={{backgroundColor: '#fbbf24'}}>
            <Users size={40} color="#000" />
          </div>
          <h2>Investors Matching</h2>
          <p>Find and connect with the right investors for your startup based on industry, stage, and investment criteria.</p>
          <button className="tool-button">Get Started</button>
        </div>
        
        <div className="tool-card" onClick={() => onSelectTool('financial')}>
          <div className="tool-icon" style={{backgroundColor: '#10b981'}}>
            <TrendingUp size={40} color="#fff" />
          </div>
          <h2>Financial Projection</h2>
          <p>Build detailed financial models and projections with AI-powered insights and scenario analysis.</p>
          <button className="tool-button">Get Started</button>
        </div>
      </div>
    </div>
  );
};

export default ToolSelection;
