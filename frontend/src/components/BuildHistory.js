import React from 'react';
import './BuildHistory.css';
import { formatDistanceToNow } from 'date-fns';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';

const BuildHistory = ({ history }) => {
  const getStatusIcon = (result) => {
    switch (result) {
      case 'SUCCESS':
        return <FiCheckCircle className="status-icon success" />;
      case 'FAILURE':
        return <FiXCircle className="status-icon failure" />;
      case 'UNSTABLE':
        return <FiAlertTriangle className="status-icon unstable" />;
      default:
        return <FiClock className="status-icon unknown" />;
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="build-history-card">
      <h2 className="card-title">Recent Build History</h2>
      {history.length === 0 ? (
        <div className="empty-state">
          <p>No build history available</p>
        </div>
      ) : (
        <div className="history-table">
          <div className="table-header">
            <div className="col-status">Status</div>
            <div className="col-name">Pipeline</div>
            <div className="col-build">Build #</div>
            <div className="col-duration">Duration</div>
            <div className="col-time">Time</div>
          </div>
          <div className="table-body">
            {history.slice(0, 10).map((build, index) => (
              <div key={index} className="table-row">
                <div className="col-status">
                  {getStatusIcon(build.result)}
                </div>
                <div className="col-name">{build.name || 'Unknown'}</div>
                <div className="col-build">#{build.number || 'N/A'}</div>
                <div className="col-duration">{formatDuration(build.duration)}</div>
                <div className="col-time">
                  {build.timestamp
                    ? formatDistanceToNow(new Date(build.timestamp), { addSuffix: true })
                    : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildHistory;

