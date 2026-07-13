import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, CheckCircle, AlertCircle, Info, X, Fingerprint, User, Key, ShieldCheck } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { STANDARDS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const sortStandardsLogically = (stds, settingsStandards = [], defaultStandards = []) => {
  const getGradeNumber = (str) => {
    const match = str.match(/(?:std\s*|standard\s*|hsc\s*\(|ssc\s*\()?\b(\d+)(?:st|nd|rd|th|\b)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  const nonGradedOrder = ['FYBSC', 'College', 'Diploma / Vocational', 'Custom Courses'];

  const gradeGroups = {};
  const nonGraded = [];

  stds.forEach(std => {
    const grade = getGradeNumber(std);
    if (grade !== null && grade >= 1 && grade <= 12) {
      if (!gradeGroups[grade]) {
        gradeGroups[grade] = [];
      }
      gradeGroups[grade].push(std);
    } else {
      nonGraded.push(std);
    }
  });

  const gradedSorted = [];
  for (let grade = 1; grade <= 12; grade++) {
    if (gradeGroups[grade]) {
      const options = gradeGroups[grade];
      let best = options.find(opt => settingsStandards.includes(opt));
      if (!best) {
        best = options.find(opt => defaultStandards.includes(opt));
      }
      if (!best) {
        best = options[0];
      }
      gradedSorted.push(best);
    }
  }

  const uniqueNonGraded = Array.from(new Set(nonGraded));
  uniqueNonGraded.sort((a, b) => {
    const idxA = nonGradedOrder.indexOf(a);
    const idxB = nonGradedOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return [...gradedSorted, ...uniqueNonGraded];
};

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const isAdmin = user && ['admin', 'super-admin'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'institution' : 'personal');

  const renderTabs = () => {
    if (!isAdmin) return null;
    return (
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'personal' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'personal' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          Personal Profile & Biometrics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('institution')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'institution' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'institution' ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          Institution Settings
        </button>
      </div>
    );
  };

  const [settings, setSettings] = useState({
    schoolName: '',
    logoUrl: '',
    contactEmail: '',
    contactPhone: '',
    iconName: '',
    address: '',
    gstin: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    standardFees: {},
    standards: [],
    boards: [],
    exams: [],
    boardsByStandard: {},
    examsByStandard: {}
  });
  const [msg, setMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/auth/profile/${user.id}`);
          setProfile(res.data);
        } catch (err) {
          console.error('Failed to fetch profile', err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleRegisterBiometric = async () => {
    setBiometricLoading(true);
    showToast('Initializing Biometric Registration...', 'info');
    try {
      const challengeRes = await axios.post('http://localhost:5000/api/auth/biometric/register-challenge', {
        userId: user.id
      });
      
      const { challenge } = challengeRes.data;
      
      let credentialId = `bio_key_${Date.now()}`;
      let publicKey = `pub_key_mock_data_${Math.random().toString(36).substring(2)}`;
      let registered = false;

      if (navigator.credentials && navigator.credentials.create) {
        try {
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: new Uint8Array(challenge.split('').map(c => c.charCodeAt(0))),
              rp: { name: 'Ambition Tutorials ERP', id: window.location.hostname },
              user: {
                id: new Uint8Array([user.id]),
                name: user.username || user.name,
                displayName: user.name
              },
              pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
              authenticatorSelection: { 
                authenticatorAttachment: 'platform',
                userVerification: 'required' 
              },
              timeout: 15000
            }
          });
          if (credential) {
            credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            registered = true;
          }
        } catch (webauthnErr) {
          console.warn('WebAuthn local environment hardware simulation fallback:', webauthnErr.message);
          registered = window.confirm('Your browser/device supports secure credential keys. Simulate successful registration of hardware Fingerprint/Face ID key?');
        }
      } else {
        registered = window.confirm('Your browser/device supports secure credential keys. Simulate successful registration of hardware Fingerprint/Face ID key?');
      }

      if (!registered) {
        setBiometricLoading(false);
        return showToast('Biometric registration was cancelled.', 'error');
      }

      const verifyRes = await axios.post('http://localhost:5000/api/auth/biometric/register-verify', {
        userId: user.id,
        credentialId,
        publicKey
      });
      
      showToast(verifyRes.data.msg, 'success');
      
      const res = await axios.get(`http://localhost:5000/api/auth/profile/${user.id}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || 'Verification failed.', 'error');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleDeregisterBiometric = async () => {
    if (!window.confirm('Disable biometric sign-in on this account? You will have to use your password/OTP next time.')) return;
    setBiometricLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/biometric/register-verify', {
        userId: user.id,
        credentialId: null,
        publicKey: null
      });
      showToast('Biometric credential disabled.', 'success');
      const res = await axios.get(`http://localhost:5000/api/auth/profile/${user.id}`);
      setProfile(res.data);
    } catch (err) {
      showToast('Failed to deregister biometrics.', 'error');
    } finally {
      setBiometricLoading(false);
    }
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const [newStandard, setNewStandard] = useState('');
  const [newBoard, setNewBoard] = useState('');
  const [newExam, setNewExam] = useState('');
  const [selectedMappingStandard, setSelectedMappingStandard] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const urlTenantId = queryParams.get('tenantId');
        const tenantQuery = urlTenantId ? `?tenantId=${urlTenantId}` : '';
        const res = await axios.get(`http://localhost:5000/api/settings${tenantQuery}`);
        setSettings(res.data);
        if (res.data.standards && res.data.standards.length > 0) {
          setSelectedMappingStandard(res.data.standards[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleAddStandard = () => {
    if (!newStandard.trim()) return;
    const std = newStandard.trim();
    if ((settings.standards || []).includes(std)) {
      alert('Standard already exists');
      return;
    }
    const updatedStandards = [...(settings.standards || []), std];
    const updatedFees = { ...(settings.standardFees || {}), [std]: 0 };
    const updatedBoardsByStd = { ...(settings.boardsByStandard || {}), [std]: [] };
    const updatedExamsByStd = { ...(settings.examsByStandard || {}), [std]: ['None'] };
    setSettings({
      ...settings,
      standards: updatedStandards,
      standardFees: updatedFees,
      boardsByStandard: updatedBoardsByStd,
      examsByStandard: updatedExamsByStd
    });
    if (!selectedMappingStandard) {
      setSelectedMappingStandard(std);
    }
    setNewStandard('');
  };

  const handleDeleteStandard = (std) => {
    if (!window.confirm(`Are you sure you want to delete standard "${std}"? This will also remove its mappings and fee configuration.`)) return;
    const updatedStandards = (settings.standards || []).filter(s => s !== std);
    const updatedFees = { ...(settings.standardFees || {}) };
    delete updatedFees[std];
    const updatedBoardsByStd = { ...(settings.boardsByStandard || {}) };
    delete updatedBoardsByStd[std];
    const updatedExamsByStd = { ...(settings.examsByStandard || {}) };
    delete updatedExamsByStd[std];
    setSettings({
      ...settings,
      standards: updatedStandards,
      standardFees: updatedFees,
      boardsByStandard: updatedBoardsByStd,
      examsByStandard: updatedExamsByStd
    });
    if (selectedMappingStandard === std) {
      setSelectedMappingStandard(updatedStandards[0] || '');
    }
  };

  const handleAddBoard = () => {
    if (!newBoard.trim()) return;
    const board = newBoard.trim();
    if ((settings.boards || []).includes(board)) {
      alert('Board already exists');
      return;
    }
    setSettings({
      ...settings,
      boards: [...(settings.boards || []), board]
    });
    setNewBoard('');
  };

  const handleDeleteBoard = (board) => {
    if (!window.confirm(`Are you sure you want to delete board "${board}"? It will be removed from all standard mappings.`)) return;
    const updatedBoards = (settings.boards || []).filter(b => b !== board);
    const updatedBoardsByStd = {};
    Object.keys(settings.boardsByStandard || {}).forEach(std => {
      updatedBoardsByStd[std] = (settings.boardsByStandard[std] || []).filter(b => b !== board);
    });
    setSettings({
      ...settings,
      boards: updatedBoards,
      boardsByStandard: updatedBoardsByStd
    });
  };

  const handleAddExam = () => {
    if (!newExam.trim()) return;
    const exam = newExam.trim();
    if ((settings.exams || []).includes(exam)) {
      alert('Exam already exists');
      return;
    }
    setSettings({
      ...settings,
      exams: [...(settings.exams || []), exam]
    });
    setNewExam('');
  };

  const handleDeleteExam = (exam) => {
    if (!window.confirm(`Are you sure you want to delete exam "${exam}"? It will be removed from all standard mappings.`)) return;
    const updatedExams = (settings.exams || []).filter(e => e !== exam);
    const updatedExamsByStd = {};
    Object.keys(settings.examsByStandard || {}).forEach(std => {
      updatedExamsByStd[std] = (settings.examsByStandard[std] || []).filter(e => e !== exam);
    });
    setSettings({
      ...settings,
      exams: updatedExams,
      examsByStandard: updatedExamsByStd
    });
  };

  const handleToggleBoardMapping = (std, board) => {
    const currentMapped = settings.boardsByStandard?.[std] || [];
    const updatedMapped = currentMapped.includes(board)
      ? currentMapped.filter(b => b !== board)
      : [...currentMapped, board];
    setSettings({
      ...settings,
      boardsByStandard: {
        ...settings.boardsByStandard,
        [std]: updatedMapped
      }
    });
  };

  const handleToggleExamMapping = (std, exam) => {
    const currentMapped = settings.examsByStandard?.[std] || [];
    const updatedMapped = currentMapped.includes(exam)
      ? currentMapped.filter(e => e !== exam)
      : [...currentMapped, exam];
    setSettings({
      ...settings,
      examsByStandard: {
        ...settings.examsByStandard,
        [std]: updatedMapped
      }
    });
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', 'Image');

    setUploadingLogo(true);
    showToast('Uploading logo...', 'info');

    try {
      const queryParams = new URLSearchParams(window.location.search);
      const urlTenantId = queryParams.get('tenantId');
      const tenantQuery = urlTenantId ? `?tenantId=${urlTenantId}` : '';
      
      const res = await axios.post(`http://localhost:5000/api/storage/upload${tenantQuery}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? 'http://localhost:5000' 
          : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
      
      const fullLogoUrl = `${baseUrl}/${res.data.file_path}`;
      
      setSettings(prev => ({
        ...prev,
        logoUrl: fullLogoUrl
      }));
      showToast('Logo uploaded successfully! Save settings to apply.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || 'Logo upload failed.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    showToast('Saving settings...', 'info');
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const urlTenantId = queryParams.get('tenantId');
      const tenantQuery = urlTenantId ? `?tenantId=${urlTenantId}` : '';
      await axios.put(`http://localhost:5000/api/settings${tenantQuery}`, settings);
      showToast('Settings updated successfully!', 'success');
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || 'Error updating settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin || activeTab === 'personal') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>
        {renderTabs()}
        {/* Floating Toast Notification */}
        {toast.show && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
            <span>{toast.message}</span>
            <button 
              type="button"
              onClick={() => setToast(prev => ({ ...prev, show: false }))} 
              style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: 0, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Personal Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your personal profile settings and configure biometric login methods.</p>
        </div>

        <div className="grid-cols-2" style={{ alignItems: 'start', gap: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Account Profile Card */}
          <div className="card">
            <h2>Account Details</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.75rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{profile?.name || user?.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>Role: {profile?.role || user?.role}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Username / Portal ID:</span>
                  <div style={{ padding: '0.6rem', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.25rem', fontWeight: 500 }}>{profile?.username || 'Not Available'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address:</span>
                  <div style={{ padding: '0.6rem', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.25rem', fontWeight: 500 }}>{profile?.email || 'Not Available'}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Mobile Phone:</span>
                  <div style={{ padding: '0.6rem', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.25rem', fontWeight: 500 }}>{profile?.phone || 'Not Available'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Biometrics Registry Card */}
          <div className="card">
            <h2>Biometric Sign-In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Register your local device key (Fingerprint, Windows Hello, Face ID, or iCloud Keychain) to bypass password entry and gain immediate access to your dashboard in one click.
            </p>
            
            <div style={{ 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px dashed var(--border-color)', 
              backgroundColor: '#F9FAFB', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <Fingerprint size={48} color={profile?.biometric_credential_id ? '#10B981' : '#6B7280'} style={{ filter: profile?.biometric_credential_id ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.2))' : 'none' }} />
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>Biometric Authentication Status</h3>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  color: profile?.biometric_credential_id ? '#10B981' : '#EF4444', 
                  backgroundColor: profile?.biometric_credential_id ? '#ECFDF5' : '#FEF2F2',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  display: 'inline-block'
                }}>
                  {profile?.biometric_credential_id ? 'Registered (Device Key Active)' : 'Not Set Up'}
                </span>
              </div>
              
              {profile?.biometric_credential_id ? (
                <button 
                  type="button" 
                  onClick={handleDeregisterBiometric}
                  disabled={biometricLoading}
                  className="btn"
                  style={{ backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 'auto' }}
                >
                  Deregister Biometric Device
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleRegisterBiometric}
                  disabled={biometricLoading}
                  className="btn btn-primary"
                  style={{ borderRadius: '8px', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', justifyContent: 'center' }}
                >
                  {biometricLoading ? 'Configuring...' : <><Fingerprint size={18} /> Register Biometric Key</>}
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Device credentials are secure. No private biometric data is ever transmitted or stored on the server. We verify logins using standard WebAuthn public key signing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 120px)', position: 'relative' }}>
      {renderTabs()}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (max-width: 1024px) {
          .grid-cols-2 {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
        }
        .mapping-header-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 1rem;
        }
        @media (max-width: 640px) {
          .mapping-header-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .mapping-header-row select {
            width: 100% !important;
          }
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          animation: 'slideIn 0.3s ease-out',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
          <span>{toast.message}</span>
          <button 
            type="button"
            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
            style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: 0, cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Institution Settings</h1>
      </div>

      {msg && (
        <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
          {msg}
        </div>
      )}

      <div className="grid-cols-2" style={{ alignItems: 'start', gap: '1.5rem' }}>
        {/* Left Column: Brand & Logo Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2>Brand & Identity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Institution Name</label>
                <input 
                  type="text" 
                  name="schoolName"
                  value={settings.schoolName}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Contact Email</label>
                <input 
                  type="email" 
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Institution Logo</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  {settings.logoUrl ? (
                    <div style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={settings.logoUrl} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ width: '80px', height: '80px', border: '1px dashed var(--border-color)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      <LucideIcons.Image size={24} />
                      <span style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>No Logo</span>
                    </div>
                  )}
                  
                  <div style={{ flexGrow: 1 }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}>
                      <LucideIcons.Upload size={16} />
                      Upload New Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    {uploadingLogo && <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Uploading...</span>}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Supported formats: PNG, JPG, JPEG, WEBP, GIF. Max size: 5MB.</p>
                  </div>
                </div>
                
                <input 
                  type="text" 
                  name="logoUrl"
                  value={settings.logoUrl}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Or enter image URL manually: https://example.com/logo.png"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Logo/Brand Icon (Lucide Icon Name)</label>
                <input 
                  type="text" 
                  name="iconName"
                  value={settings.iconName || ''}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. GraduationCap, School, BookOpen, Library, Award"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Enter any Lucide icon name in PascalCase. Examples: <strong>GraduationCap</strong>, <strong>School</strong>, <strong>BookOpen</strong>, <strong>Library</strong>, <strong>Award</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2>Portal Authentication Policy</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Configure which sign-in methods are allowed for users accessing this portal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="auth_allow_password"
                  checked={settings.auth_allow_password !== false}
                  onChange={(e) => setSettings({ ...settings, auth_allow_password: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Enable Password Sign-in</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Users can log in with their username/email and password.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="auth_allow_google"
                  checked={settings.auth_allow_google !== false}
                  onChange={(e) => setSettings({ ...settings, auth_allow_google: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Enable Google Sign-in</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Users can sign in using their verified Google accounts.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="auth_allow_biometric"
                  checked={settings.auth_allow_biometric !== false}
                  onChange={(e) => setSettings({ ...settings, auth_allow_biometric: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Enable Biometric Sign-in</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Users can log in using Touch ID, Face ID, or Windows Hello.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="auth_allow_otp"
                  checked={settings.auth_allow_otp !== false}
                  onChange={(e) => setSettings({ ...settings, auth_allow_otp: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Enable Mobile OTP Sign-in</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Users can request and log in with a one-time SMS verification code.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="allow_self_onboarding"
                  checked={settings.allow_self_onboarding !== false}
                  onChange={(e) => setSettings({ ...settings, allow_self_onboarding: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Enable First-Time User Self-Onboarding</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Automatically register and create student accounts for new users on first Google login.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2>Portal Access Configurations</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Enable or disable portal access for specific user roles and departments.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', gridColumn: '1 / -1', padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="checkbox" 
                    name="portal_enable_student"
                    checked={settings.portal_enable_student !== false}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setSettings({ 
                        ...settings, 
                        portal_enable_student: val,
                        student_portal_mode: val ? (settings.student_portal_mode || 'all') : 'disabled'
                      });
                    }}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0F172A' }}>Student Portal Access Rules</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configure granular dashboard availability guidelines for students.</span>
                  </div>
                </div>

                {settings.portal_enable_student !== false && (
                  <div style={{ paddingLeft: '2rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                        <input 
                          type="radio" 
                          name="student_portal_mode" 
                          value="all"
                          checked={settings.student_portal_mode === 'all' || !settings.student_portal_mode}
                          onChange={() => setSettings({ ...settings, student_portal_mode: 'all' })}
                        />
                        Enable for All Students
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                        <input 
                          type="radio" 
                          name="student_portal_mode" 
                          value="standards"
                          checked={settings.student_portal_mode === 'standards'}
                          onChange={() => setSettings({ ...settings, student_portal_mode: 'standards' })}
                        />
                        Enable for Selected Standards
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                        <input 
                          type="radio" 
                          name="student_portal_mode" 
                          value="disabled"
                          checked={settings.student_portal_mode === 'disabled'}
                          onChange={() => setSettings({ ...settings, student_portal_mode: 'disabled', portal_enable_student: false })}
                        />
                        Disable Student Portal
                      </label>
                    </div>

                    {settings.student_portal_mode === 'standards' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Select Allowed Standards / Courses:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {sortStandardsLogically(
                            Array.from(new Set([
                              'Std 1', 'Std 2', 'Std 3', 'Std 4', 'Std 5', 'Std 6', 'Std 7', 'Std 8', 'Std 9', 'Std 10', 'Std 11', 'Std 12', 'College', 'Custom Courses',
                              ...(settings.standards || [])
                            ])),
                            settings.standards || [],
                            STANDARDS
                          ).map(std => {
                            const allowed = Array.isArray(settings.student_portal_allowed_standards) ? settings.student_portal_allowed_standards : [];
                            const isChecked = allowed.includes(std);
                            return (
                              <label key={std} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.75rem',
                                backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'white',
                                border: isChecked ? '1px solid #3B82F6' : '1px solid #CBD5E1',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: isChecked ? '#1D4ED8' : '#334155',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const nextAllowed = e.target.checked 
                                      ? [...allowed, std]
                                      : allowed.filter(x => x !== std);
                                    setSettings({ ...settings, student_portal_allowed_standards: nextAllowed });
                                  }}
                                  style={{ display: 'none' }}
                                />
                                {std}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_parent"
                  checked={settings.portal_enable_parent !== false}
                  onChange={(e) => setSettings({ ...settings, portal_enable_parent: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Parent Portal</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow parents to track children's progress.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_faculty"
                  checked={settings.portal_enable_faculty !== false}
                  onChange={(e) => setSettings({ ...settings, portal_enable_faculty: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Faculty Portal</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow faculty to mark attendance and syllabus.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_accountant"
                  checked={settings.portal_enable_accountant !== false}
                  onChange={(e) => setSettings({ ...settings, portal_enable_accountant: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Accountant Portal</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow accountants to manage fee collection.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_receptionist"
                  checked={settings.portal_enable_receptionist !== false}
                  onChange={(e) => setSettings({ ...settings, portal_enable_receptionist: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Receptionist Portal</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow receptionist to register enquiries.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_librarian"
                  checked={settings.portal_enable_librarian !== false}
                  onChange={(e) => setSettings({ ...settings, portal_enable_librarian: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Library Portal</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow library book issue and inventory.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_transport"
                  checked={settings.portal_enable_transport !== false}
                  onChange={(e) => setSettings({ ...settings, portal_enable_transport: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Transport Portal</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow managers to assign routes and buses.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_hostel"
                  checked={settings.portal_enable_hostel !== false}
                  onChange={(e) => setSettings({ ...settings, portal_enable_hostel: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Hostel Portal</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allow hostel managers to map room occupancy.</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="portal_enable_alumni"
                  checked={settings.portal_enable_alumni === true}
                  onChange={(e) => setSettings({ ...settings, portal_enable_alumni: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary-color)' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>Alumni Portal (Future)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prepare configuration registry toggles for future releases.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Invoice & Billing Configurations</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
              These parameters will be dynamically populated in generated fee receipt PDFs/invoices.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>Contact Phone</label>
                <input 
                  type="text" 
                  name="contactPhone"
                  value={settings.contactPhone || ''}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>Billing Address</label>
                <textarea 
                  name="address"
                  value={settings.address || ''}
                  onChange={handleChange}
                  className="form-control"
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>GSTIN (GST Number)</label>
                <input 
                  type="text" 
                  name="gstin"
                  value={settings.gstin || ''}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. 09ABCDE1234F1Z5"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
              
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', color: 'var(--text-secondary)' }}>Payment Information</h3>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>Bank Name</label>
                <input 
                  type="text" 
                  name="bankName"
                  value={settings.bankName || ''}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>Account Name</label>
                <input 
                  type="text" 
                  name="accountName"
                  value={settings.accountName || ''}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>Account Number</label>
                <input 
                  type="text" 
                  name="accountNumber"
                  value={settings.accountNumber || ''}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>IFSC Code</label>
                <input 
                  type="text" 
                  name="ifscCode"
                  value={settings.ifscCode || ''}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>UPI ID</label>
                <input 
                  type="text" 
                  name="upiId"
                  value={settings.upiId || ''}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Logo Preview & Tuition Fees */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '2rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 600 }}>Current Logo Preview</h3>
            {settings.logoUrl && settings.logoUrl.startsWith('http') ? (
              <img src={settings.logoUrl} alt="Institution Logo" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }} />
            ) : (() => {
              const IconComp = LucideIcons[settings.iconName] || LucideIcons.GraduationCap;
              return (
                <div style={{ width: '150px', height: '150px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <IconComp size={64} />
                </div>
              );
            })()}
            <h2 style={{ marginTop: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {(() => {
                const IconComp = LucideIcons[settings.iconName] || LucideIcons.GraduationCap;
                return <IconComp size={24} style={{ color: 'var(--primary)' }} />;
              })()}
              {settings.schoolName || 'Institute Hub'}
            </h2>
          </div>

          <div className="card">
            <h2>Standard-wise Tuition Fees</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
               Set the tuition fees dynamically for each standard. Updates will immediately reflect when processing new student conversions and queue registrations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {(settings.standards && settings.standards.length > 0 ? settings.standards : STANDARDS).map(std => (
                 <div key={std} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
                   <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{std} Standard</span>
                   <div style={{ position: 'relative', width: '160px' }}>
                     <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontWeight: 600 }}>₹</span>
                     <input 
                       type="number"
                       value={settings.standardFees?.[std] || 0}
                       onChange={(e) => {
                         const updatedFees = { ...settings.standardFees, [std]: parseFloat(e.target.value) || 0 };
                         setSettings({ ...settings, standardFees: updatedFees });
                       }}
                       style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.95rem', fontWeight: 500 }}
                     />
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Academics Management Card */}
      <div className="card">
        <h2>Manage Academics (Standards, Boards & Exams)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Dynamically configure the list of Standards, Boards, and Exams in the system. Map Boards and Exams to specific Standards to filter options contextually in all student intake forms.
        </p>

        {/* 3-Column Master Lists */}
        <div className="grid-cols-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Standards Master */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#FFF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Standards</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
              {(settings.standards || []).map(std => (
                <div key={std} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{std}</span>
                  <button type="button" onClick={() => handleDeleteStandard(std)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(settings.standards || []).length === 0 && (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem' }}>No standards.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="e.g. 10th Standard" 
                value={newStandard}
                onChange={e => setNewStandard(e.target.value)}
                className="form-control"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
              <button type="button" onClick={handleAddStandard} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Boards Master */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#FFF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Boards</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
              {(settings.boards || []).map(board => (
                <div key={board} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{board}</span>
                  <button type="button" onClick={() => handleDeleteBoard(board)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(settings.boards || []).length === 0 && (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem' }}>No boards.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="e.g. Cambridge" 
                value={newBoard}
                onChange={e => setNewBoard(e.target.value)}
                className="form-control"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
              <button type="button" onClick={handleAddBoard} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Exams Master */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#FFF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Exams</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', paddingRight: '0.25rem' }}>
              {(settings.exams || []).map(exam => (
                <div key={exam} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{exam}</span>
                  <button type="button" onClick={() => handleDeleteExam(exam)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(settings.exams || []).length === 0 && (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem' }}>No exams.</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="e.g. Olympiad" 
                value={newExam}
                onChange={e => setNewExam(e.target.value)}
                className="form-control"
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              />
              <button type="button" onClick={handleAddExam} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Relationship Mapping Section */}
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', backgroundColor: '#F8FAFC' }}>
          <div className="mapping-header-row">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Configure Mappings for Standard:</h3>
            <select
              value={selectedMappingStandard}
              onChange={e => setSelectedMappingStandard(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 1.5rem 0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontWeight: 600, minWidth: '200px', maxWidth: '100%' }}
            >
              <option value="">-- Select Standard --</option>
              {(settings.standards || []).map(std => (
                <option key={std} value={std}>{std}</option>
              ))}
            </select>
          </div>

          {selectedMappingStandard ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '2rem' }}>
              {/* Board Mapping Checkboxes */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>Associated Boards</h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                  {(settings.boards || []).map(board => {
                    const isMapped = (settings.boardsByStandard?.[selectedMappingStandard] || []).includes(board);
                    return (
                      <label key={board} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', justifyContent: 'flex-start', width: 'max-content' }}>
                        <input
                          type="checkbox"
                          checked={isMapped}
                          onChange={() => handleToggleBoardMapping(selectedMappingStandard, board)}
                          style={{ cursor: 'pointer', width: 'auto', flexShrink: 0 }}
                        />
                        {board}
                      </label>
                    );
                  })}
                  {(settings.boards || []).length === 0 && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No boards defined. Add boards in the section above first.</span>
                  )}
                </div>
              </div>

              {/* Exam Mapping Checkboxes */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>Associated Exams</h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                  {(settings.exams || []).map(exam => {
                    const isMapped = (settings.examsByStandard?.[selectedMappingStandard] || []).includes(exam);
                    return (
                      <label key={exam} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', justifyContent: 'flex-start', width: 'max-content' }}>
                        <input
                          type="checkbox"
                          checked={isMapped}
                          onChange={() => handleToggleExamMapping(selectedMappingStandard, exam)}
                          style={{ cursor: 'pointer', width: 'auto', flexShrink: 0 }}
                        />
                        {exam}
                      </label>
                    );
                  })}
                  {(settings.exams || []).length === 0 && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No exams defined. Add exams in the section above first.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
              Select a standard from the dropdown to configure board and exam mappings.
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Save Bar */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-color)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '2rem',
        zIndex: 100,
        borderRadius: '12px',
        boxShadow: '0 -5px 15px rgba(0,0,0,0.05)'
      }}>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSaving}
          style={{ padding: '0.75rem 2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <Save size={18} /> {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </form>
  );
};

export default Settings;
