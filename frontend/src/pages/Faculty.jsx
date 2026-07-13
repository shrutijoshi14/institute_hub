import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, X, Save, Filter, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const Faculty = () => {
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
  const [settings, setSettings] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    experience: '',
    subject_expertise: ''
  });
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const fetchFaculty = async () => {
    try {
      const [facRes, coursesRes, batchesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/faculty'),
        axios.get('http://localhost:5000/api/courses'),
        axios.get('http://localhost:5000/api/batches')
      ]);
      setTeachers(facRes.data);
      setCourses(coursesRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFaculty();
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

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const openForm = (teacher = null) => {
    if (teacher) {
      setEditingFaculty(teacher.id);
      setFormData({ 
        name: teacher.name, 
        qualification: teacher.qualification, 
        experience: teacher.experience, 
        subject_expertise: teacher.subject_expertise || ''
      });
    } else {
      setEditingFaculty(null);
      setFormData({ name: '', qualification: '', experience: '', subject_expertise: '' });
    }
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingFaculty(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.qualification) return;
    const isEditing = !!editingFaculty;
    const data = { ...formData };
    closeForm(); // Closes modal immediately
    showToast(isEditing ? 'Updating faculty...' : 'Creating faculty...', 'info');

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/faculty/${editingFaculty}`, data);
        showToast('Faculty details updated successfully!', 'success');
      } else {
        const res = await axios.post('http://localhost:5000/api/faculty', data);
        const { username, tempPassword } = res.data;
        setCreatedCredentials({
            name: data.name,
            username: username,
            password: tempPassword
        });
        showToast('Faculty member added successfully!', 'success');
      }
      fetchFaculty();
    } catch (err) {
      console.error(err);
      showToast('Error saving faculty details.', 'error');
    }
  };

  const handleDeleteClick = (teacher) => {
    setDeletingId(teacher.id);
    setDeletingName(teacher.name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false); // Closes modal immediately
    showToast('Deleting faculty...', 'info');
    try {
      await axios.delete(`http://localhost:5000/api/faculty/${deletingId}`);
      showToast('Faculty deleted successfully.', 'success');
      fetchFaculty();
    } catch (err) {
      console.error(err);
      showToast('Error deleting faculty.', 'error');
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const hasBatches = t.Batches && t.Batches.length > 0;
    
    if (selectedStandard !== 'All') {
      if (!hasBatches) return false;
      const matchesStandard = t.Batches.some(b => b.standard === selectedStandard);
      if (!matchesStandard) return false;
    }
    
    if (selectedBoard !== 'All') {
      if (!hasBatches) return false;
      const matchesBoard = t.Batches.some(b => b.board === selectedBoard);
      if (!matchesBoard) return false;
    }
    
    if (selectedExam !== 'All') {
      if (!hasBatches) return false;
      const matchesExam = t.Batches.some(b => {
        return courses.some(c => 
          c.class_range === b.standard && 
          c.board === b.board && 
          c.exam_target === selectedExam
        );
      });
      if (!matchesExam) return false;
    }
    
    if (selectedBatch !== 'All') {
      if (!hasBatches) return false;
      const matchesBatch = t.Batches.some(b => String(b.id) === String(selectedBatch));
      if (!matchesBatch) return false;
    }
    
    return true;
  });

  const activeStandards = settings?.standards && settings.standards.length > 0 ? settings.standards : STANDARDS;
  const activeBoards = settings?.boards && settings.boards.length > 0 ? settings.boards : BOARDS;
  const activeExams = settings?.exams && settings.exams.length > 0 ? settings.exams : EXAMS;

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
            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
            style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: 0, cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Faculty Management</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={selectedStandard} 
            onChange={(e) => setSelectedStandard(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
          >
            <option value="All">All Standards</option>
            {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select 
            value={selectedBoard} 
            onChange={(e) => setSelectedBoard(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
          >
            <option value="All">All Boards</option>
            {activeBoards.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select 
            value={selectedExam} 
            onChange={(e) => setSelectedExam(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
          >
            <option value="All">All Exams</option>
            {activeExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
          <select 
            value={selectedBatch} 
            onChange={(e) => setSelectedBatch(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
          >
            <option value="All">All Batches</option>
            {batches
              .filter(b => selectedStandard === 'All' || b.standard === selectedStandard)
              .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => openForm()}>
            <Plus size={18} /> Add Faculty
          </button>
        </div>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{msg}</div>}

      <div className="grid-cols-4">
        {filteredTeachers.map(t => (
          <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
             <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                <button onClick={() => openForm(t)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}><Edit size={14}/></button>
                <button onClick={() => handleDeleteClick(t)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14}/></button>
             </div>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>
               {(t.name || 'F').charAt(0)}
             </div>
             <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{t.name}</h3>
             <span style={{ fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 500, marginBottom: '0.25rem' }}>{t.subject_expertise}</span>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
               {t.Batches && t.Batches.length > 0 ? (
                 t.Batches.map(b => (
                   <span key={b.id} style={{ fontSize: '0.75rem', color: '#1E40AF', background: '#EFF6FF', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                     {b.name}
                   </span>
                 ))
               ) : (
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: '#F1F5F9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>No batches assigned</span>
               )}
             </div>
             
             <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
               <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                 <strong>Qual:</strong> {t.qualification}
               </div>
               <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                 <strong>Exp:</strong> {t.experience}
               </div>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>{editingFaculty ? 'Edit Faculty Details' : 'Add New Faculty Member'}</h2>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Qualification (e.g. MSc, PhD)</label>
                <input type="text" value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Experience Level</label>
                <input type="text" value={formData.experience} placeholder="e.g. 5 Years" onChange={e => setFormData({...formData, experience: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subject Expertise</label>
                <input type="text" value={formData.subject_expertise} placeholder="e.g. Mathematics, Physics" onChange={e => setFormData({...formData, subject_expertise: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>
              
              </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={closeForm} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><Save size={18} style={{ marginRight: '0.5rem' }} /> {editingFaculty ? 'Save Changes' : 'Create Profile'}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Remove Faculty Member"
        message="Are you sure you want to permanently delete this faculty profile? This will also disable their login access."
        itemName={deletingName}
      />

      {createdCredentials && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '520px',
            color: '#1E293B',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={28} color="#10B981" /> Account Credentials Generated
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Below are the system-generated login credentials for the new account. 
              <strong style={{ color: '#EF4444', display: 'block', marginTop: '0.5rem' }}>
                ⚠️ WARNING: This is the ONLY time these temporary passwords will be displayed. Copy or print them now; they cannot be retrieved later.
              </strong>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty Login</span>
                <div style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}><strong>Username:</strong> <code style={{ backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>{createdCredentials.username}</code></div>
                <div style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}><strong>Password:</strong> {createdCredentials.password ? (
                  <code style={{ backgroundColor: '#F1F5F9', color: '#0F172A', padding: '2px 6px', borderRadius: '4px', border: '1px dashed #CBD5E1' }}>{createdCredentials.password}</code>
                ) : (
                  <span style={{ color: '#EF4444', fontStyle: 'italic', fontWeight: 500 }}>Disabled by Portal Access Rules (Profile Only Created)</span>
                )}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  const text = `FACULTY CREDENTIALS\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  alert('Credentials copied to clipboard!');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: 'white',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                    <head><title>Credentials Print</title></head>
                    <body style="font-family: sans-serif; padding: 40px;">
                      <h2>Account Credentials</h2>
                      <hr />
                      <h3>Faculty Account</h3>
                      <p><strong>Username:</strong> ${createdCredentials.username}</p>
                      <p><strong>Password:</strong> ${createdCredentials.password}</p>
                      <script>window.print();</script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#1E293B',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculty;
