import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Award, Plus, Trash2, Edit, Save, Filter, X } from 'lucide-react';
import DeleteModal from '../components/DeleteModal';
import { STANDARDS } from '../utils/constants';

const Results = () => {
  const { user, role } = useAuth();
  const [msg, setMsg] = useState('');
  const [settings, setSettings] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [studentResults, setStudentResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState({});
  const [editingResult, setEditingResult] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

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

  const activeStandards = settings?.standards && settings.standards.length > 0 ? settings.standards : STANDARDS;

  const fetchData = async () => {
    try {
      if (role === 'admin' || role === 'faculty') {
        const batchRes = await axios.get('http://localhost:5000/api/batches');
        setBatches(batchRes.data || []);
        
        const standardParam = selectedStandard !== 'All' ? `?standard=${selectedStandard}` : '';
        const statsRes = await axios.get(`http://localhost:5000/api/academic/admin/reports${standardParam}`);
        setStudents(statsRes.data.performanceReport || []);
        const historyRes = await axios.get(`http://localhost:5000/api/academic/admin/history/results${standardParam}`);
        setHistory(historyRes.data || []);
      } else {
        const studentId = role === 'parent' ? user.childId : user.id;
        if (studentId) {
          const res = await axios.get(`http://localhost:5000/api/academic/results/${studentId}`);
          setStudentResults(res.data || []);
        } else {
          setStudentResults([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role, user.id, user.childId, selectedStandard]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEditingResult(null);
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDraftChange = (studentId, field, value) => {
    setGradeDrafts(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handlePublish = async (studentId) => {
    const draft = gradeDrafts[studentId];
    if (!draft || !draft.subject || !draft.marks_obtained) {
       setMsg('⚠️ Subject and Marks are required!');
       setTimeout(() => setMsg(''), 3000);
       return;
    }
    try {
      await axios.post('http://localhost:5000/api/academic/results', {
        student_id: studentId,
        subject: draft.subject,
        marks_obtained: draft.marks_obtained,
        total_marks: draft.total_marks || 100,
        exam_date: new Date().toISOString().split('T')[0]
      });
      setMsg(`✅ Result published for ${draft.subject}!`);
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  const handleDeleteClick = (result) => {
    setDeletingId(result.id);
    setDeletingName(`${result.student_name} - ${result.subject}`);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/academic/results/${deletingId}`);
      setMsg('✅ Result record deleted.');
      setShowDeleteModal(false);
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  const editResult = async (e) => {
    e.preventDefault();
    if (!editMarks) return;
    try {
      await axios.put(`http://localhost:5000/api/academic/results/${editingResult.id}`, { marks_obtained: editMarks });
      setMsg('✅ Marks updated successfully!');
      fetchData();
      setEditingResult(null);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  const filteredStudents = selectedBatch 
    ? students.filter(st => String(st.batch_id) === String(selectedBatch)) 
    : students;

  if (role === 'admin' || role === 'faculty') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
             <h1 className="page-title" style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Student Evaluation</h1>
             {role === 'faculty' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Instructor View: {user.name}</span>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Filter size={16} color="var(--primary)" />
                <select 
                  value={selectedStandard} 
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}
                >
                  <option value="All">All Standards</option>
                  {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
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
               {showHistory ? 'Back to Entry' : 'Evaluation History'}
             </button>
          </div>
        </div>
        
        {msg && <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}
 
        <div className="card">
          {showHistory ? (
            <>
              <h2>Historical Results Log</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Student</th><th>Subject</th><th>Score</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {history.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                        <td>{r.subject}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.marks_obtained}/{r.total_marks}</td>
                        <td>{new Date(r.exam_date).toLocaleDateString('en-GB')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => { setEditingResult(r); setEditMarks(r.marks_obtained); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit Marks"><Edit size={12}/></button>
                            <button onClick={() => handleDeleteClick(r)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete Record"><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No results found in database.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <h2>New Evaluation Entry</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Student Name</th><th>Subject/Topic</th><th>Marks</th><th>Total</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(st => (
                      <tr key={st.student_id}>
                        <td style={{ fontWeight: 600 }}>{st.student_name}</td>
                        <td><input type="text" placeholder="e.g. Unit Test 1" onChange={(e) => handleDraftChange(st.student_id, 'subject', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', width: '150px', outline: 'none' }}/></td>
                        <td><input type="number" placeholder="0" onChange={(e) => handleDraftChange(st.student_id, 'marks_obtained', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', width: '80px', outline: 'none' }}/></td>
                        <td><input type="number" defaultValue="100" onChange={(e) => handleDraftChange(st.student_id, 'total_marks', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', width: '80px', outline: 'none' }}/></td>
                        <td><button onClick={() => handlePublish(st.student_id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '6px' }}><Save size={14} style={{ marginRight: '0.25rem' }}/> Publish</button></td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No students found in this batch.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {editingResult && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2 style={{ margin: 0 }}>Edit Marks</h2>
                <button onClick={() => setEditingResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>
              <form onSubmit={editResult}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Student: <strong>{editingResult.student_name}</strong><br/>Subject: <strong>{editingResult.subject}</strong></p>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Marks Obtained</label>
                    <input type="number" value={editMarks} onChange={e => setEditMarks(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setEditingResult(null)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><Save size={18} style={{ marginRight: '0.5rem' }} /> Update Result</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DeleteModal 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Result"
          message="Are you sure you want to permanently remove this evaluation record? This will be removed from the student's report card."
          itemName={deletingName}
        />
      </div>
    );
  }

  // Student View (Isolated)
  return (
    <div>
      <h1 className="page-title">Personal Report Card</h1>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Award size={32} color="var(--primary)" />
          <div>
            <h2 style={{ margin: 0 }}>Exam Performance</h2>
            <span style={{ color: 'var(--text-secondary)' }}>Viewing results for {user.name} (Access Restricted)</span>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Subject</th><th>Score</th><th>Grade</th><th>Date</th></tr>
            </thead>
            <tbody>
              {studentResults.length > 0 ? studentResults.map(r => {
                const perc = (r.marks_obtained / r.total_marks) * 100;
                const grade = perc > 90 ? 'A+' : perc > 80 ? 'A' : perc > 70 ? 'B' : 'C';
                return (
                  <tr key={r.id}>
                    <td>{r.subject}</td>
                    <td>{r.marks_obtained}/{r.total_marks}</td>
                    <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>{grade}</td>
                    <td>{new Date(r.exam_date).toLocaleDateString('en-GB')}</td>
                  </tr>
                )
              }) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>No results available (Not taken test / assignment).</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Results;
