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
  let envApiUrl = import.meta.env.VITE_API_URL;
  const forceLive = import.meta.env.VITE_FORCE_LIVE_API === 'true';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalhost && !forceLive) {
    return 'http://localhost:5000';
  }
  
  if (envApiUrl) {
    // Ensure the protocol is attached (Render host properties are protocol-less)
    envApiUrl = envApiUrl.trim();
    if (!envApiUrl.startsWith('http://') && !envApiUrl.startsWith('https://')) {
      envApiUrl = `https://${envApiUrl}`;
    }
    return envApiUrl;
  }
  return 'http://localhost:5000';
};

const getTenantSubdomain = () => {
  // 1. Check query parameter first (for local development, e.g. ?tenant=ambition)
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) {
    sessionStorage.setItem('tenantSubdomain', tenantParam);
    return tenantParam;
  }

  // 2. Check path segments (supporting both /tenant/:subdomain and direct /:subdomain)
  const pathParts = window.location.pathname.split('/');
  const firstSegment = pathParts[1] ? pathParts[1].trim() : '';
  
  if (firstSegment) {
    const reserved = [
      'login', 'enquiry', 'super-admin', 'register', 'tenant', 'settings',
      'enquiries', 'registrations', 'students', 'users', 'faculty', 'batches',
      'syllabus', 'admin', 'notices', 'assignments', 'support', 'student',
      'daily-tracker', 'parent', 'accountant', 'receptionist', 'library', 'transport'
    ];
    if (firstSegment === 'tenant' && pathParts[2]) {
      sessionStorage.setItem('tenantSubdomain', pathParts[2]);
      return pathParts[2];
    } else if (!reserved.includes(firstSegment.toLowerCase())) {
      sessionStorage.setItem('tenantSubdomain', firstSegment);
      return firstSegment;
    }
  }

  // 3. Check hostname (for custom domain or production subdomain)
  const host = window.location.hostname;
  const isDevHost = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('onrender.com');
  
  if (!isDevHost) {
    // If it's a custom domain, return the whole hostname (e.g. ambition.in)
    sessionStorage.setItem('tenantSubdomain', host);
    return host;
  }
  
  const parts = host.split('.');
  // If we have a subdomain and it's not 'www' or 'super' or 'localhost' or an IP
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'super') {
    sessionStorage.setItem('tenantSubdomain', parts[0]);
    return parts[0];
  }
  
  // 4. Fallback to cached session storage if already resolved
  const cached = sessionStorage.getItem('tenantSubdomain');
  if (cached) return cached;
  
  return null;
};

// Global Axios Request Interceptor for Dynamic API URL Routing
axios.interceptors.request.use(
  (config) => {
    const apiBase = getApiBase();
    if (config.url && config.url.startsWith('http://localhost:5000')) {
      config.url = config.url.replace('http://localhost:5000', apiBase);
    }
    // Inject tenant subdomain if detected
    let subdomain = getTenantSubdomain();
    if (!subdomain) {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.tenantSubdomain) {
            subdomain = parsed.tenantSubdomain;
          }
        } catch (err) {}
      }
    }
    if (subdomain) {
      config.headers['x-tenant-subdomain'] = subdomain;
    }
    // Inject logged-in user headers if available
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        
        // Crossover Protection: If logged-in user's tenant subdomain doesn't match the current URL subdomain, force clear session.
        // (Only for non-super-admin users on dev/staging shared hosts where sessions can cross over)
        const isDevHost = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') || window.location.hostname.includes('onrender.com');
        const matchesSubdomain = subdomain && parsed.tenantSubdomain && (
          subdomain.toLowerCase().includes(parsed.tenantSubdomain.toLowerCase()) ||
          parsed.tenantSubdomain.toLowerCase().includes(subdomain.toLowerCase())
        );
        
        console.log('🔄 Tenant Interceptor Check:', {
          isDevHost,
          role: parsed.role,
          subdomain,
          tenantSubdomain: parsed.tenantSubdomain,
          matchesSubdomain
        });
        
        if (isDevHost && parsed.role !== 'super-admin' && subdomain && parsed.tenantSubdomain && !matchesSubdomain) {
          console.warn('⚠️ Tenant mismatch detected! Logging out...', {
            subdomain,
            userTenant: parsed.tenantSubdomain
          });
          sessionStorage.clear();
          localStorage.removeItem('token');
          window.location.reload();
          return config;
        }

        if (parsed.id) {
          config.headers['x-user-id'] = parsed.id;
        }
        if (parsed.role) {
          config.headers['x-user-role'] = parsed.role;
        }
        if (parsed.token) {
          config.headers['Authorization'] = `Bearer ${parsed.token}`;
        }
      } catch (err) {
        console.error('Failed to parse user from sessionStorage', err);
      }
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
