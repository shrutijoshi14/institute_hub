import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { STANDARDS } from '../utils/constants';

const Settings = () => {
  const [settings, setSettings] = useState({
    schoolName: '',
    logoUrl: '',
    contactEmail: '',
    iconName: '',
    standardFees: {}
  });
  const [msg, setMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/settings');
        setSettings(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put('http://localhost:5000/api/settings', settings);
      setMsg('✅ Settings updated successfully! Refresh the page to see logo changes (if applied globally).');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error updating settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 'calc(100vh - 120px)', position: 'relative' }}>
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

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Logo URL</label>
                <input 
                  type="text" 
                  name="logoUrl"
                  value={settings.logoUrl}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="https://example.com/logo.png"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Provide a valid image URL for the institution logo.</p>
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
        </div>

        {/* Right Column: Tuition Fees */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h2>Standard-wise Tuition Fees</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
               Set the tuition fees dynamically for each standard. Updates will immediately reflect when processing new student conversions and queue registrations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {STANDARDS.map(std => (
                 <div key={std} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                   <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{std} Standard</span>
                   <div style={{ position: 'relative', width: '160px' }}>
                     <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontWeight: 600 }}>₹</span>
                     <input 
                       type="number"
                       value={settings.standardFees?.[std] || ''}
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
