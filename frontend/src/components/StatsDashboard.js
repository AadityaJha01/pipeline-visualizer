import React from 'react';
import './StatsDashboard.css';
import { FiTrendingUp, FiCheckCircle, FiClock, FiZap } from 'react-icons/fi';

const StatsDashboard = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Builds',
      value: stats.totalBuilds,
      icon: FiTrendingUp,
      color: '#667eea'
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: FiCheckCircle,
      color: '#10b981'
    },
    {
      label: 'Avg Build Time',
      value: `${stats.averageBuildTime}m`,
      icon: FiClock,
      color: '#f59e0b'
    },
    {
      label: 'Active Jobs',
      value: stats.activeJobs,
      icon: FiZap,
      color: '#ef4444'
    }
  ];

  return (
    <div className="stats-dashboard">
      {statCards.map((stat, index) => (
        <div key={index} className="stat-card" style={{ '--card-color': stat.color }}>
          <div className="stat-icon">
            <stat.icon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsDashboard;

