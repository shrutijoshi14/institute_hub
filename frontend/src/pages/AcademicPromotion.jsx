import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, UserCheck, Plus, Check, Power, AlertTriangle, Users } from 'lucide-react';

const AcademicPromotion = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  
  // Promotion inputs
  const [fromBatchId, setFromBatchId] = useState('');
  const [toBatchId, setToBatchId] = useState('');
  const [toCourseId, setToCourseId] = useState('');
  const [toStandard, setToStandard] = useState('');
  const [targetYearName, setTargetYearName] = useState('');

  // Add Session Input
  const [newSession, setNewSession] = useState({ name: '', start_date: '', end_date: '', is_active: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const sessionRes = await axios.get('http://localhost:5000/api/academic-years');
      const batchRes = await axios.get('http://localhost:5000/api/batches');
      const courseRes = await axios.get('http://localhost:5000/api/courses');
      const studentRes = await axios.get('http://localhost:5000/api/auth/users?role=student');

      setSessions(sessionRes.data);
      setBatches(batchRes.data);
      setCourses(courseRes.data);
      setStudents(studentRes.data);
    } catch (err) {
      console.error('Academic Promotion Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students based on batch selection
  useEffect(() => {
    if (!fromBatchId) {
      setFilteredStudents([]);
      return;
    }
    const filtered = students.filter(student => {
      // Find enrollment that matches the fromBatchId
      const hasBatch = student.Enrollments && student.Enrollments.some(e => String(e.batch_id) === String(fromBatchId));
      return hasBatch;
    });
    setFilteredStudents(filtered);
    setSelectedStudentIds([]); // Clear selection when batch changes
  }, [fromBatchId, students]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSession.name || !newSession.start_date || !newSession.end_date) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/academic-years', newSession);
      setNewSession({ name: '', start_date: '', end_date: '', is_active: false });
      setMsg({ text: 'Academic Session created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Failed to create academic session.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivate = async (id, currentActive) => {
    try {
      await axios.put(`http://localhost:5000/api/academic-years/${id}`, { is_active: !currentActive });
      setMsg({ text: 'Academic session status updated!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to update session status.', type: 'danger' });
    }
  };

  const handleSelectStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handlePromoteStudents = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      setMsg({ text: 'Please select at least one student to promote.', type: 'danger' });
      return;
    }
    if (!targetYearName || !toCourseId || !toBatchId || !toStandard) {
      setMsg({ text: 'Please fill out all promotion parameters.', type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/academic-years/promote', {
        studentIds: selectedStudentIds,
        targetYearName,
        toCourseId,
        toBatchId,
        toStandard
      });
      setMsg({ text: response.data.msg, type: 'success' });
      setSelectedStudentIds([]);
      setFromBatchId('');
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Failed to promote students.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Academic Session & Promotion</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Create academic years, close sessions, and promote student batches to their next grade class.
      </p>

      {msg.text && (
        <div style={{
          padding: '1rem',
          backgroundColor: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: msg.type === 'success' ? '#047857' : '#B91C1C',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          fontSize: '0.9rem'
        }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        <button 
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : ''}`} 
          style={{ minWidth: '150px' }}
          onClick={() => { setActiveTab('sessions'); setMsg({ text: '', type: '' }); }}
        >
          <Calendar size={18} style={{ marginRight: '0.5rem' }} /> Academic Sessions
        </button>
        <button 
          className={`btn ${activeTab === 'promote' ? 'btn-primary' : ''}`} 
          style={{ minWidth: '150px' }}
          onClick={() => { setActiveTab('promote'); setMsg({ text: '', type: '' }); }}
        >
          <UserCheck size={18} style={{ marginRight: '0.5rem' }} /> Promote Students
        </button>
      </div>

      {activeTab === 'sessions' && (
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          {/* Add Session Form */}
          <div className="card">
            <h2>Add Academic Session</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Define a new calendar session (e.g. 2026-2027) for this tenant.
            </p>
            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Session Name</label>
                <input
                  type="text"
                  value={newSession.name}
                  onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 2026-2027"
                  required
                />
              </div>
              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Start Date</label>
                  <input
                    type="date"
                    value={newSession.start_date}
                    onChange={(e) => setNewSession({ ...newSession, start_date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>End Date</label>
                  <input
                    type="date"
                    value={newSession.end_date}
                    onChange={(e) => setNewSession({ ...newSession, end_date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newSession.is_active}
                  onChange={(e) => setNewSession({ ...newSession, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Set as Active Session</label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
                <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Session
              </button>
            </form>
          </div>

          {/* Sessions List */}
          <div className="card">
            <h2>Academic Sessions History</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Only one academic year remains active at any given time.
            </p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Session Name</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.start_date} to {s.end_date}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: s.is_active ? '#ECFDF5' : '#F3F4F6',
                          color: s.is_active ? '#059669' : '#6B7280'
                        }}>
                          {s.is_active ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn" 
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            minWidth: 'auto',
                            backgroundColor: s.is_active ? '#FEF2F2' : '#EEF2FF',
                            color: s.is_active ? '#DC2626' : '#4F46E5'
                          }}
                          onClick={() => handleToggleActivate(s.id, s.is_active)}
                        >
                          <Power size={14} style={{ marginRight: '0.25rem' }} /> {s.is_active ? 'Close' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'promote' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <form onSubmit={handlePromoteStudents} className="card">
            <h2>Batch Student Promotion Wizard</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Move active students from a source batch/class to a target batch/class in the new academic year.
            </p>

            <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
              {/* SOURCE FILTER */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Source Information</h3>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>From Batch (Source)</label>
                  <select 
                    value={fromBatchId} 
                    onChange={(e) => setFromBatchId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select source batch...</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.standard} - {b.board})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TARGET PROMOTION PARAMETERS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Target Promotion parameters</h3>
                
                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Target Academic Year</label>
                    <select 
                      value={targetYearName} 
                      onChange={(e) => setTargetYearName(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                      required
                    >
                      <option value="">Select target session...</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.name}>{s.name} {s.is_active ? '(Active)' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Target Standard (Grade Class)</label>
                    <input
                      type="text"
                      value={toStandard}
                      onChange={(e) => setToStandard(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                      placeholder="e.g. 10th Std"
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Promote to Course</label>
                    <select 
                      value={toCourseId} 
                      onChange={(e) => setToCourseId(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                      required
                    >
                      <option value="">Select target course...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({c.class_range})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Promote to Batch</label>
                    <select 
                      value={toBatchId} 
                      onChange={(e) => setToBatchId(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                      required
                    >
                      <option value="">Select target batch...</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Selector Table */}
            {fromBatchId && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Select Students ({selectedStudentIds.length} selected)</h3>
                  <button type="button" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={handleSelectAll}>
                    {selectedStudentIds.length === filteredStudents.length ? 'Clear Selection' : 'Select All Batch'}
                  </button>
                </div>

                <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>Select</th>
                        <th>Student Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Current Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => (
                        <tr key={student.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                            />
                          </td>
                          <td><strong>{student.name}</strong></td>
                          <td><code>{student.username}</code></td>
                          <td>{student.email}</td>
                          <td>{student.phone}</td>
                          <td>{student.standard || 'N/A'}</td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No active students found in this batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ height: '3.25rem', borderRadius: '12px', minWidth: '250px', justifyContent: 'center' }} disabled={loading || selectedStudentIds.length === 0}>
                    <UserCheck size={18} style={{ marginRight: '0.5rem' }} /> Promote {selectedStudentIds.length} Students
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default AcademicPromotion;
