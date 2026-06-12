import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// Global Axios Request Interceptor for Dynamic API URL Routing
axios.interceptors.request.use(
  (config) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
