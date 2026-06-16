import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// Dynamic API URL Switch Logic (Local vs Live)
// 1. If hosted live on Render (not localhost), use VITE_API_URL.
// 2. If running locally:
//    - If VITE_FORCE_LIVE_API is 'true', force connection to live Render backend.
//    - Otherwise, default to local backend (http://localhost:5000).
const getApiBase = () => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  const forceLive = import.meta.env.VITE_FORCE_LIVE_API === 'true';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalhost && !forceLive) {
    return 'http://localhost:5000';
  }
  return envApiUrl || 'http://localhost:5000';
};

// Global Axios Request Interceptor for Dynamic API URL Routing
axios.interceptors.request.use(
  (config) => {
    const apiBase = getApiBase();
    if (config.url && config.url.startsWith('http://localhost:5000')) {
      config.url = config.url.replace('http://localhost:5000', apiBase);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
