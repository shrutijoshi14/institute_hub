import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Trash2, Edit, X, Users } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const Batches = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  
  const [nameParts, setNameParts] = useState({
    time: 'Morning',
    no: '1',
    year: new Date().getFullYear().toString()
  });

  const [timingParts, setTimingParts] = useState({
    startHour: '08', startMin: '00', startAmPm: 'AM',
    endHour: '10', endMin: '00', endAmPm: 'AM'
  });

  const [formData, setFormData] = useState({
    name: `Morning - 11th - State Board - Batch 1 - ${new Date().getFullYear()}`,
    standard: '11th',
    board: 'State Board',
    timing: '',
    facultyIds: []
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const fetchData = async () => {
    try {
      const [batchesRes, facultyRes, coursesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/batches'),
        axios.get('http://localhost:5000/api/faculty'),
        axios.get('http://localhost:5000/api/courses')
      ]);
      setBatches(batchesRes.data);
      setFacultyList(facultyRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      timing: `${timingParts.startHour}:${timingParts.startMin} ${timingParts.startAmPm} - ${timingParts.endHour}:${timingParts.endMin} ${timingParts.endAmPm}`
    }));
  }, [timingParts]);

  const openForm = (batch = null) => {
    if (batch) {
      setEditingBatch(batch.id);
      // Try to parse structured name (now handles standard and board in the name)
      const match = batch.name.match(/^(.*?) - (.*?) - (.*?) - Batch (.*?) - (\d{4})$/)
        || batch.name.match(/^(.*?) - (.*?) - Batch (.*?) - (\d{4})$/)
        || batch.name.match(/^(.*?) - Batch (.*?) - (\d{4})$/);
      if (match && match.length === 6) {
        // Matched format with Standard and Board
        setNameParts({ time: match[1], no: match[4], year: match[5] });
      } else if (match && match.length === 5) {
        // Matched format with Standard
        setNameParts({ time: match[1], no: match[3], year: match[4] });
      } else if (match && match.length === 4) {
        // Matched old format without Standard
        setNameParts({ time: match[1], no: match[2], year: match[3] });
      } else {
        setNameParts({ time: 'Morning', no: '1', year: new Date().getFullYear().toString() });
      }

      let tParts = { startHour: '08', startMin: '00', startAmPm: 'AM', endHour: '10', endMin: '00', endAmPm: 'AM' };
      if (batch.timing) {
        const match = batch.timing.match(/(\d{2}):(\d{2}) (AM|PM) - (\d{2}):(\d{2}) (AM|PM)/);
        if (match) {
          tParts = { startHour: match[1], startMin: match[2], startAmPm: match[3], endHour: match[4], endMin: match[5], endAmPm: match[6] };
        }
      }
      setTimingParts(tParts);

      setFormData({
        name: batch.name,
        standard: batch.standard || '11th',
        board: batch.board || 'State Board',
        timing: batch.timing,
        facultyIds: batch.Faculties ? batch.Faculties.map(f => f.id) : []
      });
    } else {
      setEditingBatch(null);
      setNameParts({ time: 'Morning', no: '1', year: new Date().getFullYear().toString() });
      setTimingParts({ startHour: '08', startMin: '00', startAmPm: 'AM', endHour: '10', endMin: '00', endAmPm: 'AM' });
      setFormData({
        name: `Morning - 11th - State Board - Batch 1 - ${new Date().getFullYear()}`,
        standard: '11th',
        board: 'State Board',
        timing: '08:00 AM - 10:00 AM',
        facultyIds: []
      });
    }
    setShowModal(true);
  };

  const handleNamePartsChange = (field, value) => {
    const updated = { ...nameParts, [field]: value };
    setNameParts(updated);
    setFormData(prev => ({
      ...prev,
      name: `${updated.time} - ${prev.standard} - ${prev.board || 'State Board'} - Batch ${updated.no} - ${updated.year}`
    }));
  };

  const handleStandardChange = (e) => {
    const newStandard = e.target.value;
    setFormData(prev => ({
      ...prev,
      standard: newStandard,
      name: `${nameParts.time} - ${newStandard} - ${prev.board || 'State Board'} - Batch ${nameParts.no} - ${nameParts.year}`
    }));
  };

  const handleBoardChange = (e) => {
    const newBoard = e.target.value;
    setFormData(prev => ({
      ...prev,
      board: newBoard,
      name: `${nameParts.time} - ${prev.standard} - ${newBoard || 'State Board'} - Batch ${nameParts.no} - ${nameParts.year}`
    }));
  };

  const handleFacultyCheckboxChange = (facultyId) => {
    setFormData(prev => {
      const isSelected = prev.facultyIds.includes(facultyId);
      if (isSelected) {
        return { ...prev, facultyIds: prev.facultyIds.filter(id => id !== facultyId) };
      } else {
        return { ...prev, facultyIds: [...prev.facultyIds, facultyId] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        await axios.put(`http://localhost:5000/api/batches/${editingBatch}`, formData);
        setMsg(`✅ Batch updated successfully!`);
      } else {
        await axios.post('http://localhost:5000/api/batches', formData);
        setMsg(`✅ Batch created successfully!`);
      }
      fetchData();
      setShowModal(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error saving batch.');
    }
  };

  const handleDeleteClick = (batch) => {
    setDeletingId(batch.id);
    setDeletingName(batch.name);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/batches/${deletingId}`);
      setMsg(`✅ Batch deleted successfully.`);
      setShowDeleteModal(false);
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (selectedStandard !== 'All' && batch.standard !== selectedStandard) return false;
    if (selectedBoard !== 'All' && batch.board !== selectedBoard) return false;
    if (selectedExam !== 'All') {
      const matchesExam = courses.some(c => 
        c.class_range === batch.standard && 
        c.board === batch.board && 
        c.exam_target === selectedExam
      );
      if (!matchesExam) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Batches Management</h1>
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
          <button className="btn btn-primary" onClick={() => openForm()}>
            <Plus size={18} /> New Batch
          </button>
        </div>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}

      <div className="grid-cols-2">
        {filteredBatches.map(batch => (
          <div key={batch.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
             <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openForm(batch)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}><Edit size={16}/></button>
                <button onClick={() => handleDeleteClick(batch)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
             </div>
            <div style={{ width: '100%' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', paddingRight: '3rem' }}>{batch.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                   <Calendar size={16} /> <span style={{ fontWeight: 600 }}>{batch.standard} ({batch.board})</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                   <Clock size={16} /> <span style={{ fontWeight: 600 }}>{batch.timing}</span>
                 </div>
              </div>
              
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} /> Assigned Faculty
                </div>
                {batch.Faculties && batch.Faculties.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {batch.Faculties.map(f => (
                      <span key={f.id} style={{ fontSize: '0.75rem', backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {f.name} ({f.subject_expertise})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>No faculty assigned yet.</div>
                )}
              </div>

              {(() => {
                const batchCourses = courses.filter(c => c.class_range === batch.standard && c.board === batch.board);
                return (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <strong>{batchCourses.length}</strong> Syllabus items matched
                    </div>
                    <button 
                      onClick={() => navigate(`/admin/syllabus-tracker?batchId=${batch.id}`)}
                      style={{ padding: '0.4rem 0.8rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}
                    >
                      Track Progress →
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Modern React Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>{editingBatch ? 'Edit Batch Details' : 'Create New Batch'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Time of Batch</label>
                  <select value={nameParts.time} onChange={e => handleNamePartsChange('time', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Weekend">Weekend</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Batch No</label>
                  <input type="text" value={nameParts.no} onChange={e => handleNamePartsChange('no', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="e.g. 1" required />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Year</label>
                  <input type="text" value={nameParts.year} onChange={e => handleNamePartsChange('year', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="e.g. 2026" required />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Generated Batch Name (or Custom Name)</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Standard/Class</label>
                  <select value={formData.standard} onChange={handleStandardChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Board</label>
                  <select value={formData.board} onChange={handleBoardChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Timing</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select value={timingParts.startHour} onChange={e => setTimingParts({...timingParts, startHour: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span>:</span>
                  <select value={timingParts.startMin} onChange={e => setTimingParts({...timingParts, startMin: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={timingParts.startAmPm} onChange={e => setTimingParts({...timingParts, startAmPm: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                  <span style={{ margin: '0 0.5rem', fontWeight: 600 }}>to</span>
                  <select value={timingParts.endHour} onChange={e => setTimingParts({...timingParts, endHour: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span>:</span>
                  <select value={timingParts.endMin} onChange={e => setTimingParts({...timingParts, endMin: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={timingParts.endAmPm} onChange={e => setTimingParts({...timingParts, endAmPm: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Assign Faculty</label>
                <div style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: '#F8FAFC', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {facultyList.length === 0 ? (
                     <div style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>No faculty available. Please add faculty first.</div>
                  ) : (
                    facultyList.map(f => (
                      <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #E5E7EB', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.facultyIds.includes(f.id)} 
                          onChange={() => handleFacultyCheckboxChange(f.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 500 }}>{f.name}</span> 
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({f.subject_expertise})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingBatch ? 'Save Changes' : 'Create Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Batch"
        message="Are you sure you want to remove this batch?"
        itemName={deletingName}
      />
    </div>
  );
};

export default Batches;
