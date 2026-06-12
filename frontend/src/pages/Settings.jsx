import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Upload } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    schoolName: '',
    logoUrl: '',
    contactEmail: '',
    iconName: ''
  });
  const [msg, setMsg] = useState('');

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
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/settings', settings);
      setMsg('✅ Settings updated successfully! Refresh the page to see logo changes (if applied globally).');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error updating settings.');
    }
  };

  return (
    <div>
      <h1 className="page-title">Institution Settings</h1>

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
        {msg}
      </div>}

      <div className="grid-cols-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2>Brand & Identity</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Institution Name</label>
              <input 
                type="text" 
                name="schoolName"
                value={settings.schoolName}
                onChange={handleChange}
                className="form-control"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
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
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Logo URL</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  name="logoUrl"
                  value={settings.logoUrl}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="https://example.com/logo.png"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
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

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}>
              <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes
            </button>
          </form>
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
    </div>
  );
};

export default Settings;
