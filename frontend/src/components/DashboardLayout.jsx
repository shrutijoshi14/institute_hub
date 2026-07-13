import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import SidebarNavigation from './Sidebar';
import { Bell, UserCircle, LogOut, Sidebar, Megaphone, User, AtSign, Settings2, Calendar, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const DashboardLayout = () => {
  const { user, role, login, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '' });
  
  const getRoleColors = (r) => {
    if (r === 'super-admin') {
      return {
        bg: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        glow: 'rgba(245, 158, 11, 0.15)',
        text: '#D97706',
        badgeBg: '#FEF3C7'
      };
    }
    if (r === 'admin') {
      return {
        bg: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
        glow: 'rgba(79, 70, 229, 0.15)',
        text: '#4F46E5',
        badgeBg: '#EEF2FF'
      };
    }
    return {
      bg: 'linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)',
      glow: 'rgba(13, 148, 136, 0.15)',
      text: '#0D9488',
      badgeBg: '#E6F4F1'
    };
  };
  const roleColors = getRoleColors(role);
  
  // Dropdown states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notices, setNotices] = useState([]);
  
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

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

    window.addEventListener('settingsUpdated', fetchSettings);
    return () => {
      window.removeEventListener('settingsUpdated', fetchSettings);
    };
  }, []);

  // Fetch recent notices for notifications popup
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        if (role && role !== 'super-admin') {
          const res = await axios.get('http://localhost:5000/api/academic/notices');
          if (res.data) {
            // Filter by user's role
            const filtered = res.data.filter(notice => 
              notice.target_role === 'all' || 
              notice.target_role === role
            );
            setNotices(filtered.slice(0, 5)); // Keep last 5 recent notices
          }
        }
      } catch (err) {
        console.error('Failed to fetch notices for header popover', err);
      }
    };
    fetchNotices();
  }, [role]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Profile edit modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', username: '', phone: '', password: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const openEditProfile = async () => {
    try {
      if (!user || !user.id) return;
      const res = await axios.get(`http://localhost:5000/api/auth/profile/${user.id}`);
      if (res.data) {
        setProfileForm({
          name: res.data.name || '',
          email: res.data.email || '',
          username: res.data.username || '',
          phone: res.data.phone || '',
          password: ''
        });
      }
      setShowEditProfileModal(true);
      setShowProfileDropdown(false);
    } catch (err) {
      console.error('Failed to load profile details', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile/update', profileForm);
      if (res.data) {
        setProfileSuccess('Profile updated successfully!');
        // Update user session context (keeps login status)
        login({
          role: res.data.role,
          name: res.data.name,
          id: res.data.id,
          username: res.data.username
        });
        
        // Auto-dismiss modal after 1.5 seconds
        setTimeout(() => {
          setShowEditProfileModal(false);
          setProfileSuccess('');
        }, 1500);
      }
    } catch (err) {
      setProfileError(err.response?.data?.msg || 'Failed to update profile settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    const storedUser = sessionStorage.getItem('user');
    let subdomain = '';
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.tenantSubdomain && parsed.tenantSubdomain !== 'super') {
          subdomain = parsed.tenantSubdomain;
        }
      } catch (err) {}
    }
    logout();
    if (subdomain) {
      navigate(`/login?tenant=${subdomain}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-layout" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SidebarNavigation isOpen={isSidebarOpen} settings={settings} onNavItemClick={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
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
            <span className="welcome-text" style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
              Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>! 
            </span>
          </div>
          
          <div className="header-actions" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', position: 'relative' }}>
            
            {/* Notifications Popover Container */}
            <div className="notification-container" ref={notificationRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowProfileDropdown(false);
                }}
                style={{ 
                  background: 'rgba(243, 244, 246, 0.8)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--text-primary)',
                  padding: '0.6rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(243, 244, 246, 0.8)'}
                title="Notifications"
              >
                <Bell size={20} />
                {notices.length > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    right: '2px', 
                    backgroundColor: '#EF4444', 
                    color: '#FFF', 
                    borderRadius: '50%', 
                    width: '15px', 
                    height: '15px', 
                    fontSize: '0.6rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 700 
                  }}>
                    {notices.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Card */}
              {showNotificationDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  padding: '1.25rem',
                  zIndex: 100,
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>Recent Notices</h4>
                    <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary-light, #EEF2F6)', color: 'var(--primary, #4F46E5)', padding: '0.2rem 0.5rem', borderRadius: '20px', fontWeight: 600 }}>
                      {notices.length} Active
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '260px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {notices.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8' }}>
                        <Megaphone size={28} style={{ strokeWidth: 1.5, marginBottom: '0.5rem', opacity: 0.7 }} />
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>No recent updates available</p>
                      </div>
                    ) : (
                      notices.map((notice) => (
                        <div key={notice.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#F8FAFC', borderLeft: '3px solid var(--primary, #4F46E5)' }}>
                          <Megaphone size={16} style={{ color: 'var(--primary, #4F46E5)', flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#1E293B', lineHeight: 1.2 }}>{notice.title}</strong>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{notice.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {role !== 'super-admin' && (
                    <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '1rem', paddingTop: '0.75rem', textAlign: 'center' }}>
                      <Link 
                        to="/notices" 
                        onClick={() => setShowNotificationDropdown(false)}
                        style={{ fontSize: '0.8rem', color: 'var(--primary, #4F46E5)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Open Notice Board →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Popover Container */}
            <div className="user-profile-container" ref={profileRef} style={{ position: 'relative' }}>
              <div 
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotificationDropdown(false);
                }} 
                className="user-profile" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.4rem 0.8rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.65)',
                  userSelect: 'none',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.65)';
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
                }}
              >
                {/* Initials-based Profile Circle with Glow */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: roleColors.bg,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 3px ${roleColors.text}, 0 2px 8px ${roleColors.glow}`,
                  marginRight: '0.1rem',
                  flexShrink: 0
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                {/* Name and Pill Info Layout */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem' }}>
                  <span className="user-name" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', lineHeight: 1.2 }}>
                    {user?.name}
                  </span>
                  <span style={{ 
                    fontSize: '0.6rem', 
                    backgroundColor: roleColors.badgeBg, 
                    color: roleColors.text, 
                    padding: '1px 5px', 
                    borderRadius: '4px', 
                    fontWeight: 750, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.025em',
                    lineHeight: 1.3
                  }}>
                    {role === 'super-admin' ? 'Super Admin' : (role === 'admin' ? 'Admin' : role)}
                  </span>
                </div>
                
                <ChevronDown size={14} style={{ color: '#94A3B8', marginLeft: '0.1rem', transform: showProfileDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {/* Profile Dropdown Card (NO ID SHOWN) */}
              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '280px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  padding: '1.25rem',
                  zIndex: 100,
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #EEF2F6 0%, #E2E8F0 100%)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      marginBottom: '0.5rem'
                    }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#1E293B' }}>{user?.name}</strong>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      textTransform: 'uppercase', 
                      fontWeight: 700, 
                      letterSpacing: '0.05em',
                      backgroundColor: role === 'super-admin' ? '#FEF3C7' : 'var(--primary-light, #EEF2F6)',
                      color: role === 'super-admin' ? '#D97706' : 'var(--primary, #4F46E5)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      marginTop: '0.25rem'
                    }}>
                      {role === 'super-admin' ? 'Super Admin' : (role === 'admin' ? 'Institute Admin' : role)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {user?.username && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748B' }}>
                        <AtSign size={15} style={{ flexShrink: 0 }} />
                        <span>Username: <strong>{user.username}</strong></span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748B' }}>
                      <Shield size={15} style={{ flexShrink: 0 }} />
                      <span>Role Scope: <strong>{role || 'Portal'}</strong></span>
                    </div>
                  </div>

                  <button 
                    onClick={openEditProfile}
                    style={{ 
                      width: '100%',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: 'var(--primary-light, #EEF2F6)', 
                      color: 'var(--primary, #4F46E5)', 
                      border: 'none', 
                      padding: '0.6rem 1rem', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 600, 
                      fontSize: '0.85rem',
                      marginBottom: '0.5rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0E7FF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light, #EEF2F6)'}
                  >
                    <Settings2 size={16} />
                    <span>Edit Profile Details</span>
                  </button>

                  <button 
                    onClick={handleLogout}
                    style={{ 
                      width: '100%',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: '#FEE2E2', 
                      color: '#991B1B', 
                      border: 'none', 
                      padding: '0.6rem 1rem', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 600, 
                      fontSize: '0.85rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FCA5A5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      {/* Edit Profile Modal (NO ID SHOWN) */}
      {showEditProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002,
          padding: '1rem',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E2E8F0',
              padding: '1.5rem 2rem',
              backgroundColor: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: '#1E293B' }}>
                <Settings2 size={20} color="var(--primary, #4F46E5)" />
                <span>Edit Profile Settings</span>
              </div>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#94A3B8', padding: '0.2rem' }} 
                onClick={() => setShowEditProfileModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem' }}>
              
              {profileError && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 500 }}>
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 500 }}>
                  {profileSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Mobile Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>New Password (Leave blank to keep current)</label>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, height: '2.75rem', justifyContent: 'center', borderRadius: '12px' }} 
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Settings'}
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, height: '2.75rem', justifyContent: 'center', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '12px', color: '#475569' }} 
                  onClick={() => setShowEditProfileModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default DashboardLayout;
