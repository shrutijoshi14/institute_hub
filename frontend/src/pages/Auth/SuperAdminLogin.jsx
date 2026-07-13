import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, AtSign, ArrowRight, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

const SuperAdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/super-admin/login', {
        email,
        password
      });

      const { role, name, username, userId, token } = res.data;
      // Do NOT display user ID in any frontend views, to respect the user's rule.
      login({ role, name, username, id: userId, tenantSubdomain: 'super', token });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Authentication failed. Invalid Super Admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#F8FAFC',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        minHeight: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          textAlign: 'center'
        }}>
        {/* Shield Icon Decoration */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: '#000',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)'
        }}>
          <KeyRound size={32} />
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.025em',
          background: 'linear-gradient(to right, #FBBF24, #F59E0B)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Super Admin Portal
        </h1>
        <p style={{
          color: '#94A3B8',
          fontSize: '0.95rem',
          margin: '0 0 2rem 0'
        }}>
          Authorized access only. Enter administrative credentials.
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#FCA5A5',
            fontSize: '0.875rem',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#94A3B8',
              marginBottom: '0.5rem'
            }}>
              Username / Email
            </label>
            <div style={{ position: 'relative' }}>
              <AtSign size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '1rem 1rem 1rem 2.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  color: '#FFF',
                  outline: 'none',
                  fontSize: '0.95rem',
                  transition: 'border-color 0.25s, box-shadow 0.25s'
                }}
                required
                placeholder="superadmin@portal.com"
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#94A3B8',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', color: '#64748B' }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 2.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  color: '#FFF',
                  outline: 'none',
                  fontSize: '0.95rem',
                  transition: 'border-color 0.25s, box-shadow 0.25s'
                }}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(to right, #FBBF24, #F59E0B)',
              color: '#000',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.3)',
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={20} /> Access Console</>}
          </button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/login" style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#FBBF24'} onMouseLeave={(e) => e.target.style.color = '#94A3B8'}>
            &larr; Back to standard portal login
          </Link>
        </div>
      </div>
    </div>
  </div>
);
};

export default SuperAdminLogin;
