import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Megaphone, Plus, Trash2, Edit, X, Save } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const Notices = () => {
  const { role } = useAuth();
  const [msg, setMsg] = useState('');
  const [notices, setNotices] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_role: 'all',
    target_standard: 'All',
    target_board: 'All',
    target_exam: 'All',
    target_batch: 'All'
  });

  const fetchNotices = async () => {
    try {
      const [noticeRes, batchRes, courseRes] = await Promise.all([
        axios.get('http://localhost:5000/api/academic/notices'),
        axios.get('http://localhost:5000/api/batches').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/courses').catch(() => ({ data: [] }))
      ]);
      setNotices(noticeRes.data);
      setBatches(batchRes.data || []);
      setCourses(courseRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotices();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openForm = (notice = null) => {
    if (notice) {
      setEditingNotice(notice.id);
      setFormData({ 
        title: notice.title, 
        content: notice.content, 
        target_role: notice.target_role || 'all', 
        target_standard: notice.target_standard || 'All',
        target_board: notice.target_board || 'All',
        target_exam: notice.target_exam || 'All',
        target_batch: notice.target_batch || 'All'
      });
    } else {
      setEditingNotice(null);
      setFormData({ title: '', content: '', target_role: 'all', target_standard: 'All', target_board: 'All', target_exam: 'All', target_batch: 'All' });
    }
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingNotice(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    
    try {
      if (editingNotice) {
        await axios.put(`http://localhost:5000/api/academic/notices/${editingNotice}`, formData);
        setMsg('✅ Notice successfully edited.');
      } else {
        await axios.post('http://localhost:5000/api/academic/notices', formData);
        setMsg('✅ Notice successfully posted to active system!');
      }
      fetchNotices();
      closeForm();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error saving notice.');
    }
  };

  const handleDeleteClick = (notice) => {
    setDeletingId(notice.id);
    setDeletingName(notice.title);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/academic/notices/${deletingId}`);
      setMsg('✅ Notice deleted from database permanently.');
      setShowDeleteModal(false);
      fetchNotices();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error deleting notice.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Notice Board</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              value={selectedStandard} 
              onChange={(e) => setSelectedStandard(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
            >
              <option value="All">All Standards</option>
              {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={selectedBoard} 
              onChange={(e) => setSelectedBoard(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
            >
              <option value="All">All Boards</option>
              {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select 
              value={selectedExam} 
              onChange={(e) => setSelectedExam(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
            >
              <option value="All">All Exams</option>
              {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
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
            {(role === 'admin' || role === 'faculty') && (
              <button className="btn btn-primary" onClick={() => openForm()} style={{ padding: '0.6rem 1rem' }}>
                <Plus size={18} /> Post Notice
              </button>
            )}
          </div>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {notices
          .filter(n => {
            if (selectedStandard !== 'All' && n.target_standard !== 'All' && n.target_standard !== selectedStandard) return false;
            if (selectedBoard !== 'All' && n.target_board !== 'All' && n.target_board !== selectedBoard) return false;
            if (selectedExam !== 'All' && n.target_exam !== 'All' && n.target_exam !== selectedExam) return false;
            if (selectedBatch !== 'All' && n.target_batch !== 'All' && String(n.target_batch) !== String(selectedBatch)) return false;
            return true;
          })
          .map(notice => (
          <div key={notice.id} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '50%' }}>
              <Megaphone size={24} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              {(role === 'admin' || role === 'faculty') && (
                 <div style={{ position: 'absolute', top: '-0.5rem', right: '-0.5rem', display: 'flex', gap: '0.5rem' }}>
                   <button onClick={() => openForm(notice)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}><Edit size={16}/></button>
                   <button onClick={() => handleDeleteClick(notice)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                 </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingRight: role === 'admin' || role === 'faculty' ? '3rem' : '0' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{notice.title}</h3>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(notice.created_at).toLocaleDateString('en-GB')}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{notice.content}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                 <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#F1F5F9', color: 'var(--text-secondary)' }}>
                   Role: {(notice.target_role || 'all').toUpperCase()}
                 </span>
                 <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#EFF6FF', color: 'var(--primary)' }}>
                   Standard: {notice.target_standard || 'All'}
                 </span>
                 {notice.target_board && notice.target_board !== 'All' && (
                   <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FAF5FF', color: '#7C3AED' }}>
                     Board: {notice.target_board}
                   </span>
                 )}
                 {notice.target_exam && notice.target_exam !== 'All' && (
                   <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FDF2F8', color: '#DB2777' }}>
                     Exam: {notice.target_exam}
                   </span>
                 )}
                 {notice.target_batch && notice.target_batch !== 'All' && (
                   <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#F0FDF4', color: '#166534' }}>
                     Batch: {batches.find(b => String(b.id) === String(notice.target_batch))?.name || 'Target Batch'}
                   </span>
                 )}
              </div>
            </div>
          </div>
        ))}
        {notices.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No notices posted yet.</p>}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>{editingNotice ? 'Edit Notice' : 'Post New Notice'}</h2>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Notice Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Content</label>
                <textarea rows="4" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Target Role</label>
                  <select value={formData.target_role} onChange={e => setFormData({...formData, target_role: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="all">All Roles</option>
                    <option value="student">Students Only</option>
                    <option value="parent">Parents Only</option>
                    <option value="faculty">Faculty Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Target Standard</label>
                  <select value={formData.target_standard} onChange={e => setFormData({...formData, target_standard: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="All">All Standards</option>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Target Board</label>
                  <select value={formData.target_board} onChange={e => setFormData({...formData, target_board: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="All">All Boards</option>
                    {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Target Exam</label>
                  <select value={formData.target_exam} onChange={e => setFormData({...formData, target_exam: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="All">All Exams</option>
                    {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Target Batch</label>
                <select value={formData.target_batch} onChange={e => setFormData({...formData, target_batch: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option value="All">All Batches</option>
                  {batches
                    .filter(b => formData.target_standard === 'All' || b.standard === formData.target_standard)
                    .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={closeForm} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={18} style={{ marginRight: '0.5rem' }} /> {editingNotice ? 'Save Changes' : 'Broadcast Notice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Notice"
        message="Are you sure you want to permanently remove this broadcast from the notice board?"
        itemName={deletingName}
      />
    </div>
  );
};

export default Notices;
