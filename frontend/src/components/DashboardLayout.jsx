import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SidebarNavigation from './Sidebar';
import { Bell, UserCircle, LogOut, Sidebar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const DashboardLayout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/settings');
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <SidebarNavigation isOpen={isSidebarOpen} settings={settings} />
      <div className="main-content">
        <header className="top-header">
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
              title="Toggle Sidebar"
            >
              <Sidebar size={22} />
            </button>
            <span style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
              Welcome back, {user?.name}! 
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            
            <button 
              onClick={handleLogout}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#FEE2E2', 
                color: '#991B1B', 
                border: 'none', 
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', 
                cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem'
              }}
            >
              <LogOut size={16} />
              Logout
            </button>

            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Bell size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              <UserCircle size={28} color={role === 'admin' ? 'var(--primary)' : 'var(--secondary)'} />
              {user?.name}
              <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>ID: {user?.id}</span>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
