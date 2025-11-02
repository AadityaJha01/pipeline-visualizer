import React from 'react';
import './Header.css';
import { FiRefreshCw, FiActivity } from 'react-icons/fi';

const Header = ({ onRefresh, loading }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <FiActivity className="logo-icon" />
          <div>
            <h1>Pipeline Visualizer 2.0</h1>
            <p>Real-time CI/CD Pipeline Monitoring</p>
          </div>
        </div>
        <button 
          className="refresh-btn" 
          onClick={onRefresh}
          disabled={loading}
          title="Refresh pipeline status"
        >
          <FiRefreshCw className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>
    </header>
  );
};

export default Header;

