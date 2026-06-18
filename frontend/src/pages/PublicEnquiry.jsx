import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, CheckCircle, GraduationCap, Phone, Mail, BookOpen } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { STANDARDS, BOARDS_BY_STANDARD, EXAMS } from '../utils/constants';

const PublicEnquiry = () => {
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        class_range: '9th',
        board: 'State Board',
        exam_target: 'None',
        course_interest: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '', contactEmail: 'contact@institute.com', iconName: 'GraduationCap' });
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
                    const activeStds = res.data.standards && res.data.standards.length > 0 ? res.data.standards : STANDARDS;
                    const activeBdsByStd = res.data.boardsByStandard && Object.keys(res.data.boardsByStandard).length > 0 ? res.data.boardsByStandard : BOARDS_BY_STANDARD;
                    const defaultStd = activeStds[0] || '9th';
                    const defaultBoard = (activeBdsByStd[defaultStd] || [])[0] || 'State Board';
                    setFormData(prev => ({
                        ...prev,
                        class_range: defaultStd,
                        board: defaultBoard
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch settings', err);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            setFetching(true);
            try {
                const res = await axios.get('http://localhost:5000/api/courses');
                setCourses(res.data);
            } catch (err) {
                console.error('Error fetching courses:', err);
            } finally {
                setFetching(false);
            }
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        const filtered = courses.filter(c => c.class_range === formData.class_range && c.board === formData.board);
        if (filtered.length > 0) {
            if (!filtered.some(f => f.title === formData.course_interest)) {
                setFormData(prev => ({ ...prev, course_interest: filtered[0].title }));
            }
        } else {
            setFormData(prev => ({ ...prev, course_interest: '' }));
        }
    }, [formData.class_range, formData.board, courses]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/api/enquiry', formData);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ 
                height: '100vh', 
                width: '100%',
                display: 'flex', 
                overflowY: 'auto',
                backgroundImage: `url('/login_background_1778426489803.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: isMobile ? '1rem 0.5rem' : '2rem 1rem',
                boxSizing: 'border-box',
                backdropFilter: 'blur(5px)'
            }}>
                <div style={{ 
                    margin: 'auto',
                    width: '100%', 
                    maxWidth: '500px', 
                    backgroundColor: 'white', 
                    padding: isMobile ? '2rem 1.5rem' : '3rem', 
                    borderRadius: isMobile ? '16px' : '24px', 
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    flexShrink: 0
                }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        backgroundColor: '#DCFCE7', 
                        color: '#166534', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.5rem' 
                    }}>
                        <CheckCircle size={40} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Enquiry Submitted!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                        Thank you for your interest in {settings.schoolName || 'Institute Hub'}. Our academic counselors will contact you on <strong>{formData.phone}</strong> shortly.
                    </p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setSubmitted(false)}
                        style={{ width: '100%', justifyContent: 'center', height: '3.5rem', borderRadius: '12px' }}
                    >
                        Submit Another Enquiry
                    </button>
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
            backgroundImage: `url('/login_background_1778426489803.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: isMobile ? '1rem 0.5rem' : '2rem 1rem',
            display: 'flex',
            overflowY: 'auto',
            boxSizing: 'border-box',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{ 
                margin: 'auto',
                width: '100%', 
                maxWidth: '1000px', 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: isMobile ? '16px' : '24px', 
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(10px)',
                flexShrink: 0
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
                     {settings.logoUrl && settings.logoUrl.startsWith('http') ? (
                        <img 
                          src={settings.logoUrl} 
                          alt="Logo" 
                          style={{ maxWidth: isMobile ? '100px' : '120px', maxHeight: isMobile ? '100px' : '120px', objectFit: 'contain', marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))', backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }} 
                        />
                    ) : (() => {
                        const IconComp = LucideIcons[settings.iconName] || LucideIcons.GraduationCap;
                        return <IconComp size={isMobile ? 50 : 60} style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))' }} />;
                    })()}
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.025em' }}>{settings.schoolName || 'Institute Hub'}</h1>
                    <p style={{ fontSize: isMobile ? '0.95rem' : '1.125rem', opacity: 0.9, lineHeight: 1.6 }}>
                        Start your journey towards academic excellence today.
                    </p>
                    <div style={{ marginTop: isMobile ? '1.5rem' : '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.8 }}>
                            <Phone size={18} /> +91 98765 43210
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.8 }}>
                            <Mail size={18} /> {settings.contactEmail || 'contact@institute.com'}
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div style={{ padding: isMobile ? '2rem 1.5rem' : '3rem', backgroundColor: 'white' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: isMobile ? '1.35rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={24} color="var(--primary)" /> Admission Enquiry
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Fill in your details and our counselor will reach out.</p>
                    </div>

                    {error && <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #FCA5A5' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="+91..."
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address</label>
                            <input 
                                type="email" 
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem' }} 
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Standard</label>
                                <select 
                                    value={formData.class_range} 
                                    onChange={e => {
                                        const newStd = e.target.value;
                                        const availableBoards = activeBoardsByStandard[newStd] || [];
                                        setFormData({
                                            ...formData, 
                                            class_range: newStd,
                                            board: availableBoards.length > 0 ? availableBoards[0] : ''
                                        });
                                    }}
                                    style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem', backgroundColor: 'white' }}
                                >
                                    {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Board</label>
                                <select 
                                    value={formData.board} 
                                    onChange={e => setFormData({...formData, board: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem', backgroundColor: 'white' }}
                                    disabled={fetching}
                                >
                                    {fetching ? <option>Loading...</option> : (() => {
                                        const availableBoards = activeBoardsByStandard[formData.class_range] || [];
                                        if (availableBoards.length === 0) return <option value="">No boards available</option>;
                                        return availableBoards.map(b => <option key={b} value={b}>{b}</option>);
                                    })()}
                                </select>
                            </div>
                        </div>

                        {(() => {
                            if (fetching) return <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading courses...</p>;
                            const filtered = courses.filter(c => c.class_range === formData.class_range && c.board === formData.board);
                            if (filtered.length === 0) return null;
                            return (
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Course Interest</label>
                                    <select 
                                        value={formData.course_interest} 
                                        onChange={e => setFormData({...formData, course_interest: e.target.value, exam_target: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--primary)', outline: 'none', fontSize: '0.95rem', backgroundColor: '#F0F9FF' }}
                                    >
                                        <option value="">Select a program...</option>
                                        {filtered.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                                    </select>
                                </div>
                            );
                        })()}

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Message</label>
                            <textarea 
                                rows="2" 
                                placeholder="Any specific requirements..."
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem', resize: 'none' }}
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ height: '3.5rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : <><Send size={20} /> Submit Enquiry</>}
                        </button>
                    </form>
                    
                    <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                        &copy; {new Date().getFullYear()} {settings.schoolName || 'Institute Hub'}. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicEnquiry;
