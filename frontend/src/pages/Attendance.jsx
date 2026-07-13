import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, X, Clock, Trash2, Edit, Filter, Plus, AlertCircle } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS } from '../utils/constants';
import BiometricScan from '../components/BiometricScan';

const Attendance = () => {
  const { user, role } = useAuth();
  const [settings, setSettings] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [studentHistory, setStudentHistory] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [activeTab, setActiveTab] = useState('rollcall'); // 'rollcall', 'schedules', 'history'
  const [classSessions, setClassSessions] = useState([]);
  const [selectedClassSession, setSelectedClassSession] = useState('');

  // Toast Notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Scheduling states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleBatch, setScheduleBatch] = useState('');
  const [scheduleSubject, setScheduleSubject] = useState('');
  const [scheduleTopic, setScheduleTopic] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');
  const [scheduleDurationHours, setScheduleDurationHours] = useState(1);
  const [scheduleDurationMinutes, setScheduleDurationMinutes] = useState(0);
  const [scheduleRemarks, setScheduleRemarks] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  const [statusDrafts, setStatusDrafts] = useState({});
  const [editingLog, setEditingLog] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);

  // Auto hide toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const batchRes = await axios.get('http://localhost:5000/api/batches');
      setBatches(batchRes.data || []);

      try {
        const settingsRes = await axios.get('http://localhost:5000/api/settings');
        setSettings(settingsRes.data);
      } catch (err) {
        console.error(err);
      }
      
      if (['super-admin', 'admin', 'faculty'].includes(role)) {
        const standardParam = selectedStandard !== 'All' ? `?standard=${selectedStandard}` : '';
        const statsRes = await axios.get(`http://localhost:5000/api/academic/admin/reports${standardParam}`);
        const loadedStudents = statsRes.data.attendanceReport || [];
        setStudents(loadedStudents);

        // Pre-populate drafts with present
        const drafts = {};
        loadedStudents.forEach(st => {
          drafts[st.student_id] = 'present';
        });
        setStatusDrafts(drafts);

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

  // Fetch Class Sessions when Selected Batch changes
  useEffect(() => {
    const fetchClassSessions = async () => {
      if (selectedBatch) {
        try {
          const res = await axios.get(`http://localhost:5000/api/progress/${selectedBatch}`);
          setClassSessions(res.data || []);
          setSelectedClassSession('');
        } catch (err) {
          console.error('Error fetching class sessions:', err);
        }
      } else {
        setClassSessions([]);
        setSelectedClassSession('');
      }
    };
    fetchClassSessions();
  }, [selectedBatch]);

  // Load subjects when scheduling batch changes
  useEffect(() => {
    if (scheduleBatch) {
      const batch = batches.find(b => String(b.id) === String(scheduleBatch));
      if (batch) {
        axios.get(`http://localhost:5000/api/daily-tracker/subjects?standard=${batch.standard}&board=${batch.board}`)
          .then(res => {
            setSubjects(res.data);
            setScheduleSubject('');
            setScheduleTopic('');
            setTopics([]);
          })
          .catch(console.error);
      }
    } else {
      setSubjects([]);
      setTopics([]);
    }
  }, [scheduleBatch, batches]);

  // Load topics when scheduling subject changes
  useEffect(() => {
    if (scheduleBatch && scheduleSubject) {
      const batch = batches.find(b => String(b.id) === String(scheduleBatch));
      if (batch) {
        axios.get(`http://localhost:5000/api/daily-tracker/topics?standard=${batch.standard}&board=${batch.board}&subject=${scheduleSubject}`)
          .then(res => {
            setTopics(res.data);
            setScheduleTopic('');
          })
          .catch(console.error);
      }
    } else {
      setTopics([]);
    }
  }, [scheduleSubject, scheduleBatch, batches]);

  const handleMarkClassCompleted = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/progress/${id}`, { status: 'Completed' });
      showToast('Class session marked as Completed!', 'success');
      
      // Reload class sessions
      const res = await axios.get(`http://localhost:5000/api/progress/${selectedBatch}`);
      setClassSessions(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to update class session status.', 'error');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleBatch || !scheduleTopic || !scheduleDate) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }

    setSchedulingLoading(true);
    try {
      await axios.post('http://localhost:5000/api/progress/schedule', {
        batch_id: scheduleBatch,
        course_id: scheduleTopic,
        class_date: scheduleDate,
        class_time: scheduleTime,
        duration_hours: scheduleDurationHours,
        duration_minutes: scheduleDurationMinutes,
        remarks: scheduleRemarks
      });

      showToast('Class scheduled successfully!', 'success');
      
      // Reset form
      setScheduleTopic('');
      setScheduleRemarks('');
      
      // Reload schedules if the current batch matches the scheduled batch
      if (String(selectedBatch) === String(scheduleBatch)) {
        const res = await axios.get(`http://localhost:5000/api/progress/${selectedBatch}`);
        setClassSessions(res.data || []);
      }

      setTimeout(() => {
        setShowScheduleModal(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      showToast('Failed to schedule class. Server error.', 'error');
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleDeleteClassSession = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled class session?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/progress/${id}`);
      showToast('Class session deleted successfully.', 'success');
      
      // Reload class sessions
      const res = await axios.get(`http://localhost:5000/api/progress/${selectedBatch}`);
      setClassSessions(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete class session.', 'error');
    }
  };

  const handleSaveAll = async () => {
    if (filteredStudents.length === 0) return;
    if (!selectedClassSession) {
      showToast('Please select a Class Session to submit attendance.', 'warning');
      return;
    }
    const sessionObj = classSessions.find(s => String(s.id) === String(selectedClassSession));
    if (!sessionObj) return;

    try {
      const records = filteredStudents.map(st => ({
        student_id: st.student_id,
        date: sessionObj.class_date || new Date().toISOString().split('T')[0],
        status: statusDrafts[st.student_id] || 'present',
        batch_progress_id: sessionObj.id
      }));
      await axios.post('http://localhost:5000/api/academic/attendance', records);
      showToast(`Daily attendance saved for all ${records.length} students!`, 'success');
      fetchData();
      
      // Refresh class sessions
      const res = await axios.get(`http://localhost:5000/api/progress/${selectedBatch}`);
      setClassSessions(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to save attendance.', 'error');
    }
  };

  const handleBioVerify = async () => {
    try {
      await axios.post('http://localhost:5000/api/academic/attendance', {
        student_id: user.id,
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      });
      showToast('Attendance successfully marked via Biometric Scan!', 'success');
      setShowBioModal(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Permanently remove this attendance log?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/academic/attendance/${id}`);
      showToast('Attendance log removed successfully.', 'success');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const editLog = async (e) => {
    e.preventDefault();
    if (!editStatus) return;
    try {
      await axios.put(`http://localhost:5000/api/academic/attendance/${editingLog.id}`, { status: editStatus });
      showToast('Attendance status updated successfully.', 'success');
      fetchData();
      setEditingLog(null);
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

  const activeStandards = settings?.standards && settings.standards.length > 0 ? settings.standards : STANDARDS;
  const activeBoards = settings?.boards && settings.boards.length > 0 ? settings.boards : BOARDS;
  const activeExams = settings?.exams && settings.exams.length > 0 ? settings.exams : EXAMS;

  if (['super-admin', 'admin', 'faculty'].includes(role)) {
    const activeSession = selectedClassSession ? classSessions.find(s => String(s.id) === String(selectedClassSession)) : null;
    const isCompleted = activeSession && activeSession.status === 'Completed';

    return (
      <div>
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
        `}</style>

        {/* Toast Notification Container */}
        {toast.show && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#F59E0B',
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
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(prev => ({ ...prev, show: false }))} 
              style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: 0, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Top filter row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Attendance Control</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Filter size={16} color="var(--primary)" />
                <select 
                  value={selectedStandard} 
                  onChange={(e) => {
                    setSelectedStandard(e.target.value);
                    setSelectedBatch('');
                  }}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}
                >
                  <option value="All">All Standards</option>
                  {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <select 
               value={selectedBoard} 
               onChange={(e) => {
                 setSelectedBoard(e.target.value);
                 setSelectedBatch('');
               }}
               style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
             >
               <option value="All">All Boards</option>
               {activeBoards.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
             <select 
               value={selectedExam} 
               onChange={(e) => {
                 setSelectedExam(e.target.value);
                 setSelectedBatch('');
               }}
               style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: '#F8FAFC', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
             >
               <option value="All">All Exams</option>
               {activeExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
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
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Custom Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
             <button 
               onClick={() => setActiveTab('rollcall')} 
               style={{ 
                 padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                 backgroundColor: activeTab === 'rollcall' ? 'var(--primary)' : 'transparent',
                 color: activeTab === 'rollcall' ? 'white' : 'var(--text-secondary)',
                 transition: 'all 0.2s'
               }}
             >
               Daily Roll Call
             </button>
             <button 
               onClick={() => setActiveTab('schedules')} 
               style={{ 
                 padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                 backgroundColor: activeTab === 'schedules' ? 'var(--primary)' : 'transparent',
                 color: activeTab === 'schedules' ? 'white' : 'var(--text-secondary)',
                 transition: 'all 0.2s'
               }}
             >
               Class Schedules
             </button>
             <button 
               onClick={() => setActiveTab('history')} 
               style={{ 
                 padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                 backgroundColor: activeTab === 'history' ? 'var(--primary)' : 'transparent',
                 color: activeTab === 'history' ? 'white' : 'var(--text-secondary)',
                 transition: 'all 0.2s'
               }}
             >
               Attendance History
             </button>
          </div>

          {activeTab === 'rollcall' && (
            <>
              {!selectedBatch ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Filter size={48} style={{ margin: '0 auto 1rem', color: '#9CA3AF' }} />
                  <h3>Please select a specific batch from the top filters to mark attendance.</h3>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>Choose Completed Class Session</label>
                    <select
                      value={selectedClassSession}
                      onChange={e => setSelectedClassSession(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC', fontWeight: 500 }}
                    >
                      <option value="">-- Select Scheduled Class Session --</option>
                      {classSessions.map(sess => (
                        <option key={sess.id} value={sess.id}>
                          {sess.Course?.subject} - {sess.Course?.title} ({new Date(sess.class_date).toLocaleDateString('en-GB')} at {sess.class_time}) - [{sess.status}]
                        </option>
                      ))}
                    </select>
                    {classSessions.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 500 }}>
                        No class sessions scheduled for this batch. Go to <strong>Class Schedules</strong> tab to create one.
                      </span>
                    )}
                  </div>

                  {!selectedClassSession ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      <Calendar size={48} style={{ margin: '0 auto 1rem', color: '#9CA3AF' }} />
                      <h3>Please select a class session from the dropdown above to load the roll call roster.</h3>
                    </div>
                  ) : (
                    <>
                      {/* Enforce Completed status restriction */}
                      {!isCompleted ? (
                        <div style={{ padding: '1.25rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid #FDE68A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={20} color="#D97706" />
                            <span style={{ fontWeight: 600 }}>⚠️ Attendance can only be marked and submitted after this class session is Completed.</span>
                          </div>
                          <button 
                            onClick={() => handleMarkClassCompleted(activeSession.id)}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, backgroundColor: '#D97706', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}
                          >
                            Mark Class as Completed
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #A7F3D0' }}>
                          <CheckCircle size={20} color="#059669" />
                          <span style={{ fontWeight: 600 }}>✅ Class Session Completed. Ready to submit attendance. Date: {new Date(activeSession.class_date).toLocaleDateString('en-GB')} at {activeSession.class_time}</span>
                        </div>
                      )}

                      <div style={{ opacity: isCompleted ? 1 : 0.5, pointerEvents: isCompleted ? 'auto' : 'none' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>Marking Roster: {filteredStudents.length} Students</span>
                          {role === 'faculty' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Instructor: {user.name}</span>}
                        </div>
                        <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Student Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Mark Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStudents.map(st => (
                                <tr key={st.student_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '1rem', fontWeight: 600 }}>{st.student_name}</td>
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      {['present', 'absent', 'late'].map(stat => (
                                        <button 
                                          key={stat}
                                          disabled={!isCompleted}
                                          onClick={() => setStatusDrafts({...statusDrafts, [st.student_id]: stat})}
                                          style={{ 
                                            padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: isCompleted ? 'pointer' : 'default',
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
                                </tr>
                              ))}
                              {filteredStudents.length === 0 && (
                                <tr>
                                  <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students enrolled in this batch.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={handleSaveAll} 
                            disabled={!isCompleted || filteredStudents.length === 0}
                            className="btn btn-primary" 
                            style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', opacity: isCompleted ? 1 : 0.5 }}
                          >
                            Save Everyone's Attendance
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'schedules' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Class Schedules List</h2>
                <button 
                  onClick={() => {
                    setScheduleBatch(selectedBatch || '');
                    setShowScheduleModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '8px' }}
                >
                  <Plus size={18} /> Schedule Class
                </button>
              </div>

              {!selectedBatch ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Filter size={48} style={{ margin: '0 auto 1rem', color: '#9CA3AF' }} />
                  <h3>Please select a specific batch from the top filters to view schedules.</h3>
                </div>
              ) : (
                <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Subject</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Topic/Chapter</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Time</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Duration</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classSessions.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No classes scheduled yet. Click <strong>Schedule Class</strong> above to create one.
                          </td>
                        </tr>
                      ) : (
                        classSessions.map(sess => (
                          <tr key={sess.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>{sess.Course?.subject}</td>
                            <td style={{ padding: '1rem', fontWeight: 500 }}>{sess.Course?.title}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(sess.class_date).toLocaleDateString('en-GB')}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{sess.class_time}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                              {sess.duration_hours > 0 ? `${sess.duration_hours}h ` : ''}
                              {sess.duration_minutes > 0 ? `${sess.duration_minutes}m` : ''}
                              {!sess.duration_hours && !sess.duration_minutes ? '1h' : ''}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                padding: '0.35rem 0.75rem', 
                                borderRadius: '999px', 
                                fontSize: '0.725rem', 
                                fontWeight: 700, 
                                backgroundColor: sess.status === 'Completed' ? '#D1FAE5' : sess.status === 'In Progress' ? '#FEF3C7' : '#FEE2E2',
                                color: sess.status === 'Completed' ? '#065F46' : sess.status === 'In Progress' ? '#92400E' : '#991B1B'
                              }}>
                                {sess.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                {sess.status !== 'Completed' && (
                                  <button 
                                    onClick={() => handleMarkClassCompleted(sess.id)} 
                                    style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                    title="Complete Class"
                                  >
                                    Mark Completed
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteClassSession(sess.id)} 
                                  style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Delete Schedule"
                                >
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
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
          )}
        </div>

        {/* Modal overlays */}
        {showScheduleModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
              <div className="modal-header">
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Schedule Class</h2>
                <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleScheduleSubmit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Select Batch *</label>
                    <select 
                      value={scheduleBatch} 
                      onChange={e => setScheduleBatch(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="">-- Select Batch --</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Subject *</label>
                    <select 
                      value={scheduleSubject} 
                      onChange={e => setScheduleSubject(e.target.value)}
                      required
                      disabled={!scheduleBatch}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Topic/Chapter *</label>
                    <select 
                      value={scheduleTopic} 
                      onChange={e => setScheduleTopic(e.target.value)}
                      required
                      disabled={!scheduleSubject}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="">-- Choose Topic/Chapter --</option>
                      {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Class Date *</label>
                      <input 
                        type="date" 
                        value={scheduleDate} 
                        onChange={e => setScheduleDate(e.target.value)} 
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Class Time *</label>
                      <input 
                        type="text" 
                        value={scheduleTime} 
                        onChange={e => setScheduleTime(e.target.value)} 
                        required
                        placeholder="e.g. 10:00 AM"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Duration Hours</label>
                      <input 
                        type="number" 
                        min="0"
                        max="8"
                        value={scheduleDurationHours} 
                        onChange={e => setScheduleDurationHours(parseInt(e.target.value) || 0)} 
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Duration Minutes</label>
                      <input 
                        type="number" 
                        min="0"
                        max="59"
                        value={scheduleDurationMinutes} 
                        onChange={e => setScheduleDurationMinutes(parseInt(e.target.value) || 0)} 
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Remarks/Homework</label>
                    <textarea 
                      value={scheduleRemarks} 
                      onChange={e => setScheduleRemarks(e.target.value)} 
                      rows="2"
                      placeholder="Add class description/remarks..."
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowScheduleModal(false)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={schedulingLoading}>
                    {schedulingLoading ? 'Scheduling...' : 'Schedule Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
      `}</style>

      {/* Toast Notification Container for Student View */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#F59E0B',
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
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
            style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: 0, cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>My Attendance Record</h1>
        <button className="btn btn-primary" onClick={() => setShowBioModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Clock size={18} /> Daily Check-In
        </button>
      </div>

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
