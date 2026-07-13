import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Lock, CheckCircle, AlertCircle, KeyRound, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

const ForceChangePassword = () => {
  const { user, markPasswordChanged, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password Policy checks
  const checks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    special: /[@$!%*?&]/.test(newPassword)
  };

  const isFormValid = checks.length && checks.upper && checks.lower && checks.digit && checks.special && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      if (newPassword !== confirmPassword) {
        return setError('New passwords do not match.');
      }
      return setError('Please meet all password strength requirements.');
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/first-login-change-password', {
        userId: user.id,
        newPassword
      });
      
      setSuccess(res.data.msg);
      // Wait 1.5 seconds then mark password changed to unlock dashboard access
      setTimeout(() => {
        markPasswordChanged();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(30, 41, 59, 0.7)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#3B82F6',
            marginBottom: '1rem'
          }}>
            <KeyRound size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>Change Password</h2>
          <p style={{ fontSize: '0.95rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
            This is your first login. To secure your account, please set a new password.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            color: '#F87171',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            color: '#34D399',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter secure password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                outline: 'none',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
              placeholder="Re-enter password"
              required
            />
          </div>

          {/* Dynamic strength validator checklists */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ color: checks.length ? '#34D399' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={14} color={checks.length ? '#34D399' : '#64748B'} /> At least 8 characters
            </div>
            <div style={{ color: checks.upper && checks.lower ? '#34D399' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={14} color={checks.upper && checks.lower ? '#34D399' : '#64748B'} /> Mixed case letters (a-z and A-Z)
            </div>
            <div style={{ color: checks.digit ? '#34D399' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={14} color={checks.digit ? '#34D399' : '#64748B'} /> At least 1 number (0-9)
            </div>
            <div style={{ color: checks.special ? '#34D399' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={14} color={checks.special ? '#34D399' : '#64748B'} /> At least 1 special character (@, $, !, %, *, ?, &)
            </div>
            <div style={{ color: confirmPassword && newPassword === confirmPassword ? '#34D399' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
              <CheckCircle size={14} color={confirmPassword && newPassword === confirmPassword ? '#34D399' : '#64748B'} /> Passwords match
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: isFormValid ? '#3B82F6' : '#475569',
              color: 'white',
              fontWeight: 600,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
              transition: 'background-color 0.25s ease'
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Update Password <ArrowRight size={18} /></>}
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'transparent',
              color: '#94A3B8',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
              textAlign: 'center'
            }}
          >
            Cancel & Logout
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePassword;
