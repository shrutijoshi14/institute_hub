import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Phone, Lock, AtSign, Loader2, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STANDARDS, BOARDS_BY_STANDARD } from '../../utils/constants';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    standard: '',
    board: '',
    course_interest: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    dob: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [settings, setSettings] = useState({ 
    schoolName: 'Institute Hub', 
    logoUrl: '', 
    iconName: 'GraduationCap',
    standards: [],
    boards: [],
    exams: [],
    boardsByStandard: {},
    examsByStandard: {}
  });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 800;

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid 10-15 digit phone number';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.standard) errors.standard = 'Standard / Class selection is required';
    if (!formData.board) errors.board = 'Board / Stream selection is required';
    if (!formData.dob) errors.dob = 'Date of birth is required';
    if (!formData.parent_name.trim()) errors.parent_name = 'Parent/Guardian name is required';
    if (!formData.parent_phone.trim()) {
      errors.parent_phone = 'Parent phone number is required';
    } else if (!/^\+?[\d\s-]{10,15}$/.test(formData.parent_phone.replace(/\s/g, ''))) {
      errors.parent_phone = 'Please enter a valid parent phone number';
    }
    if (!formData.address.trim()) errors.address = 'Residential address is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getInputStyle = (errorKey, hasLeftIcon = true) => {
    const baseStyle = {
      width: '100%',
      padding: hasLeftIcon ? '0.75rem 1rem 0.75rem 2.5rem' : '0.75rem 1rem',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      outline: 'none',
      fontSize: '0.95rem',
      transition: 'all 0.25s ease-in-out',
      backgroundColor: 'white'
    };
    
    if (validationErrors[errorKey]) {
      return {
        ...baseStyle,
        border: '1px solid #EF4444',
        backgroundColor: '#FEF2F2',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)'
      };
    }

    const val = formData[errorKey];
    if (val && (typeof val === 'string' ? val.trim().length > 0 : true)) {
      return {
        ...baseStyle,
        border: '1px solid #10B981',
        backgroundColor: '#F0FDF4',
        boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)'
      };
    }
    
    return baseStyle;
  };

  const getLabelColor = (key) => {
    if (validationErrors[key]) return '#EF4444';
    const val = formData[key];
    if (val && (typeof val === 'string' ? val.trim().length > 0 : true)) {
      return '#10B981';
    }
    return 'var(--text-secondary)';
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/courses');
        setCourses(res.data);
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchCourses();
  }, []);

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

  useEffect(() => {
    setFormData(prev => ({ ...prev, course_interest: 'General Admission' }));
  }, [formData.standard, formData.board]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.error-input');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorEl.focus();
        }
      }, 50);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        password: formData.password,
        class: formData.standard, // registration API uses 'class'
        board: formData.board || 'State Board',
        course_interest: formData.course_interest || 'General Admission',
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        address: formData.address,
        dob: formData.dob || null,
        fee_plan: 'One-time',
        total_installments: 1,
        token_amount: 0
      };
      
      await axios.post('http://localhost:5000/api/registration', payload);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
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
            maxWidth: '520px', 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            padding: isMobile ? '2.25rem 1.5rem' : '3.5rem', 
            borderRadius: isMobile ? '20px' : '28px', 
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ 
              backgroundColor: '#D1FAE5', 
              color: '#10B981', 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 0 8px #ECFDF5'
            }}>
              <CheckCircle size={40} />
            </div>
            
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>Admission Submitted!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Thank you for applying to <strong>{settings.schoolName || 'Vasudev Classes'}</strong>. Your registration profile has been recorded.
            </p>

            <div style={{ 
              backgroundColor: '#F8FAFC', 
              padding: '1.5rem', 
              borderRadius: '16px', 
              marginBottom: '2rem', 
              textAlign: 'left', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '0.75rem', 
              width: '100%',
              border: '1px solid var(--border-color)' 
            }}>
               <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary Details</h3>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Student Name:</span>
                 <strong style={{ color: 'var(--text-primary)' }}>{formData.name}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Standard / Class:</span>
                 <strong style={{ color: 'var(--text-primary)' }}>{formData.standard}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Board / Stream:</span>
                 <strong style={{ color: 'var(--text-primary)' }}>{formData.board}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Parent Name:</span>
                 <strong style={{ color: 'var(--text-primary)' }}>{formData.parent_name}</strong>
               </div>
            </div>

            <div style={{ backgroundColor: '#EFF6FF', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'left', display: 'flex', gap: '0.75rem', width: '100%', border: '1px solid #BFDBFE' }}>
               <AlertCircle size={22} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
               <p style={{ margin: 0, fontSize: '0.825rem', color: '#1E40AF', lineHeight: 1.5 }}>
                  Our admissions office is currently reviewing your registration. You will be contacted shortly to verify your details and receive access credentials.
               </p>
            </div>

            <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '3.5rem', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Return to Login Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeStandards = settings?.standards && settings.standards.length > 0 ? settings.standards : STANDARDS;
  const activeBoardsByStandard = settings?.boardsByStandard && Object.keys(settings.boardsByStandard).length > 0 ? settings.boardsByStandard : BOARDS_BY_STANDARD;

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
        {/* Left Side: Branding */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', 
          padding: isMobile ? '2rem 1.5rem' : '3rem', 
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: isMobile ? '1rem' : '2rem', height: isMobile ? '120px' : '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {settings.logoUrl && settings.logoUrl.startsWith('http') ? (
               <img 
                 src={settings.logoUrl} 
                 alt="Logo" 
                 style={{ maxWidth: isMobile ? '120px' : '180px', maxHeight: isMobile ? '120px' : '180px', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }} 
               />
            ) : (() => {
               const IconComp = LucideIcons[settings.iconName] || LucideIcons.GraduationCap;
               return <IconComp size={isMobile ? 60 : 90} color="white" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))' }} />;
            })()}
          </div>
          <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>Join {settings.schoolName || 'Institute Hub'}</h1>
          <p style={{ fontSize: isMobile ? '0.95rem' : '1.125rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '300px' }}>
            Unlock your potential with our world-class educational portal.
          </p>
        </div>

        {/* Right Side: Form */}
        <div style={{ padding: isMobile ? '2rem 1.5rem' : '3rem', backgroundColor: 'white' }}>
          <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <h2 style={{ fontSize: isMobile ? '1.35rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Admission Request</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Submit your details to start your student journey.</p>
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

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ 
              borderBottom: '1px solid var(--border-color)', 
              paddingBottom: '0.5rem', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                color: 'var(--primary)', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '0.2rem 0.5rem', 
                borderRadius: '6px' 
              }}>Step 1</span>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>Student Info</h3>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.name ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: validationErrors.name ? '#EF4444' : 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value});
                    if (validationErrors.name) setValidationErrors({...validationErrors, name: ''});
                  }}
                  className={validationErrors.name ? 'error-input' : ''}
                  style={getInputStyle('name')}
                  placeholder="John Doe"
                />
              </div>
              {validationErrors.name && (
                <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                  {validationErrors.name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.email ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: validationErrors.email ? '#EF4444' : 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    if (validationErrors.email) setValidationErrors({...validationErrors, email: ''});
                  }}
                  className={validationErrors.email ? 'error-input' : ''}
                  style={getInputStyle('email')}
                  placeholder="john@example.com"
                />
              </div>
              {validationErrors.email && (
                <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                  {validationErrors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.phone ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: validationErrors.phone ? '#EF4444' : 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({...formData, phone: e.target.value});
                    if (validationErrors.phone) setValidationErrors({...validationErrors, phone: ''});
                  }}
                  className={validationErrors.phone ? 'error-input' : ''}
                  style={getInputStyle('phone')}
                  placeholder="+91 9876543210"
                />
              </div>
              {validationErrors.phone && (
                <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                  {validationErrors.phone}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.password ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Choose Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: validationErrors.password ? '#EF4444' : 'var(--text-secondary)' }} />
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      if (validationErrors.password) setValidationErrors({...validationErrors, password: ''});
                    }}
                    className={validationErrors.password ? 'error-input' : ''}
                    style={getInputStyle('password')}
                    placeholder="••••••••"
                  />
                </div>
                {validationErrors.password && (
                  <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                    {validationErrors.password}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.confirmPassword ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: validationErrors.confirmPassword ? '#EF4444' : 'var(--text-secondary)' }} />
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({...formData, confirmPassword: e.target.value});
                      if (validationErrors.confirmPassword) setValidationErrors({...validationErrors, confirmPassword: ''});
                    }}
                    className={validationErrors.confirmPassword ? 'error-input' : ''}
                    style={getInputStyle('confirmPassword')}
                    placeholder="••••••••"
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                    {validationErrors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.standard ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Standard / Class</label>
                <select 
                  value={formData.standard}
                  onChange={(e) => {
                    const newStd = e.target.value;
                    const availableBoards = activeBoardsByStandard[newStd] || [];
                    setFormData({
                      ...formData, 
                      standard: newStd,
                      board: availableBoards.length > 0 ? availableBoards[0] : ''
                    });
                    if (validationErrors.standard) setValidationErrors({...validationErrors, standard: '', board: ''});
                  }}
                  className={validationErrors.standard ? 'error-input' : ''}
                  style={getInputStyle('standard', false)}
                >
                  <option value="">Select Class</option>
                  {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {validationErrors.standard && (
                  <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                    {validationErrors.standard}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.board ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Board / Stream</label>
                <select 
                  value={formData.board}
                  onChange={(e) => {
                    setFormData({...formData, board: e.target.value});
                    if (validationErrors.board) setValidationErrors({...validationErrors, board: ''});
                  }}
                  className={validationErrors.board ? 'error-input' : ''}
                  style={getInputStyle('board', false)}
                >
                  <option value="">Select Board</option>
                  {(activeBoardsByStandard[formData.standard] || []).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {validationErrors.board && (
                  <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                    {validationErrors.board}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.dob ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => {
                    setFormData({...formData, dob: e.target.value});
                    if (validationErrors.dob) setValidationErrors({...validationErrors, dob: ''});
                  }}
                  className={validationErrors.dob ? 'error-input' : ''}
                  style={getInputStyle('dob', false)}
                />
                {validationErrors.dob && (
                  <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                    {validationErrors.dob}
                  </span>
                )}
              </div>
            </div>

            <div style={{ 
              borderBottom: '1px solid var(--border-color)', 
              paddingBottom: '0.5rem', 
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                color: 'var(--primary)', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '0.2rem 0.5rem', 
                borderRadius: '6px' 
              }}>Step 2</span>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>Parent & Address</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.parent_name ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Parent/Guardian Name</label>
                <input 
                  type="text" 
                  value={formData.parent_name}
                  onChange={(e) => {
                    setFormData({...formData, parent_name: e.target.value});
                    if (validationErrors.parent_name) setValidationErrors({...validationErrors, parent_name: ''});
                  }}
                  className={validationErrors.parent_name ? 'error-input' : ''}
                  style={getInputStyle('parent_name', false)}
                  placeholder="Parent Name"
                />
                {validationErrors.parent_name && (
                  <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                    {validationErrors.parent_name}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.parent_phone ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Parent Phone</label>
                <input 
                  type="text" 
                  value={formData.parent_phone}
                  onChange={(e) => {
                    setFormData({...formData, parent_phone: e.target.value});
                    if (validationErrors.parent_phone) setValidationErrors({...validationErrors, parent_phone: ''});
                  }}
                  className={validationErrors.parent_phone ? 'error-input' : ''}
                  style={getInputStyle('parent_phone', false)}
                  placeholder="+91 9876543210"
                />
                {validationErrors.parent_phone && (
                  <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                    {validationErrors.parent_phone}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: validationErrors.address ? '#EF4444' : 'var(--text-secondary)', textTransform: 'uppercase' }}>Residential Address</label>
              <textarea 
                value={formData.address}
                onChange={(e) => {
                  setFormData({...formData, address: e.target.value});
                  if (validationErrors.address) setValidationErrors({...validationErrors, address: ''});
                }}
                className={validationErrors.address ? 'error-input' : ''}
                style={getInputStyle('address', false)}
                placeholder="Full address"
                rows="2"
              ></textarea>
              {validationErrors.address && (
                <span className="error-message" style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem', display: 'block' }}>
                  {validationErrors.address}
                </span>
              )}
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
              {loading ? <Loader2 className="animate-spin" /> : <><ArrowRight size={20} /> Submit Request</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default Register;
