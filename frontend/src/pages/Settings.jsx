import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { STANDARDS } from '../utils/constants';

const Settings = () => {
  const [settings, setSettings] = useState({
    schoolName: '',
    logoUrl: '',
    contactEmail: '',
    iconName: '',
    standardFees: {},
    standards: [],
    boards: [],
    exams: [],
    boardsByStandard: {},
    examsByStandard: {}
  });
  const [msg, setMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [newStandard, setNewStandard] = useState('');
  const [newBoard, setNewBoard] = useState('');
  const [newExam, setNewExam] = useState('');
  const [selectedMappingStandard, setSelectedMappingStandard] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/settings');
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
               {(settings.standards && settings.standards.length > 0 ? settings.standards : STANDARDS).map(std => (
                 <div key={std} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Configure Mappings for Standard:</h3>
            <select
              value={selectedMappingStandard}
              onChange={e => setSelectedMappingStandard(e.target.value)}
              className="form-control"
              style={{ padding: '0.5rem 1.5rem 0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontWeight: 600, minWidth: '200px' }}
            >
              <option value="">-- Select Standard --</option>
              {(settings.standards || []).map(std => (
                <option key={std} value={std}>{std}</option>
              ))}
            </select>
          </div>

          {selectedMappingStandard ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Board Mapping Checkboxes */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>Associated Boards</h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(settings.boards || []).map(board => {
                    const isMapped = (settings.boardsByStandard?.[selectedMappingStandard] || []).includes(board);
                    return (
                      <label key={board} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isMapped}
                          onChange={() => handleToggleBoardMapping(selectedMappingStandard, board)}
                          style={{ cursor: 'pointer' }}
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
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.75rem', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(settings.exams || []).map(exam => {
                    const isMapped = (settings.examsByStandard?.[selectedMappingStandard] || []).includes(exam);
                    return (
                      <label key={exam} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isMapped}
                          onChange={() => handleToggleExamMapping(selectedMappingStandard, exam)}
                          style={{ cursor: 'pointer' }}
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
