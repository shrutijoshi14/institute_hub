import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, Plus, X, Save, Filter } from 'lucide-react';
import { STANDARDS } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');
  
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '',
    standard: '', parent_name: '', parent_phone: '', address: '', dob: '', blood_group: '',
    batch_id: '', fee_plan: 'EMI', total_installments: 4, token_amount: '',
    username: '', password: '', parent_username: '', parent_password: ''
  });

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/users?role=student');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/batches');
      setBatches(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchBatches();
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

  const openForm = (student = null) => {
    if (student) {
      setEditingStudent(student.id);
      const enrollment = student.Enrollments?.[0] || {};
      setFormData({ 
        name: student.name, email: student.email, phone: student.phone || '',
        standard: student.standard || '', parent_name: student.parent_name || '', 
        parent_phone: student.parent_phone || '', address: student.address || '', 
        dob: student.dob || '', blood_group: student.blood_group || '',
        batch_id: enrollment.batch_id || '',
        fee_plan: enrollment.fee_plan || 'EMI',
        total_installments: enrollment.total_installments || 4,
        token_amount: enrollment.token_amount || ''
      });
    } else {
      setEditingStudent(null);
      setFormData({ 
        name: '', email: '', phone: '', standard: '', parent_name: '', parent_phone: '', address: '', dob: '', blood_group: '',
        batch_id: '', fee_plan: 'EMI', total_installments: 4, token_amount: '',
        username: '', password: '', parent_username: '', parent_password: ''
      });
    }
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    try {
      if (editingStudent) {
        await axios.put(`http://localhost:5000/api/auth/users/${editingStudent}`, formData);
        setMsg(`✅ Student ${formData.name} updated successfully!`);
      } else {
        await axios.post('http://localhost:5000/api/auth/users', { ...formData, role: 'student' });
        setMsg(`✅ Student ${formData.name} added successfully!`);
      }
      fetchStudents();
      closeForm();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error saving student.');
    }
  };

  const handleDeleteClick = (student) => {
    setDeletingId(student.id);
    setDeletingName(student.name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/auth/users/${deletingId}`);
      setMsg('✅ Student deleted permanently.');
      setShowDeleteModal(false);
      fetchStudents();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error deleting student.');
    }
  };

  const filtered = (students || []).filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                         (s.email || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                         (s.phone || '').includes(searchTerm);
    
    const studentStandard = s.standard || s.Enrollments?.[0]?.Course?.class_range || 'N/A';
    const matchesStandard = selectedStandard === 'All' || studentStandard === selectedStandard;
    
    return matchesSearch && matchesStandard;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Student Directory</h1>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={18} /> Add Student
        </button>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{msg}</div>}

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
             <select 
               value={selectedStandard} 
               onChange={(e) => setSelectedStandard(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '160px' }}
             >
               <option value="All">All Standards</option>
               {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Standard</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => (
                <tr key={student.id}>
                  <td>#{student.id}</td>
                  <td style={{ fontWeight: 500 }}>{student.name}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', background: '#F1F5F9', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {student.standard || student.Enrollments?.[0]?.Course?.class_range || 'Unassigned'}
                    </span>
                  </td>
                  <td>{student.email}</td>
                  <td>{student.phone}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" onClick={() => openForm(student)} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', color: 'var(--secondary)' }}><Edit size={16} /></button>
                      <button className="btn" onClick={() => handleDeleteClick(student)} style={{ padding: '0.5rem', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', color: '#EF4444' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No active students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>{editingStudent ? 'Edit Student Details' : 'Add New Student'}</h2>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date of Birth</label>
                  <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Standard/Class</label>
                  <select value={formData.standard} onChange={e => setFormData({...formData, standard: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}>
                    <option value="">Select Standard</option>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Blood Group</label>
                  <input type="text" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="e.g. O+" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Batch & Fee Enrollment</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Assign Batch</label>
                    <select value={formData.batch_id} onChange={e => setFormData({...formData, batch_id: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}>
                      <option value="">Select Batch</option>
                      {batches
                        .filter(b => !formData.standard || b.standard === formData.standard)
                        .map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard} - {b.board})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payment Plan</label>
                    <select value={formData.fee_plan} onChange={e => setFormData({...formData, fee_plan: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}>
                      <option value="One-time">One-time Full Pay</option>
                      <option value="EMI">EMI Installments</option>
                    </select>
                  </div>
                </div>
                {formData.fee_plan === 'EMI' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Total Installments</label>
                      <input type="number" min="1" max="12" value={formData.total_installments} onChange={e => setFormData({...formData, total_installments: parseInt(e.target.value) || 1})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Initial Token Amount (Paid Now)</label>
                      <input type="number" min="0" value={formData.token_amount} onChange={e => setFormData({...formData, token_amount: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="e.g. 5000" />
                    </div>
                  </div>
                )}
                {formData.fee_plan !== 'EMI' && (
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Initial Token Amount (Paid Now)</label>
                    <input type="number" min="0" value={formData.token_amount} onChange={e => setFormData({...formData, token_amount: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="e.g. 10000" />
                  </div>
                )}
              </div>

              {!editingStudent && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Login Credentials (Optional)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Username</label>
                      <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Auto-generated if empty" />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Password</label>
                      <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Default: studentpass123" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Parent Username</label>
                      <input type="text" value={formData.parent_username} onChange={e => setFormData({...formData, parent_username: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Auto-generated if empty" />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Parent Password</label>
                      <input type="text" value={formData.parent_password} onChange={e => setFormData({...formData, parent_password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Auto-generated if empty" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Parent Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Parent/Guardian Name</label>
                    <input type="text" value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Parent Phone</label>
                    <input type="text" value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Address</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows="3" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}></textarea>
              </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn" onClick={closeForm} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={18} style={{ marginRight: '0.5rem' }} /> Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Remove Student"
        message="Are you sure you want to permanently delete this student's account? All their data, including fees and results, will be lost."
        itemName={deletingName}
      />
    </div>
  );
};

export default StudentManagement;
