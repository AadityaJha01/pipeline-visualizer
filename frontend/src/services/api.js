import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchPipelineStatus = async () => {
  try {
    const response = await api.get('/pipelines/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching pipeline status:', error);
    throw new Error('Failed to fetch pipeline status');
  }
};

export const fetchBuildHistory = async () => {
  try {
    const response = await api.get('/builds/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching build history:', error);
    throw new Error('Failed to fetch build history');
  }
};

export const triggerBuild = async (jobName) => {
  try {
    const response = await api.post(`/builds/trigger/${jobName}`);
    return response.data;
  } catch (error) {
    console.error('Error triggering build:', error);
    throw new Error('Failed to trigger build');
  }
};

export default api;

