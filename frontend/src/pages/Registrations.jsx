import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Trash2, Plus, XCircle, UserCheck, UserX, Search, Filter } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS, BOARDS_BY_STANDARD } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const Registrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [msg, setMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    class: '5th',
    board: 'State Board',
    course_interest: 'None',
    password: 'studentpass123',
    fee_plan: 'One-time',
    total_installments: 4,
    token_amount: 0,
    username: '',
    parent_username: '',
    parent_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const fetchRegs = async () => {
    try {
      const [regRes, courseRes, settingsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/registration'),
        axios.get('http://localhost:5000/api/courses').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/settings').catch(() => ({ data: null }))
      ]);
      setRegistrations(regRes.data);
      setCourses(courseRes.data);
      setSettings(settingsRes.data);
      if (courseRes.data.length > 0) {
          setFormData(prev => ({ ...prev, course_interest: courseRes.data[0].title }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegs();
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

  useEffect(() => {
    const filtered = courses.filter(c => c.class_range === formData.class && c.board === formData.board);
    if (filtered.length > 0) {
      // If current interest is not in filtered list, pick the first one
      if (!filtered.some(f => f.title === formData.course_interest)) {
        setFormData(prev => ({ ...prev, course_interest: filtered[0].title }));
      }
    } else {
      setFormData(prev => ({ ...prev, course_interest: 'None' }));
    }
  }, [formData.class, formData.board, courses]);

  const handleUpdate = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/registration/${id}`, { status: newStatus });
      fetchRegs(); // refresh
    } catch (err) {
      console.error(err);
    }
  };

  const submitApplication = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          await axios.post('http://localhost:5000/api/registration', formData);
          setMsg(`✅ Registration Successful. Student Account and Fees Auto-Generated.`);
          setShowModal(false);
          // Set form to initial state completely
          setFormData({
            name: '',
            email: '',
            phone: '',
            class: '5th',
            board: 'State Board',
            course_interest: 'None',
            password: 'studentpass123',
            fee_plan: 'One-time',
            total_installments: 4,
            token_amount: 0,
            username: '',
            parent_username: '',
            parent_password: ''
          });
          await fetchRegs(); // Wait for fetch before completing
          setTimeout(() => setMsg(''), 4000);
      } catch (err) {
          console.error(err);
          setMsg(`❌ Error: ` + (err.response?.data?.msg || 'Could not register student.'));
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Registrations Queue</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Application
        </button>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
             <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
             <select 
               value={selectedStandard} 
               onChange={(e) => setSelectedStandard(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Standards</option>
               {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             
             <select 
               value={selectedBoard} 
               onChange={(e) => setSelectedBoard(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Boards</option>
               {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
             </select>

             <select 
               value={selectedExam} 
               onChange={(e) => setSelectedExam(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Exams</option>
               {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
             </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Applicant</th>
                <th style={{ whiteSpace: 'nowrap' }}>Std / Interest</th>
                <th style={{ whiteSpace: 'nowrap' }}>Board / Stream</th>
                <th style={{ whiteSpace: 'nowrap' }}>Applied On</th>
                <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations
                .filter(reg => {
                  const matchesSearch = (reg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       (reg.phone || '').includes(searchTerm) || 
                                       (reg.email || '').toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStandard = selectedStandard === 'All' || reg.class === selectedStandard;
                  const matchesBoard = selectedBoard === 'All' || reg.board === selectedBoard;
                  
                  let matchesExam = true;
                  if (selectedExam !== 'All') {
                    const course = courses.find(c => c.title === reg.course_interest);
                    matchesExam = course ? course.exam_target === selectedExam : false;
                  }
                  
                  return matchesSearch && matchesStandard && matchesBoard && matchesExam;
                })
                .map(reg => (
                <tr key={reg.id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {reg.name}
                    <br/>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{reg.phone}</span>
                  </td>
                  <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 600 }}>{reg.class}</span>
                    <br/>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{reg.course_interest}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 500 }}>{reg.board}</span>
                  </td>
                  <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '0.3rem 0.85rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
                      background: reg.status === 'approved' ? '#D1FAE5' : reg.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                      color: reg.status === 'approved' ? '#065F46' : reg.status === 'rejected' ? '#991B1B' : '#92400E'
                    }}>
                      {reg.status === 'approved' ? '✓ Approved' : reg.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {reg.status === 'pending' ? (
                        <>
                          <button
                            title="Approve"
                            onClick={() => handleUpdate(reg.id, 'approved')}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 600,
                              borderRadius: '8px', border: 'none', cursor: 'pointer',
                              background: '#10B981', color: 'white'
                            }}
                          >
                            <UserCheck size={13}/> Approve
                          </button>
                          <button
                            title="Reject"
                            onClick={() => handleUpdate(reg.id, 'rejected')}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 600,
                              borderRadius: '8px', border: 'none', cursor: 'pointer',
                              background: '#EF4444', color: 'white'
                            }}
                          >
                            <UserX size={13}/> Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Processed</span>
                      )}
                      <button
                        title="Delete"
                        onClick={() => { setDeletingId(reg.id); setDeletingName(reg.name); setShowDeleteModal(true); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '0.35rem 0.5rem', fontSize: '0.75rem',
                          borderRadius: '8px', border: '1px solid #FCA5A5', cursor: 'pointer',
                          background: '#FFF1F2', color: '#EF4444'
                        }}
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Register New Application</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={submitApplication}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Full Name</label>
                   <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                 </div>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Student Email</label>
                   <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone (Parent/Student)</label>
                   <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                </div>
                <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Default Password</label>
                   <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Custom Student Username (Optional)</label>
                   <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Auto-generated if empty" />
                </div>
                <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Custom Parent Username (Optional)</label>
                   <input type="text" value={formData.parent_username} onChange={e => setFormData({...formData, parent_username: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Auto-generated if empty" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Custom Parent Password (Optional)</label>
                   <input type="text" value={formData.parent_password} onChange={e => setFormData({...formData, parent_password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Auto-generated if empty" />
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Standard / Class</label>
                  <select 
                    value={formData.class} 
                    onChange={e => {
                      const newClass = e.target.value;
                      const availableBoards = BOARDS_BY_STANDARD[newClass] || [];
                      setFormData({
                        ...formData, 
                        class: newClass,
                        board: availableBoards.length > 0 ? availableBoards[0] : ''
                      });
                    }} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}
                  >
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Board / Stream</label>
                  <select 
                    value={formData.board} 
                    onChange={e => setFormData({...formData, board: e.target.value})} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}
                  >
                    {(BOARDS_BY_STANDARD[formData.class] || []).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const filteredCourses = courses.filter(c => c.class_range === formData.class && c.board === formData.board);
                if (filteredCourses.length === 0) return null;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Course Interest</label>
                      <select 
                        value={formData.course_interest} 
                        onChange={e => setFormData({...formData, course_interest: e.target.value})} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}
                      >
                        {filteredCourses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#0369A1' }}>Payment Plan</label>
                  <select value={formData.fee_plan} onChange={e => setFormData({...formData, fee_plan: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #7DD3FC', outline: 'none', backgroundColor: 'white' }}>
                    <option value="One-time">One-time Full Payment</option>
                    <option value="EMI">EMI / Installments</option>
                  </select>
                </div>
                {formData.fee_plan === 'EMI' && (
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#0369A1' }}>Number of Installments</label>
                    <select value={formData.total_installments} onChange={e => setFormData({...formData, total_installments: parseInt(e.target.value) || 4})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #7DD3FC', outline: 'none', backgroundColor: 'white' }}>
                      <option value="2">2 Installments</option>
                      <option value="3">3 Installments</option>
                      <option value="4">4 Installments</option>
                      <option value="6">6 Installments</option>
                      <option value="12">12 Installments</option>
                    </select>
                  </div>
                )}
                <div style={{ gridColumn: 'span 2', fontSize: '0.875rem', color: '#0369A1', fontWeight: 600, marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E0F2FE', paddingTop: '0.5rem' }}>
                  <span>Standard Tuition Fee:</span>
                  <span>₹{(settings?.standardFees?.[formData.class] || 50000).toLocaleString()}</span>
                </div>
              </div>

              <div className="form-group" style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#166534' }}>Token Amount (Registration Fee)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#166534', fontWeight: 700 }}>₹</span>
                  <input type="number" value={formData.token_amount} onChange={e => setFormData({...formData, token_amount: e.target.value})} style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2rem', borderRadius: '4px', border: '1px solid #86EFAC', outline: 'none' }} placeholder="0.00" />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem' }}>* This amount will be recorded as the first payment.</p>
              </div>
              
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                * Saving this application automatically triggers course allocation and fee assignments.
              </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          try {
            await axios.delete(`http://localhost:5000/api/registration/${deletingId}`);
            setShowDeleteModal(false);
            fetchRegs();
          } catch (err) { console.error(err); }
        }}
        title="Delete Registration"
        message="Are you sure you want to remove this registration application? This will not affect existing user accounts if already approved."
        itemName={deletingName}
      />
    </div>
  );
};

export default Registrations;
