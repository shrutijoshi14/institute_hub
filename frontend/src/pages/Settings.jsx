import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Upload } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { STANDARDS, BOARDS_BY_STANDARD } from '../utils/constants';

const Settings = () => {
  const [settings, setSettings] = useState({
    schoolName: '',
    logoUrl: '',
    contactEmail: '',
    iconName: '',
    standardFees: {},
    boardExamCosts: []
  });
  const [msg, setMsg] = useState('');
  const [newRule, setNewRule] = useState({
    standard: STANDARDS[0],
    board: BOARDS_BY_STANDARD[STANDARDS[0]]?.[0] || 'CBSE',
    cost: ''
  });

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

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') || msg.includes('🗑️') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') || msg.includes('🗑️') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
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
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
               <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '1rem', padding: '0.75rem 1.5rem' }}>
                 <Save size={18} style={{ marginRight: '0.5rem' }} /> Save Tuition Fees
               </button>
            </form>
          </div>

          <div className="card">
            <h2>Standard & Board Exam Costs</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
               Manage the board exam registration costs for combinations of standards and boards.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '0.75rem', alignItems: 'end', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Standard</label>
                <select 
                  value={newRule.standard} 
                  onChange={(e) => {
                    const std = e.target.value;
                    const boards = BOARDS_BY_STANDARD[std] || [];
                    setNewRule({
                      standard: std,
                      board: boards.length > 0 ? boards[0] : 'State Board',
                      cost: newRule.cost
                    });
                  }}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}
                >
                  {STANDARDS.map(std => <option key={std} value={std}>{std} Standard</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>School Board / Stream</label>
                <select 
                  value={newRule.board} 
                  onChange={(e) => setNewRule({ ...newRule, board: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}
                >
                  {(BOARDS_BY_STANDARD[newRule.standard] || []).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Exam Cost</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontSize: '0.85rem' }}>₹</span>
                  <input 
                    type="number"
                    placeholder="0"
                    value={newRule.cost}
                    onChange={(e) => setNewRule({ ...newRule, cost: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 1.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-primary"
                onClick={async () => {
                  if (!newRule.cost || isNaN(newRule.cost) || parseFloat(newRule.cost) <= 0) {
                    alert('Please enter a valid cost amount.');
                    return;
                  }
                  const ruleToAdd = {
                    standard: newRule.standard,
                    board: newRule.board,
                    cost: parseFloat(newRule.cost)
                  };
                  const updatedRules = [...(settings.boardExamCosts || [])];
                  const idx = updatedRules.findIndex(r => r.standard === ruleToAdd.standard && r.board === ruleToAdd.board);
                  if (idx > -1) {
                    updatedRules[idx] = ruleToAdd;
                  } else {
                    updatedRules.push(ruleToAdd);
                  }
                  
                  const updatedSettings = { ...settings, boardExamCosts: updatedRules };
                  try {
                    const res = await axios.put('http://localhost:5000/api/settings', updatedSettings);
                    setSettings(res.data);
                    setNewRule(prev => ({ ...prev, cost: '' }));
                    setMsg('✅ Board exam cost rule saved successfully!');
                    setTimeout(() => setMsg(''), 4000);
                  } catch (err) {
                    console.error(err);
                    alert('Error saving cost rule.');
                  }
                }}
                style={{ gridColumn: 'span 3', justifySelf: 'end', padding: '0.6rem 1.2rem', marginTop: '0.5rem' }}
              >
                Add / Update Cost Rule
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.5rem 0' }}>Standard</th>
                    <th style={{ padding: '0.5rem 0' }}>Board / Stream</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Cost</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'center', width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.boardExamCosts || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem 0' }}>No board exam cost rules defined yet.</td>
                    </tr>
                  ) : (
                    (settings.boardExamCosts || []).map((rule, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>{rule.standard}</td>
                        <td style={{ padding: '0.6rem 0' }}>{rule.board}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₹{rule.cost.toLocaleString()}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={async () => {
                              const updatedRules = (settings.boardExamCosts || []).filter((_, i) => i !== idx);
                              const updatedSettings = { ...settings, boardExamCosts: updatedRules };
                              try {
                                const res = await axios.put('http://localhost:5000/api/settings', updatedSettings);
                                setSettings(res.data);
                                setMsg('🗑️ Cost rule removed successfully.');
                                setTimeout(() => setMsg(''), 4000);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
