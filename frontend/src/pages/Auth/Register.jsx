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
  const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '', iconName: 'GraduationCap' });

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
    // Kept for structure, but we don't need to auto-select a specific chapter anymore
    setFormData(prev => ({ ...prev, course_interest: 'General Admission' }));
  }, [formData.standard, formData.board]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        class_range: formData.standard, // Map standard to class_range for the enquiry API
        board: formData.board || 'State Board',
        exam_target: formData.course_interest || 'None',
        message: 'Registered via public portal. Awaiting conversion.',
      };
      
      // Submit as an Enquiry/Registration Request
      await axios.post('http://localhost:5000/api/enquiry', payload);
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
          maxWidth: '500px', 
          backgroundColor: 'white', 
          padding: '3rem', 
          borderRadius: '24px', 
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ backgroundColor: '#DBEAFE', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={40} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Application Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Your admission request has been submitted successfully and is currently <strong>Pending Review</strong>.
          </p>
          <div style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'left', display: 'flex', gap: '1rem' }}>
             <AlertCircle size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
             <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Our administration team will review your details. You will be contacted shortly to complete the admission process and receive your portal login credentials.
             </p>
          </div>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '3.5rem', borderRadius: '12px', textDecoration: 'none' }}>
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

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
          <div style={{ marginBottom: '2rem', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {settings.logoUrl && settings.logoUrl.startsWith('http') ? (
               <img 
                 src={settings.logoUrl} 
                 alt="Logo" 
                 style={{ maxWidth: '180px', maxHeight: '180px', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }} 
               />
            ) : (() => {
               const IconComp = LucideIcons[settings.iconName] || LucideIcons.GraduationCap;
               return <IconComp size={90} color="white" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))' }} />;
            })()}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>Join {settings.schoolName || 'Institute Hub'}</h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '300px' }}>
            Unlock your potential with our world-class educational portal.
          </p>
        </div>

        {/* Right Side: Form */}
        <div style={{ padding: '3rem', backgroundColor: 'white' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Admission Request</h2>
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  required 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Standard / Class</label>
                <select 
                  required 
                  value={formData.standard}
                  onChange={(e) => {
                    const newStd = e.target.value;
                    const availableBoards = [...new Set(courses.filter(c => c.class_range === newStd).map(c => c.board))];
                    setFormData({
                      ...formData, 
                      standard: newStd,
                      board: availableBoards.length > 0 ? availableBoards[0] : ''
                    });
                  }}
                  style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem', backgroundColor: 'white' }}
                >
                  <option value="">Select Class</option>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Board / Stream</label>
                <select 
                  required 
                  value={formData.board}
                  onChange={(e) => setFormData({...formData, board: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem', backgroundColor: 'white' }}
                >
                  <option value="">Select Board</option>
                  {[...new Set(courses.filter(c => c.class_range === formData.standard).map(c => c.board))].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>



            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date of Birth</label>
                <input 
                  type="date" 
                  required 
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Parent/Guardian Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.parent_name}
                  onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}
                  placeholder="Parent Name"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Parent Phone</label>
                <input 
                  type="text" 
                  required 
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Residential Address</label>
              <textarea 
                required 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem', resize: 'vertical' }}
                placeholder="Full address"
                rows="2"
              ></textarea>
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
  );
};

export default Register;
