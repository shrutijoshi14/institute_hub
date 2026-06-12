import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, AtSign, Users, AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '', iconName: 'GraduationCap' });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { role, name, userId, childId, username } = res.data;
      
      login({ role, name, id: userId, childId, username });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundImage: `url('/login_background_1778426489803.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '900px', 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 1fr', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: '24px', 
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Left Side: Branding */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', 
          padding: '3rem', 
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '2rem', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {settings.logoUrl && settings.logoUrl.startsWith('http') ? (
               <img 
                 src={settings.logoUrl} 
                 alt="Logo" 
                 style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }} 
               />
            ) : (() => {
               const IconComp = LucideIcons[settings.iconName] || LucideIcons.GraduationCap;
               return <IconComp size={100} color="white" style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }} />;
            })()}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>{settings.schoolName || 'Institute Hub'}</h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '300px' }}>
            Empowering students to achieve their academic dreams with technology.
          </p>
        </div>

        {/* Right Side: Form */}
        <div style={{ padding: '3.5rem', backgroundColor: 'white' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Enter your credentials to access your dashboard.</p>
          </div>

          {error && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              backgroundColor: '#FEF2F2', 
              color: '#991B1B', 
              borderRadius: '12px', 
              marginBottom: '1.5rem', 
              fontSize: '0.875rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              border: '1px solid #FCA5A5'
            }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Account Type</label>
              <div style={{ position: 'relative' }}>
                <Users size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '0.875rem 2.5rem 0.875rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', appearance: 'none', backgroundColor: '#ffffff', fontWeight: 500 }}
                >
                  <option value="student">Student Portal</option>
                  <option value="parent">Parent View</option>
                  <option value="faculty">Faculty Lounge</option>
                  <option value="admin">Institute Admin Console</option>
                  <option value="super-admin">Super Admin Console</option>
                  <option value="accountant">Accountant Desk</option>
                  <option value="receptionist">Reception Desk</option>
                  <option value="librarian">Library Desk</option>
                  <option value="transport-manager">Transport Office</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {formData.role === 'admin' || formData.role === 'faculty' ? 'Email Address' : 'ID / Username'}
              </label>
              <div style={{ position: 'relative' }}>
                 <AtSign size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                 <input 
                   type="text"
                   value={formData.email}
                   onChange={(e) => setFormData({...formData, email: e.target.value})}
                   style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                   required 
                   placeholder={formData.role === 'student' ? 'e.g. student01' : 'Email or Username'}
                 />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                 <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                 <input 
                   type={showPassword ? "text" : "password"} 
                   value={formData.password}
                   onChange={(e) => setFormData({...formData, password: e.target.value})}
                   style={{ width: '100%', padding: '0.875rem 2.5rem 0.875rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                   required 
                   placeholder="••••••••"
                 />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                 >
                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ 
                width: '100%', 
                height: '3.5rem', 
                borderRadius: '12px', 
                fontSize: '1rem', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem',
                marginTop: '1rem',
                boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
              }}
            >
              {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={20} /> Authorize Access</>}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                New student? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Register for Admission</Link>
             </p>
             <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                &copy; {new Date().getFullYear()} {settings.schoolName || 'Institute Hub'}<br/>
                All Rights Reserved.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
