import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Plus, Edit, Trash2, X, UserPlus, CheckCircle, Save, Loader2, QrCode, Share2, Copy, Check, AlertCircle, Info } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { STANDARDS, BOARDS, EXAMS, STATUSES, BOARDS_BY_STANDARD, EXAMS_BY_STANDARD } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [convertError, setConvertError] = useState('');
  const [formError, setFormError] = useState('');
  const [settings, setSettings] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [convertingEnq, setConvertingEnq] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');

  const activeStandards = settings?.standards && settings.standards.length > 0 ? settings.standards : STANDARDS;
  const activeBoards = settings?.boards && settings.boards.length > 0 ? settings.boards : BOARDS;
  const activeExams = settings?.exams && settings.exams.length > 0 ? settings.exams : EXAMS;
  const activeBoardsByStandard = settings?.boardsByStandard && Object.keys(settings.boardsByStandard).length > 0 ? settings.boardsByStandard : BOARDS_BY_STANDARD;
  const activeExamsByStandard = settings?.examsByStandard && Object.keys(settings.examsByStandard).length > 0 ? settings.examsByStandard : EXAMS_BY_STANDARD;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    class_range: '5th',
    board: 'State Board',
    exam_target: 'None',
    status: 'New',
    message: '',
    lost_reason: ''
  });

  const [convertData, setConvertData] = useState({
    password: 'student123',
    batch_id: '',
    fee_plan: 'One-time',
    installments: 1,
    token_amount: 0,
    parent_name: '',
    parent_phone: '',
    address: '',
    dob: '',
    blood_group: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enqRes, batchRes, courseRes, settingsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/enquiry').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/batches').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/courses').catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/settings').catch(() => ({ data: null }))
      ]);
      setEnquiries(enqRes.data);
      setBatches(batchRes.data);
      setCourses(courseRes.data);
      setSettings(settingsRes.data);
      if (batchRes.data.length > 0) {
        setConvertData(prev => ({ ...prev, batch_id: batchRes.data[0].id }));
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const currentStd = convertData.standard || (convertingEnq ? convertingEnq.class_range : '');
    const currentBoard = convertData.board || (convertingEnq ? convertingEnq.board : '');
    let fees = 50000;

    if (settings && settings.standardFees && settings.standardFees[currentStd] !== undefined) {
      fees = parseFloat(settings.standardFees[currentStd]) || 50000;
    } else if (currentStd && currentBoard) {
      const matchedCourse = courses.find(c => 
        String(c.class_range).toLowerCase() === String(currentStd).toLowerCase() && 
        String(c.board).toLowerCase() === String(currentBoard).toLowerCase()
      );
      if (matchedCourse) {
        fees = parseFloat(matchedCourse.fees) || 50000;
      }
    }

    if (convertData.fee_plan === 'One-time') {
      setConvertData(prev => ({ ...prev, token_amount: fees, installments: 1 }));
    } else {
      const instCount = parseInt(convertData.installments) || 4;
      setConvertData(prev => ({ ...prev, token_amount: (fees / instCount).toFixed(2), installments: instCount }));
    }
  }, [convertData.standard, convertData.board, convertData.fee_plan, convertData.installments, courses, convertingEnq, settings]);

  const openForm = (enq = null) => {
    if (enq) {
      setEditingId(enq.id);
      setFormData({
        name: enq.name,
        email: enq.email || '',
        phone: enq.phone,
        class_range: enq.class_range || '9th',
        board: enq.board || 'State Board',
        exam_target: enq.exam_target || 'None',
        status: enq.status || 'New',
        message: enq.message || '',
        lost_reason: enq.lost_reason || ''
      });
    } else {
      setEditingId(null);
      const defaultStd = activeStandards[0] || '9th';
      const defaultBoard = (activeBoardsByStandard[defaultStd] || [])[0] || 'State Board';
      const defaultExam = (activeExamsByStandard[defaultStd] || [])[0] || 'None';
      setFormData({ name: '', email: '', phone: '', class_range: defaultStd, board: defaultBoard, exam_target: defaultExam, status: 'New', message: '' });
    }
    setFormError('');
    setShowModal(true);
  };

  const openConvertModal = (enq) => {
    setConvertingEnq(enq);
    const initialStd = enq.class_range || activeStandards[0] || '9th';
    const initialBoard = enq.board || (activeBoardsByStandard[initialStd] || [])[0] || 'State Board';
    const filtered = batches.filter(b => b.standard === initialStd && b.board === initialBoard);
    setConvertData(prev => ({
      ...prev,
      standard: initialStd,
      board: initialBoard,
      batch_id: filtered.length > 0 ? filtered[0].id : '',
      parent_name: enq.parent_name || '',
      parent_phone: enq.parent_phone || enq.phone || '',
      address: enq.address || '',
      dob: enq.dob || '',
      blood_group: enq.blood_group || ''
    }));
    setConvertError('');
    setShowConvertModal(true);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowConvertModal(false);
        setShowDeleteModal(false);
        setShowQrModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const isEditing = !!editingId;
    const data = { ...formData };
    setShowModal(false); // Close modal immediately!
    showToast(isEditing ? 'Updating enquiry...' : 'Saving new enquiry...', 'info');
    setIsSaving(true);
    setFormError('');
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/enquiry/${editingId}`, data);
      } else {
        await axios.post('http://localhost:5000/api/enquiry', data);
      }
      showToast('Enquiry successfully saved.', 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(`Error saving enquiry: ${err.response?.data?.msg || err.message || 'Server Error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!convertData.batch_id) {
      showToast('Please select a batch to enroll the student.', 'error');
      return;
    }
    const data = { ...convertData };
    const name = convertingEnq.name;
    setShowConvertModal(false); // Close modal immediately!
    showToast(`Converting ${name} to registered student...`, 'info');
    setIsConverting(true);
    setConvertError('');
    try {
      await axios.post(`http://localhost:5000/api/enquiry/convert/${convertingEnq.id}`, data);
      showToast(`${name} has been enrolled as a student!`, 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(`Conversion failed: ${err.response?.data?.msg || err.message || 'Server Error'}`, 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteClick = (enq) => {
    setDeletingId(enq.id);
    setDeletingName(enq.name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
     setShowDeleteModal(false); // Close modal immediately!
     showToast('Deleting enquiry...', 'info');
     try {
       await axios.delete(`http://localhost:5000/api/enquiry/${deletingId}`);
       showToast('Enquiry deleted successfully.', 'success');
       fetchData();
     } catch (err) {
       console.error(err);
       showToast('Error deleting enquiry.', 'error');
     }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return '#3B82F6';
      case 'Contacted': return '#F59E0B';
      case 'Converted': return '#10B981';
      case 'Lost': return '#EF4444';
      default: return '#64748B';
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <Filter size={12} style={{ marginLeft: '0.25rem', opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '0.25rem' }}>↑</span> : <span style={{ marginLeft: '0.25rem' }}>↓</span>;
  };

  const filteredEnquiries = enquiries
    .filter(enq => {
      const matchesSearch = enq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            enq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            enq.phone.includes(searchTerm);
      const matchesStandard = selectedStandard === 'All' || enq.class_range === selectedStandard;
      const matchesBoard = selectedBoard === 'All' || enq.board === selectedBoard;
      const matchesExam = selectedExam === 'All' || enq.exam_target === selectedExam;
      return matchesSearch && matchesStandard && matchesBoard && matchesExam;
    })
    .sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

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
            type="button"
            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
            style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: 0, cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Enquiries Management</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn" onClick={() => setShowQrModal(true)} style={{ border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
            <QrCode size={18} /> Share Form
          </button>
          <button className="btn btn-primary" onClick={() => openForm()}>
            <Plus size={18} /> New Enquiry
          </button>
        </div>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}
      
      {/* Search and Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', backgroundColor: 'var(--primary)', color: 'white' }}>
           <div>
             <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Conversion Rate</div>
             <div style={{ fontSize: '1.875rem', fontWeight: 700 }}>
               {enquiries.length > 0 ? ((enquiries.filter(e => e.status === 'Converted').length / enquiries.length) * 100).toFixed(0) : 0}%
             </div>
           </div>
           <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: 'white', width: `${enquiries.length > 0 ? (enquiries.filter(e => e.status === 'Converted').length / enquiries.length) * 100 : 0}%` }}></div>
           </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
           <div className="card" style={{ textAlign: 'center' }}>
             <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Enquiries</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{enquiries.length}</div>
           </div>
           <div className="card" style={{ textAlign: 'center' }}>
             <div style={{ color: '#10B981', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Converted</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{enquiries.filter(e => e.status === 'Converted').length}</div>
           </div>
           <div className="card" style={{ textAlign: 'center' }}>
             <div style={{ color: '#F59E0B', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Pending</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{enquiries.filter(e => e.status !== 'Converted').length}</div>
           </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search enquiries by name, email or phone..." 
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
               {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             
             <select 
               value={selectedBoard} 
               onChange={(e) => setSelectedBoard(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Boards</option>
               {activeBoards.map(b => <option key={b} value={b}>{b}</option>)}
             </select>

             <select 
               value={selectedExam} 
               onChange={(e) => setSelectedExam(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Exams</option>
               {activeExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
             </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Applicant <SortIcon column="name" /></th>
                <th onClick={() => handleSort('class_range')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Class / Board <SortIcon column="class_range" /></th>
                <th onClick={() => handleSort('exam_target')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Target Exam <SortIcon column="exam_target" /></th>
                <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Date <SortIcon column="created_at" /></th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Status <SortIcon column="status" /></th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading enquiries...</td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No enquiries found.</td>
                </tr>
              ) : (
                filteredEnquiries.map(enq => (
                   <tr key={enq.id}>
                    <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {enq.name}<br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{enq.phone} | <span className="email-wrap">{enq.email || 'No Email'}</span></span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 500 }}>{enq.class_range}</span><br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{enq.board}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{enq.exam_target !== 'None' ? <span style={{ padding: '0.1rem 0.5rem', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{enq.exam_target}</span> : <span style={{color: 'var(--text-secondary)'}}>General</span>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: `${getStatusColor(enq.status)}20`, color: getStatusColor(enq.status) }}>
                        {enq.status}
                      </span>
                    </td>
                     <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                         {enq.status !== 'Converted' && (
                           <button className="btn" title="Convert to Student" onClick={() => openConvertModal(enq)} style={{ border: 'none', background: '#DCFCE7', color: '#166534', padding: '0.4rem' }}><UserPlus size={16}/></button>
                         )}
                         <button className="btn" title="Edit" onClick={() => openForm(enq)} style={{ border: 'none', background: 'transparent', color: 'var(--secondary)', padding: '0.4rem' }}><Edit size={16}/></button>
                         <button className="btn" title="Delete" onClick={() => handleDeleteClick(enq)} style={{ border: 'none', background: 'transparent', color: '#EF4444', padding: '0.4rem' }}><Trash2 size={16}/></button>
                      </div>
                    </td>
                   </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showConvertModal && convertingEnq && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleConvert} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
               <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Enrolment Process</h2>
               <button type="button" onClick={() => setShowConvertModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You are about to convert <strong>{convertingEnq.name}</strong> into an active student. Please assign a secure password and select their primary course.</p>
            
            {convertError && <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: '8px', fontWeight: 500, fontSize: '0.875rem', border: '1px solid #FCA5A5' }}>⚠️ {convertError}</div>}
               <div className="form-group">
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Initial Login Password</label>
                 <input type="text" value={convertData.password} onChange={e => setConvertData({...convertData, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} required />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Standard / Class</label>
                    <select 
                      value={convertData.standard} 
                      onChange={e => {
                        const newStd = e.target.value;
                        const boards = activeBoardsByStandard[newStd] || [];
                        const firstBoard = boards.length > 0 ? boards[0] : '';
                        const filtered = batches.filter(b => b.standard === newStd && b.board === firstBoard);
                        setConvertData({
                          ...convertData, 
                          standard: newStd,
                          board: firstBoard,
                          batch_id: filtered.length > 0 ? filtered[0].id : ''
                        });
                      }}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}
                    >
                      {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Board / Stream</label>
                    <select 
                      value={convertData.board} 
                      onChange={e => {
                        const newBoard = e.target.value;
                        const currentStd = convertData.standard || activeStandards[0] || '9th';
                        const filtered = batches.filter(b => b.standard === currentStd && b.board === newBoard);
                        setConvertData({
                          ...convertData, 
                          board: newBoard,
                          batch_id: filtered.length > 0 ? filtered[0].id : ''
                        });
                      }}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}
                    >
                      <option value="">Select Board</option>
                      {(() => {
                        const currentStd = convertData.standard || activeStandards[0] || '9th';
                        const boards = activeBoardsByStandard[currentStd] || [];
                        return boards.map(b => <option key={b} value={b}>{b}</option>);
                      })()}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Assign Batch</label>
                  {(() => {
                    const currentStd = convertData.standard || convertingEnq?.class_range;
                    const currentBoard = convertData.board || (convertData.standard ? '' : convertingEnq?.board);
                    const filtered = batches.filter(b => b.standard === currentStd && b.board === currentBoard);
                    
                    if (filtered.length === 0) return (
                      <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: '0.875rem', border: '1px solid #FCA5A5' }}>
                        ⚠️ No matching batches found for {currentStd} - {currentBoard || 'Unselected'}.
                      </div>
                    );
                    return (
                      <select 
                        value={convertData.batch_id} 
                        onChange={e => setConvertData({...convertData, batch_id: e.target.value})} 
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary)', outline: 'none', backgroundColor: '#F0F9FF' }} 
                        required
                      >
                        <option value="">Select a specific batch...</option>
                        {filtered.map(b => <option key={b.id} value={b.id}>{b.name} ({b.timing})</option>)}
                      </select>
                    );
                  })()}
                </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Parent Name</label>
                   <input type="text" value={convertData.parent_name} onChange={e => setConvertData({...convertData, parent_name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="Optional" />
                 </div>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Parent Phone</label>
                   <input type="text" value={convertData.parent_phone} onChange={e => setConvertData({...convertData, parent_phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder={convertingEnq?.phone || "Optional"} />
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Date of Birth</label>
                   <input type="date" value={convertData.dob} onChange={e => setConvertData({...convertData, dob: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                 </div>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Blood Group</label>
                   <input type="text" value={convertData.blood_group} onChange={e => setConvertData({...convertData, blood_group: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="e.g. O+" />
                 </div>
               </div>

               <div className="form-group">
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Full Address</label>
                 <textarea value={convertData.address} onChange={e => setConvertData({...convertData, address: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }} rows="2" placeholder="Optional"></textarea>
               </div>

               <div className="form-group">
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Payment Plan</label>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: convertData.fee_plan === 'One-time' ? '#EFF6FF' : 'white', borderColor: convertData.fee_plan === 'One-time' ? '#3B82F6' : 'var(--border-color)' }}>
                       <input type="radio" value="One-time" checked={convertData.fee_plan === 'One-time'} onChange={e => setConvertData({...convertData, fee_plan: e.target.value, installments: 1})} /> Full Pay
                    </label>
                    <label style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: convertData.fee_plan === 'EMI' ? '#EFF6FF' : 'white', borderColor: convertData.fee_plan === 'EMI' ? '#3B82F6' : 'var(--border-color)' }}>
                       <input type="radio" value="EMI" checked={convertData.fee_plan === 'EMI'} onChange={e => setConvertData({...convertData, fee_plan: e.target.value, installments: 4})} /> EMI Plan
                    </label>
                 </div>
               </div>

               {convertData.fee_plan === 'EMI' && (
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Number of Installments</label>
                   <select value={convertData.installments} onChange={e => setConvertData({...convertData, installments: parseInt(e.target.value) || 4})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                     <option value="2">2 Installments</option>
                     <option value="3">3 Installments</option>
                     <option value="4">4 Installments</option>
                     <option value="6">6 Installments</option>
                     <option value="12">12 Installments</option>
                   </select>
                 </div>
               )}

               <div className="form-group" style={{ padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#166534', fontSize: '0.875rem' }}>Initial Token Payment</label>
                 <div style={{ position: 'relative' }}>
                   <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#166534', fontWeight: 700 }}>₹</span>
                   <input type="number" value={convertData.token_amount} onChange={e => setConvertData({...convertData, token_amount: e.target.value})} style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2rem', borderRadius: '8px', border: '1px solid #86EFAC', outline: 'none' }} placeholder="0.00" />
                 </div>
               </div>
            </div>

            <div className="modal-footer">
               <button type="submit" className="btn btn-primary" style={{ height: '3rem', fontSize: '1rem', width: '100%' }} disabled={isConverting}>
                  {isConverting ? (
                    <><Loader2 size={18} className="animate-spin" style={{marginRight:'0.5rem'}}/> Enrolling...</>
                  ) : (
                    <><CheckCircle size={18} style={{marginRight:'0.5rem'}}/> Confirm Enrollment</>
                  )}
               </button>
            </div>
          </form>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSave} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingId ? 'Edit Enquiry' : 'Add New Enquiry'}</h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {formError && <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: '8px', fontWeight: 500, fontSize: '0.875rem', border: '1px solid #FCA5A5' }}>⚠️ {formError}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Full Name</label>
                   <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                 </div>
                 <div className="form-group">
                   <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Phone Number</label>
                   <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                 </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Email Address (Optional)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Class / Standard</label>
                  <select 
                    value={formData.class_range} 
                    onChange={e => {
                      const newClass = e.target.value;
                      const boards = activeBoardsByStandard[newClass] || [];
                      const exams = activeExamsByStandard[newClass] || [];
                      setFormData({
                        ...formData, 
                        class_range: newClass,
                        board: boards.length > 0 ? boards[0] : (activeBoards[0] || 'State Board'),
                        exam_target: exams.length > 0 ? exams[0] : (activeExams[0] || 'None')
                      });
                    }} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}
                  >
                    {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>School Board / Stream</label>
                  <select value={formData.board} onChange={e => setFormData({...formData, board: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    {(activeBoardsByStandard[formData.class_range] || []).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Target Examination</label>
                <select value={formData.exam_target} onChange={e => setFormData({...formData, exam_target: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                  {(activeExamsByStandard[formData.class_range] || []).map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                  {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              {formData.status === 'Lost' && (
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#EF4444' }}>Reason for Non-Conversion</label>
                  <select value={formData.lost_reason} onChange={e => setFormData({...formData, lost_reason: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FCA5A5', outline: 'none', backgroundColor: '#FEF2F2' }} required>
                    <option value="">Select a reason...</option>
                    <option value="Joined Competitor">Joined Competitor</option>
                    <option value="Fees Too High">Fees Too High</option>
                    <option value="Location Issue">Location Issue</option>
                    <option value="Timing Mismatch">Timing Mismatch</option>
                    <option value="No Response">No Response / Not Reachable</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Enquiry Message / Notes</label>
                <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', minHeight: '80px' }} placeholder="Any specific requirements or notes..."></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" style={{ height: '3rem', width: '100%' }} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 size={18} className="animate-spin" style={{marginRight:'0.5rem'}}/> Saving...</>
                ) : (
                  <><Save size={18} style={{marginRight:'0.5rem'}}/> {editingId ? 'Update Enquiry' : 'Create Enquiry'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Enquiry"
        message="Are you sure you want to remove this enquiry? This action cannot be reversed."
        itemName={deletingName}
      />

      {showQrModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Share Enquiry Form</h2>
              <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Clients can scan this QR or click the link below to submit their details.</p>
            
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
               <QRCodeCanvas value={`${window.location.origin}/enquiry`} size={200} />
            </div>

            <div style={{ position: 'relative' }}>
               <input 
                 readOnly 
                 value={`${window.location.origin}/enquiry`} 
                 style={{ width: '100%', padding: '1rem', paddingRight: '3rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#F8FAFC', fontSize: '0.875rem', color: 'var(--text-secondary)', outline: 'none' }}
               />
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(`${window.location.origin}/enquiry`);
                   setCopied(true);
                   setTimeout(() => setCopied(false), 2000);
                 }}
                 style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: copied ? '#DCFCE7' : 'white', color: copied ? '#10B981' : 'var(--primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
               >
                 {copied ? <Check size={18}/> : <Copy size={18}/>}
               </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;
