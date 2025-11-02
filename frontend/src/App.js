import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import PipelineVisualization from './components/PipelineVisualization';
import BuildHistory from './components/BuildHistory';
import StatsDashboard from './components/StatsDashboard';
import { fetchPipelineStatus, fetchBuildHistory } from './services/api';

function App() {
  const [pipelines, setPipelines] = useState([]);
  const [buildHistory, setBuildHistory] = useState([]);
  const [stats, setStats] = useState({
    totalBuilds: 0,
    successRate: 0,
    averageBuildTime: 0,
    activeJobs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pipelinesData, historyData] = await Promise.all([
        fetchPipelineStatus(),
        fetchBuildHistory()
      ]);
      setPipelines(pipelinesData);
      setBuildHistory(historyData);
      
      // Calculate stats
      const totalBuilds = historyData.length;
      const successful = historyData.filter(b => b.result === 'SUCCESS').length;
      const avgTime = historyData.length > 0
        ? historyData.reduce((sum, b) => sum + (b.duration || 0), 0) / historyData.length
        : 0;
      
      setStats({
        totalBuilds,
        successRate: totalBuilds > 0 ? (successful / totalBuilds * 100) : 0,
        averageBuildTime: Math.round(avgTime / 1000 / 60), // Convert to minutes
        activeJobs: pipelinesData.filter(p => p.status === 'RUNNING').length
      });
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load pipeline data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <Header onRefresh={loadData} loading={loading} />
      <div className="container">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadData}>Retry</button>
          </div>
        )}
        <StatsDashboard stats={stats} />
        <PipelineVisualization pipelines={pipelines} loading={loading} />
        <BuildHistory history={buildHistory} />
      </div>
    </div>
  );
}

export default App;

