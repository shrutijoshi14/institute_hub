import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, X, Clock, Trash2, Edit, Filter } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS } from '../utils/constants';
import BiometricScan from '../components/BiometricScan';

const Attendance = () => {
  const { user, role } = useAuth();
  const [msg, setMsg] = useState('');
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [studentHistory, setStudentHistory] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [editingLog, setEditingLog] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const batchRes = await axios.get('http://localhost:5000/api/batches');
      setBatches(batchRes.data || []);
      
      if (role === 'admin' || role === 'faculty') {
        const standardParam = selectedStandard !== 'All' ? `?standard=${selectedStandard}` : '';
        const statsRes = await axios.get(`http://localhost:5000/api/academic/admin/reports${standardParam}`);
        setStudents(statsRes.data.attendanceReport || []);
        const historyRes = await axios.get(`http://localhost:5000/api/academic/admin/history/attendance${standardParam}`);
        setHistory(historyRes.data || []);
      } else {
        const studentId = role === 'parent' ? user.childId : user.id;
        if (studentId) {
          const res = await axios.get(`http://localhost:5000/api/academic/attendance/${studentId}`);
          setStudentHistory(res.data || []);
        } else {
          setStudentHistory([]);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [role, user.id, user.childId, selectedStandard]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEditingLog(null);
        setShowBioModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMark = async (studentId) => {
    try {
      const status = statusDrafts[studentId] || 'present';
      await axios.post('http://localhost:5000/api/academic/attendance', {
        student_id: studentId,
        date: new Date().toISOString().split('T')[0],
        status: status
      });
      setMsg(`✅ Attendance marked ${status} for student.`);
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  const handleBioVerify = async () => {
    try {
      await axios.post('http://localhost:5000/api/academic/attendance', {
        student_id: user.id,
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      });
      setMsg('✅ Attendance successfully marked via Biometric Scan!');
      setShowBioModal(false);
      fetchData();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) { console.error(err); }
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Permanently remove this attendance log?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/academic/attendance/${id}`);
      setMsg('✅ Attendance log removed.');
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  const editLog = async (e) => {
    e.preventDefault();
    if (!editStatus) return;
    try {
      await axios.put(`http://localhost:5000/api/academic/attendance/${editingLog.id}`, { status: editStatus });
      setMsg('✅ Attendance status updated.');
      fetchData();
      setEditingLog(null);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  const filteredStudents = students.filter(st => {
    if (selectedStandard !== 'All' && st.standard !== selectedStandard) return false;
    if (selectedBoard !== 'All' && st.board !== selectedBoard) return false;
    if (selectedExam !== 'All' && st.exam_target !== selectedExam) return false;
    if (selectedBatch && String(st.batch_id) !== String(selectedBatch)) return false;
    return true;
  });

  const filteredHistory = history.filter(log => {
    if (selectedStandard !== 'All' && log.standard !== selectedStandard) return false;
    if (selectedBoard !== 'All' && log.board !== selectedBoard) return false;
    if (selectedExam !== 'All' && log.exam_target !== selectedExam) return false;
    if (selectedBatch && String(log.batch_id) !== String(selectedBatch)) return false;
    return true;
  });

  if (role === 'admin' || role === 'faculty') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Attendance Control</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Filter size={16} color="var(--primary)" />
                <select 
                  value={selectedStandard} 
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}
                >
                  <option value="All">All Standards</option>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <select 
               value={selectedBoard} 
               onChange={(e) => setSelectedBoard(e.target.value)}
               style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
             >
               <option value="All">All Boards</option>
               {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
             <select 
               value={selectedExam} 
               onChange={(e) => setSelectedExam(e.target.value)}
               style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
             >
               <option value="All">All Exams</option>
               {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
             </select>
             <select 
               value={selectedBatch} 
               onChange={(e) => setSelectedBatch(e.target.value)}
               style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
             >
               <option value="">All Batches</option>
               {batches
                 .filter(b => selectedStandard === 'All' || b.standard === selectedStandard)
                 .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
             <button className="btn" onClick={() => setShowHistory(!showHistory)} style={{ border: showHistory ? '1px solid var(--primary)' : '1px solid var(--border-color)', backgroundColor: showHistory ? '#EFF6FF' : '#F8FAFC', color: showHistory ? 'var(--primary)' : 'var(--text)', fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
               {showHistory ? 'Daily Roll Call' : 'Attendance History'}
             </button>
          </div>
        </div>
        
        {msg && <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}

        <div className="card">
          {showHistory ? (
            <>
              <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Historical Attendance Logs</h2>
              <div className="table-container" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Student</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Class Info</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No historical logs found.</td></tr>
                    ) : filteredHistory.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{log.student_name}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(log.date).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '1rem' }}>
                          {log.batch_name ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{log.batch_name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.subject ? `${log.subject} - ` : ''}{log.topic || 'General Session'}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#9CA3AF', fontStyle: 'italic' }}>Generic Check-in</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.35rem 0.75rem', 
                            borderRadius: '999px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            backgroundColor: log.status === 'present' ? '#D1FAE5' : log.status === 'late' ? '#FEF3C7' : '#FEE2E2',
                            color: log.status === 'present' ? '#065F46' : log.status === 'late' ? '#92400E' : '#991B1B'
                          }}>
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button onClick={() => { setEditingLog(log); setEditStatus(log.status); }} style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title="Change Status"><Edit size={16}/></button>
                            <button onClick={() => deleteLog(log.id)} style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title="Delete Log"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Marking for: {new Date().toLocaleDateString('en-GB')}</span>
                {role === 'faculty' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Instructor: {user.name}</span>}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Student Name</th><th>Mark Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(st => (
                      <tr key={st.student_id}>
                        <td style={{ fontWeight: 500 }}>{st.student_name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['present', 'absent', 'late'].map(stat => (
                              <button 
                                key={stat}
                                onClick={() => setStatusDrafts({...statusDrafts, [st.student_id]: stat})}
                                style={{ 
                                  padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer',
                                  backgroundColor: (statusDrafts[st.student_id] || 'present') === stat ? (stat === 'present' ? '#D1FAE5' : stat === 'absent' ? '#FEE2E2' : '#FEF3C7') : 'white',
                                  color: (statusDrafts[st.student_id] || 'present') === stat ? (stat === 'present' ? '#065F46' : stat === 'absent' ? '#991B1B' : '#92400E') : 'var(--text-secondary)',
                                  fontWeight: (statusDrafts[st.student_id] || 'present') === stat ? 700 : 400
                                }}
                              >
                                {stat.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td><button onClick={() => handleMark(st.student_id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Save</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {editingLog && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2 style={{ margin: 0 }}>Edit Attendance Status</h2>
                <button onClick={() => setEditingLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>
              <form onSubmit={editLog}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Student: <strong>{editingLog.student_name}</strong><br/>
                    Date: <strong>{new Date(editingLog.date).toLocaleDateString('en-GB')}</strong>
                  </p>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Update Status</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setEditingLog(null)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Status</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Student View (Isolated)
  const attendancePerc = studentHistory.length > 0 
    ? Math.round((studentHistory.filter(h => h.status === 'present' || h.status === 'late').length / studentHistory.length) * 100) 
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>My Attendance Record</h1>
        <button className="btn btn-primary" onClick={() => setShowBioModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Clock size={18} /> Daily Check-In
        </button>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}

      <div className="grid-cols-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '50%', background: `conic-gradient(var(--secondary) ${attendancePerc}%, #E2E8F0 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
              {attendancePerc}%
            </div>
          </div>
          <h2 style={{ marginTop: '1.5rem' }}>Overall Attendance for {user.name}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Based on {studentHistory.length} total logged sessions.</p>
        </div>
        <div className="card">
          <h2>Recent History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {studentHistory.slice(0, 8).map(record => (
               <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Calendar size={16} color="var(--text-secondary)" /> {new Date(record.date).toLocaleDateString('en-GB')}
                 </div>
                 {record.status === 'absent' ? <span style={{ color: '#EF4444', fontWeight: 600 }}>ABSENT</span> 
                  : record.status === 'late' ? <span style={{ color: '#F59E0B', fontWeight: 600 }}>LATE</span>
                  : <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>PRESENT</span>}
               </div>
            ))}
            {studentHistory.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No records available for your profile.</p>}
          </div>
        </div>
      </div>

      {showBioModal && (
        <div className="modal-overlay">
           <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Biometric Check-In</h2>
                <button onClick={() => setShowBioModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>
              <div className="modal-body">
                <BiometricScan onVerify={handleBioVerify} onCancel={() => setShowBioModal(false)} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
