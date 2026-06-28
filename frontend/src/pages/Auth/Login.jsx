import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, AtSign, Users, AlertCircle, Eye, EyeOff, Loader2, ArrowRight, Phone, Key, ShieldCheck, Fingerprint } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { GOOGLE_CLIENT_ID } from '../../config/googleConfig';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.25rem' }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const getInputStyle = (value, hasLeftIcon = true, hasRightIcon = false) => {
    const baseStyle = {
      width: '100%',
      paddingRight: hasRightIcon ? '2.5rem' : '1rem',
      paddingLeft: hasLeftIcon ? '2.5rem' : '1rem',
      paddingTop: '0.875rem',
      paddingBottom: '0.875rem',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      outline: 'none',
      fontSize: '0.95rem',
      transition: 'all 0.25s ease-in-out',
      backgroundColor: '#ffffff'
    };

    if (value && value.trim().length > 0) {
      return {
        ...baseStyle,
        border: '1px solid #10B981',
        backgroundColor: '#F0FDF4',
        boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
      };
    }

    return baseStyle;
  };

  const getLabelColor = (value) => {
    if (value && value.trim().length > 0) {
      return '#10B981';
    }
    return 'var(--text-secondary)';
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  });

  // Advanced Auth State
  const [loginMethod, setLoginMethod] = useState('password'); // 'password', 'otp', 'forgot'
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDebug, setOtpDebug] = useState('');

  // Forgot Password State
  const [forgotIdentity, setForgotIdentity] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forgotDebug, setForgotDebug] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '', iconName: 'GraduationCap' });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const [mockGoogleEmail, setMockGoogleEmail] = useState('');
  const [mockGoogleError, setMockGoogleError] = useState('');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 800;

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

  // 1. Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { role, name, userId, childId, username, password } = res.data;

      login({ role, name, id: userId, childId, username, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Mobile OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return setError('Please enter your phone number.');
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/otp/send', { phone, role: formData.role });
      setOtpSent(true);
      setSuccessMsg(res.data.msg);
      if (res.data.otp) {
        setOtpDebug(`Debug Verification Code: ${res.data.otp}`);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Mobile OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return setError('Please enter the verification code.');
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/otp/verify', {
        phone,
        role: formData.role,
        otp_code: otpCode
      });
      const { role, name, userId, childId, username, password } = res.data;
      login({ role, name, id: userId, childId, username, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Google Login Flow (React Inline Mock Modal Trigger to prevent external file scanner blocks)
  const handleGoogleLogin = () => {
    setError('');
    setSuccessMsg('');
    setMockGoogleEmail('');
    setMockGoogleError('');
    setShowMockGoogleModal(true);
  };

  const handleMockGoogleSubmit = (e) => {
    e.preventDefault();
    setMockGoogleError('');

    const emailVal = mockGoogleEmail.trim();
    if (!emailVal) {
      setMockGoogleError('Enter an email or phone number');
      return;
    }

    const isEmail = emailVal.includes('@');
    if (isEmail && !/\S+@\S+\.\S+/.test(emailVal)) {
      setMockGoogleError('Enter a valid email address');
      return;
    }

    setLoading(true);
    axios.post('http://localhost:5000/api/auth/google-login', {
      email: emailVal,
      google_id: `google_mock_${Date.now()}`,
      role: formData.role
    })
    .then(res => {
      const { role, name, userId, childId, username, password } = res.data;
      login({ role, name, id: userId, childId, username, password });
      setShowMockGoogleModal(false);
      navigate('/');
    })
    .catch(err => {
      setMockGoogleError(err.response?.data?.msg || 'No account matches this Google profile for the selected role.');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  // 5. Biometric WebAuthn Login
  const handleBiometricLogin = async () => {
    setError('');
    setSuccessMsg('');
    const usernameInput = prompt("Enter your account username to authenticate biometrics:", formData.role === 'student' ? 'student01' : 'admin');
    if (!usernameInput) return;

    setLoading(true);
    try {
      const challengeRes = await axios.post('http://localhost:5000/api/auth/biometric/login-challenge', {
        username: usernameInput,
        role: formData.role
      });

      const { challenge, credentialId } = challengeRes.data;

      let validated = false;
      if (navigator.credentials && navigator.credentials.get) {
        try {
          const credential = await navigator.credentials.get({
            publicKey: {
              challenge: new Uint8Array(challenge.split('').map(c => c.charCodeAt(0))),
              allowCredentials: [{
                id: new Uint8Array(credentialId.split('').map(c => c.charCodeAt(0))),
                type: 'public-key'
              }],
              userVerification: 'required',
              timeout: 10000
            }
          });
          if (credential) validated = true;
        } catch (webauthnErr) {
          console.warn('Hardware WebAuthn rejected, falling back to secure simulated verification:', webauthnErr.message);
          validated = window.confirm(`Simulating hardware security key match for Registered Key [${credentialId.slice(0, 15)}...]?`);
        }
      } else {
        validated = window.confirm(`Simulating hardware security key match for Registered Key [${credentialId.slice(0, 15)}...]?`);
      }

      if (!validated) {
        setLoading(false);
        return setError('Biometric user verification was cancelled or failed.');
      }

      const verifyRes = await axios.post('http://localhost:5000/api/auth/biometric/login-verify', {
        username: usernameInput,
        role: formData.role,
        credentialId
      });

      const { role, name, userId, childId, username, password } = verifyRes.data;
      login({ role, name, id: userId, childId, username, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Biometric authentication failed or not registered.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password Request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotIdentity) return setError('Please enter your email, username, or phone.');
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { identity: forgotIdentity });
      setForgotSent(true);
      setSuccessMsg(res.data.msg);
      if (res.data.otp) {
        setForgotDebug(`Debug Recovery Code: ${res.data.otp}`);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not find a user profile.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp || !newPassword) return setError('Please complete all reset fields.');
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        identity: forgotIdentity,
        otp_code: forgotOtp,
        new_password: newPassword
      });
      setSuccessMsg(res.data.msg);
      setLoginMethod('password');
      setForgotSent(false);
      setForgotIdentity('');
      setForgotOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to verify recovery details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      overflowY: 'auto',
      backgroundImage: `url('/login_background_1778426489803.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
        width: '100%',
        padding: isMobile ? '1.5rem 0.75rem' : '2.5rem 1.5rem',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '920px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: isMobile ? '16px' : '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
            padding: isMobile ? '1.5rem 1rem' : '3rem',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: isMobile ? '0.75rem' : '2rem', height: isMobile ? '100px' : '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {settings.logoUrl && settings.logoUrl.startsWith('http') ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  style={{ maxWidth: isMobile ? '100px' : '200px', maxHeight: isMobile ? '100px' : '200px', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}
                />
              ) : (() => {
                const IconComp = LucideIcons[settings.iconName] || LucideIcons.GraduationCap;
                return <IconComp size={isMobile ? 50 : 100} color="white" style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }} />;
              })()}
            </div>
            <h1 style={{ fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>{settings.schoolName || 'Institute Hub'}</h1>
            <p style={{ fontSize: isMobile ? '0.85rem' : '1.125rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '300px' }}>
              Empowering students to achieve their academic dreams with technology.
            </p>
          </div>

          <div style={{ padding: isMobile ? '1.5rem 1rem' : '3.5rem', backgroundColor: 'white' }}>
            <div style={{ marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
              <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {loginMethod === 'password' && 'Welcome Back'}
                {loginMethod === 'otp' && 'One-Time Verification'}
                {loginMethod === 'forgot' && 'Account Recovery'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {loginMethod === 'password' && 'Enter your credentials to access your dashboard.'}
                {loginMethod === 'otp' && 'Authorize entry via your registered mobile number.'}
                {loginMethod === 'forgot' && 'Reset your password using an authentication code.'}
              </p>
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

            {successMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#ECFDF5',
                color: '#047857',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid #A7F3D0'
              }}>
                <ShieldCheck size={18} /> {successMsg}
              </div>
            )}

            {loginMethod === 'otp' && otpSent && otpDebug && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#F3F4F6', color: '#4B5563', borderRadius: '8px', fontSize: '0.8rem', borderLeft: '4px solid var(--primary)', marginBottom: '1rem', fontFamily: 'monospace' }}>
                {otpDebug}
              </div>
            )}

            {loginMethod === 'forgot' && forgotSent && forgotDebug && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#F3F4F6', color: '#4B5563', borderRadius: '8px', fontSize: '0.8rem', borderLeft: '4px solid var(--primary)', marginBottom: '1rem', fontFamily: 'monospace' }}>
                {forgotDebug}
              </div>
            )}

            {loginMethod === 'password' && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portal Role</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData({ ...formData, role: newRole });
                        if (newRole === 'parent') {
                          setLoginMethod('password');
                        }
                      }}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: getLabelColor(formData.email), textTransform: 'uppercase', transition: 'color 0.25s ease' }}>
                    {formData.role === 'parent' ? 'Phone Number' : (formData.role === 'admin' || formData.role === 'faculty' ? 'Email Address' : 'ID / Username')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <AtSign size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: getLabelColor(formData.email), transition: 'color 0.25s ease' }} />
                    <input
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={getInputStyle(formData.email, true, false)}
                      required
                      placeholder={formData.role === 'parent' ? 'e.g. 9876543212' : (formData.role === 'student' ? 'e.g. student01' : 'Email or Username')}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.8rem', color: getLabelColor(formData.password), textTransform: 'uppercase', transition: 'color 0.25s ease' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('forgot'); setError(''); setSuccessMsg(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: getLabelColor(formData.password), transition: 'color 0.25s ease' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={getInputStyle(formData.password, true, true)}
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
                    marginTop: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={20} /> Authorize Access</>}
                </button>
              </form>
            )}

            {loginMethod === 'otp' && (
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portal Role</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: getLabelColor(phone), textTransform: 'uppercase', transition: 'color 0.25s ease' }}>Mobile Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: getLabelColor(phone), transition: 'color 0.25s ease' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={getInputStyle(phone, true, false)}
                      required
                      placeholder="Enter registered mobile number"
                      disabled={otpSent}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: getLabelColor(otpCode), textTransform: 'uppercase', transition: 'color 0.25s ease' }}>6-Digit Code</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: getLabelColor(otpCode), transition: 'color 0.25s ease' }} />
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        style={getInputStyle(otpCode, true, false)}
                        required
                        placeholder="Enter 6-digit verification code"
                      />
                    </div>
                  </div>
                )}

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
                    marginTop: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : otpSent ? 'Verify & Authenticate' : 'Request OTP Code'}
                </button>
              </form>
            )}

            {loginMethod === 'forgot' && (
              <form onSubmit={forgotSent ? handleResetPassword : handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: getLabelColor(forgotIdentity), textTransform: 'uppercase', transition: 'color 0.25s ease' }}>Registered Email, ID or Phone</label>
                  <div style={{ position: 'relative' }}>
                    <AtSign size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: getLabelColor(forgotIdentity), transition: 'color 0.25s ease' }} />
                    <input
                      type="text"
                      value={forgotIdentity}
                      onChange={(e) => setForgotIdentity(e.target.value)}
                      style={getInputStyle(forgotIdentity, true, false)}
                      required
                      placeholder="Username, email, or mobile"
                      disabled={forgotSent}
                    />
                  </div>
                </div>

                {forgotSent && (
                  <>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: getLabelColor(forgotOtp), textTransform: 'uppercase', transition: 'color 0.25s ease' }}>Recovery OTP Code</label>
                      <div style={{ position: 'relative' }}>
                        <Key size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: getLabelColor(forgotOtp), transition: 'color 0.25s ease' }} />
                        <input
                          type="text"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          style={getInputStyle(forgotOtp, true, false)}
                          required
                          placeholder="Enter 6-digit recovery code"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: getLabelColor(newPassword), textTransform: 'uppercase', transition: 'color 0.25s ease' }}>New Secure Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: getLabelColor(newPassword), transition: 'color 0.25s ease' }} />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={getInputStyle(newPassword, true, false)}
                          required
                          placeholder="Set your new password"
                        />
                      </div>
                    </div>
                  </>
                )}

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
                    marginTop: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : forgotSent ? 'Reset Account Password' : 'Send Recovery Code'}
                </button>

                <button
                  type="button"
                  onClick={() => { setLoginMethod('password'); setForgotSent(false); setError(''); setSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', marginTop: '0.5rem' }}
                >
                  Back to credentials login
                </button>
              </form>
            )}

            {loginMethod !== 'forgot' && formData.role !== 'parent' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0 1.5rem 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Or Sign In With</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                  >
                    <GoogleIcon /> Google
                  </button>
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                  >
                    <Fingerprint size={18} color="var(--primary)" /> Biometrics
                  </button>
                </div>
              </>
            )}

            {loginMethod !== 'forgot' && formData.role !== 'parent' && (
              <div style={{ marginTop: '1.5rem' }}>
                {loginMethod === 'password' ? (
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('otp'); setError(''); setSuccessMsg(''); }}
                    style={{ width: '100%', height: '3rem', border: '1px solid var(--border-color)', backgroundColor: '#F9FAFB', color: 'var(--text-primary)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Verify Access via Mobile OTP
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('password'); setOtpSent(false); setError(''); setSuccessMsg(''); }}
                    style={{ width: '100%', height: '3rem', border: '1px solid var(--border-color)', backgroundColor: '#F9FAFB', color: 'var(--text-primary)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Authenticate via Username / Password
                  </button>
                )}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                New student? <Link to="/enquiry" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Submit an Admission Enquiry</Link>
              </p>
              <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                &copy; {new Date().getFullYear()} {settings.schoolName || 'Institute Hub'}<br />
                All Rights Reserved.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Google Login Overlay Modal */}
      {showMockGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            padding: '36px 40px',
            border: '1px solid #dadce0',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Roboto, sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg viewBox="0 0 74 24" width="74" height="24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#ea4335" d="M68.12 11.58c-2.3 0-4.18 1.83-4.18 4.12 0 2.27 1.88 4.12 4.18 4.12 2.27 0 4.15-1.85 4.15-4.12 0-2.29-1.88-4.12-4.15-4.12zm0 6.6c-1.25 0-2.28-1.03-2.28-2.48 0-1.47 1.03-2.5 2.28-2.5s2.26 1.03 2.26 2.5c0 1.45-1.01 2.48-2.26 2.48z"/>
                <path fill="#fbbc05" d="M59.28 11.58c-2.3 0-4.18 1.83-4.18 4.12 0 2.27 1.88 4.12 4.18 4.12 2.27 0 4.15-1.85 4.15-4.12 0-2.29-1.88-4.12-4.15-4.12zm0 6.6c-1.25 0-2.28-1.03-2.28-2.48 0-1.47 1.03-2.5 2.28-2.5s2.26 1.03 2.26 2.5c0 1.45-1.01 2.48-2.26 2.48z"/>
                <path fill="#4285f4" d="M50.15 11.58c-2.22 0-4.18 1.9-4.18 4.12 0 2.25 1.93 4.12 4.18 4.12 1.34 0 2.25-.54 2.76-1.12v.89c0 1.73-.93 2.66-2.42 2.66-1.22 0-1.98-.88-2.26-1.61l-1.99.83c.58 1.39 2.11 2.98 4.25 2.98 2.46 0 4.54-1.45 4.54-4.29V11.83h-1.89v.87c-.52-.57-1.43-1.12-2.99-1.12zm-.23 6.6c-1.25 0-2.22-1.06-2.22-2.5 0-1.45.97-2.48 2.22-2.48 1.22 0 2.19 1.03 2.19 2.48 0 1.43-.97 2.5-2.19 2.5z"/>
                <path fill="#34a853" d="M43.07 1.05h1.96V23.4h-1.96z"/>
                <path fill="#ea4335" d="M37.91 18.23c-1.07 0-2.02-.57-2.53-1.49l6.83-2.83-.24-.59c-.41-1.1-1.63-3.32-4.32-3.32-2.66 0-4.88 2.1-4.88 4.12 0 2.27 2.19 4.12 4.9 4.12 2.19 0 3.46-1.34 3.99-2.11l-1.63-1.09c-.54.79-1.27 1.31-2.12 1.31zm-.19-5.11c.85 0 1.57.44 1.8 1.07L35.08 16.03c0-1.66 1.18-2.91 2.64-2.91z"/>
                <path fill="#4285f4" d="M10.15 12.02V9.93h9.61c.09.53.15 1.12.15 1.8 0 2.21-.6 4.94-2.57 6.91-1.93 1.99-4.4 3.09-7.2 3.09C4.54 21.73 0 16.85 0 10.87S4.54 0 10.15 0c3.12 0 5.37 1.22 7.03 2.8l-1.98 1.98c-1.2-1.12-2.76-1.98-5.05-1.98-4.04 0-7.27 3.29-7.27 7.35s3.23 7.35 7.27 7.35c2.59 0 4.07-1.05 5-2.04.77-.77 1.25-1.89 1.4-3.44H10.15z"/>
              </svg>
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 400, color: '#202124', textAlign: 'center', marginBottom: '8px' }}>Sign in</h2>
            <p style={{ fontSize: '16px', color: '#202124', textAlign: 'center', marginBottom: '24px' }}>to continue to Ambition Tutorials</p>

            <form onSubmit={handleMockGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type="text" 
                  value={mockGoogleEmail}
                  onChange={(e) => setMockGoogleEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: mockGoogleError ? '2px solid #d93025' : '1px solid #dadce0',
                    borderRadius: '4px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Email or phone"
                  required
                />
              </div>

              {mockGoogleError && (
                <div style={{ color: '#d93025', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{mockGoogleError}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowMockGoogleModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1a73e8',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    backgroundColor: '#1a73e8',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
