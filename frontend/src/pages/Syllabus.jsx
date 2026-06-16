import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Clock, Plus, Trash2, Edit, X } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS, SUBJECTS, BOARDS_BY_STANDARD, EXAMS_BY_STANDARD, SUBJECTS_BY_STANDARD } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const Syllabus = () => {
  const [msg, setMsg] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_range: '5th',
    board: 'State Board',
    exam_target: 'None',
    subject: 'Maths',
    fees: ''
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCourses();
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

  const availableBoards = selectedStandard === 'All' 
    ? [...new Set(Object.values(BOARDS_BY_STANDARD).flat())].sort()
    : BOARDS_BY_STANDARD[selectedStandard] || [];

  const availableExams = selectedStandard === 'All'
    ? [...new Set(Object.values(EXAMS_BY_STANDARD).flat())].sort()
    : EXAMS_BY_STANDARD[selectedStandard] || [];

  useEffect(() => {
    if (selectedStandard !== 'All') {
      if (selectedBoard !== 'All' && !availableBoards.includes(selectedBoard)) {
        setSelectedBoard('All');
      }
      if (selectedExam !== 'All' && !availableExams.includes(selectedExam)) {
        setSelectedExam('All');
      }
    }
  }, [selectedStandard, availableBoards, availableExams]);

  const openForm = (course = null) => {
    if (course) {
      setEditingCourse(course.id);
      setFormData({
        title: course.title,
        description: course.description,
        class_range: course.class_range || '5th',
        board: course.board || 'State Board',
        exam_target: course.exam_target || 'None', // Keep legacy fallback
        subject: course.subject || 'General',
        fees: course.fees
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        class_range: '5th',
        board: 'State Board',
        exam_target: 'None',
        subject: 'Maths',
        fees: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`http://localhost:5000/api/courses/${editingCourse}`, formData);
        setMsg(`✅ Course updated successfully!`);
      } else {
        await axios.post('http://localhost:5000/api/courses', formData);
        setMsg(`✅ Course added successfully!`);
      }
      fetchCourses();
      setShowModal(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error saving course.');
    }
  };

  const handleDeleteClick = (course) => {
    setDeletingId(course.id);
    setDeletingName(course.title);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/courses/${deletingId}`);
      setMsg(`✅ Course deleted successfully.`);
      setShowDeleteModal(false);
      fetchCourses();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const baseFilteredCourses = courses.filter(c => {
    if (selectedStandard !== 'All' && c.class_range !== selectedStandard) return false;
    if (selectedBoard !== 'All' && c.board !== selectedBoard) return false;
    if (selectedExam !== 'All' && c.exam_target !== selectedExam) return false;
    return true;
  });

  const availableSubjects = [...new Set(baseFilteredCourses.map(c => c.subject || 'General'))].sort();

  const finalFilteredCourses = baseFilteredCourses.filter(c => {
    if (selectedSubject !== 'All' && (c.subject || 'General') !== selectedSubject) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Syllabus Master (Index & Topics)</h1>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={18} /> Add Chapter / Topic
        </button>
      </div>

      {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Select Standard</label>
          <select 
            value={selectedStandard} 
            onChange={(e) => setSelectedStandard(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff', minWidth: '150px', fontWeight: 600 }}
          >
            <option value="All">All Standards</option>
            {STANDARDS.map(std => <option key={std} value={std}>{std} Standard</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>School Board / Stream</label>
          <select 
            value={selectedBoard} 
            onChange={(e) => setSelectedBoard(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff', minWidth: '150px', fontWeight: 600 }}
          >
            <option value="All">All Boards</option>
            {availableBoards.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Target Examination</label>
          <select 
            value={selectedExam} 
            onChange={(e) => setSelectedExam(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff', minWidth: '150px', fontWeight: 600 }}
          >
            <option value="All">All Exams</option>
            {availableExams.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Subject</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff', minWidth: '150px', fontWeight: 600 }}
          >
            <option value="All">All Subjects</option>
            {availableSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </div>
      </div>

      <div>
        {(() => {
          if (finalFilteredCourses.length === 0) {
            return <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#F9FAFB', borderRadius: '8px', color: 'var(--text-secondary)' }}>No syllabus items match the selected filters.</div>;
          }

          // Group by Subject
          const grouped = finalFilteredCourses.reduce((acc, course) => {
            const groupKey = selectedStandard === 'All' 
              ? `${course.class_range} - ${course.subject || 'General'}` 
              : course.subject || 'General';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(course);
            return acc;
          }, {});

          return Object.keys(grouped).map(subject => (
            <div key={subject} style={{ marginBottom: '2rem' }}>
              <h2 style={{ paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)', color: 'var(--secondary)', marginBottom: '1rem' }}>{subject}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {grouped[subject].map((course, index) => (
                  <div key={course.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{index + 1}</span>
                        <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.1rem' }}>{course.title}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                            {course.board}
                          </span>
                          {course.exam_target && course.exam_target !== 'None' && (
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                              {course.exam_target}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '2.5rem' }}>{course.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button onClick={() => openForm(course)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: '0.5rem' }}><Edit size={16}/></button>
                        <button onClick={() => handleDeleteClick(course)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Modern React Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSave} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>{editingCourse ? 'Edit Chapter / Topic Details' : 'Add New Chapter / Topic'}</h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Chapter / Topic Name</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required placeholder="e.g. Chapter 1: Real Numbers" />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Topic Details / Outline</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', minHeight: '80px', resize: 'vertical' }} placeholder="e.g. Fundamental Theorem of Arithmetic, LCM and HCF..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Standard/Class</label>
                  <select value={formData.class_range} onChange={e => {
                      const newClass = e.target.value;
                      const boards = BOARDS_BY_STANDARD[newClass] || [];
                      const exams = EXAMS_BY_STANDARD[newClass] || [];
                      const subjects = SUBJECTS_BY_STANDARD[newClass] || [];
                      setFormData({
                        ...formData, 
                        class_range: newClass,
                        board: boards.length > 0 ? boards[0] : 'State Board',
                        exam_target: exams.length > 0 ? exams[0] : 'None',
                        subject: subjects.length > 0 ? subjects[0] : 'General'
                      });
                    }} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subject</label>
                  <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    {(() => {
                      const currentStd = formData.class_range || '5th';
                      const subjects = SUBJECTS_BY_STANDARD[currentStd] || SUBJECTS;
                      return subjects.map(s => <option key={s} value={s}>{s}</option>);
                    })()}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>School Board / Stream</label>
                  <select value={formData.board} onChange={e => setFormData({...formData, board: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    {(BOARDS_BY_STANDARD[formData.class_range] || []).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Target Examination</label>
                  <select value={formData.exam_target} onChange={e => setFormData({...formData, exam_target: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                    {(EXAMS_BY_STANDARD[formData.class_range] || []).map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingCourse ? 'Save Changes' : 'Save Chapter'}</button>
            </div>
          </form>
        </div>
      )}

      <DeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Syllabus"
        message="Are you sure you want to remove this syllabus item? This might affect student enrollments linked to it."
        itemName={deletingName}
      />
    </div>
  );
};

export default Syllabus;
