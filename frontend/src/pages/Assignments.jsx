import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Upload, FileUp, Plus, Trash2, Edit, CheckCircle, Clock, X, Save } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS } from '../utils/constants';
import DeleteModal from '../components/DeleteModal';

const Assignments = () => {
  const { user, role } = useAuth();
  const [msg, setMsg] = useState('');
  const [settings, setSettings] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [batches, setBatches] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradingForm, setGradingForm] = useState({
    status: 'submitted',
    marks: '',
    feedback: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    course_id: ''
  });

  const fetchData = async (courseId) => {
    try {
      if (!courseId) return;
      let res;
      if (courseId === 'All') {
        res = await axios.get('http://localhost:5000/api/academic/assignments/all');
      } else {
        res = await axios.get(`http://localhost:5000/api/academic/assignments/${courseId}`);
      }
      setAssignments(res.data || []);
      if (role === 'admin' || role === 'faculty') {
        const subRes = await axios.get('http://localhost:5000/api/academic/submissions/all');
        setSubmissions(subRes.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentAssignments = async () => {
    try {
      const studentId = role === 'parent' ? user.childId : user.id;
      if (!studentId) {
        setAssignments([]);
        setStudentSubmissions([]);
        return;
      }
      const [assigRes, subRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/academic/student/assignments/${studentId}`),
        axios.get(`http://localhost:5000/api/academic/submissions/student/${studentId}`)
      ]);
      setAssignments(assigRes.data || []);
      setStudentSubmissions(subRes.data || []);
    } catch (err) {
      console.error("Student Assignments Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (role === 'admin' || role === 'faculty') {
      const fetchInitialData = async () => {
        try {
          const [courseRes, batchRes, settingsRes] = await Promise.all([
            axios.get('http://localhost:5000/api/courses'),
            axios.get('http://localhost:5000/api/batches'),
            axios.get('http://localhost:5000/api/settings').catch(() => ({ data: null }))
          ]);
          setCourses(courseRes.data || []);
          setBatches(batchRes.data || []);
          setSelectedCourseId('All');
          if (settingsRes && settingsRes.data) {
            setSettings(settingsRes.data);
          }
        } catch (err) {
           console.error(err);
        }
      };
      fetchInitialData();
    } else {
      fetchStudentAssignments();
    }
  }, [role, user.id, user.childId]);

  // Refetch when selected course changes (only for admin/faculty)
  useEffect(() => {
     if ((role === 'admin' || role === 'faculty') && selectedCourseId) {
        fetchData(selectedCourseId);
     }
  }, [selectedCourseId, role]);

  // Escape keydown modal closing listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteModal(false);
        setShowGradingModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openForm = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment.id);
      setFormData({ title: assignment.title, description: assignment.description, due_date: assignment.due_date || new Date().toISOString().split('T')[0], course_id: assignment.course_id || selectedCourseId });
    } else {
      setEditingAssignment(null);
      setFormData({ title: '', description: '', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], course_id: selectedCourseId });
    }
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingAssignment(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      if (editingAssignment) {
        await axios.put(`http://localhost:5000/api/academic/assignments/${editingAssignment}`, formData);
        setMsg('✅ Assignment updated!');
      } else {
        await axios.post('http://localhost:5000/api/academic/assignments', formData);
        setMsg('✅ Assignment posted successfully!');
      }
      if(formData.course_id === selectedCourseId) {
         fetchData(selectedCourseId);
      }
      closeForm();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error saving assignment.');
    }
  };

  const handleStudentSubmit = async (assignmentId, file) => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    
    const studentId = role === 'parent' ? user.childId : user.id;
    const formData = new FormData();
    formData.append('assignment_id', assignmentId);
    formData.append('student_id', studentId);
    formData.append('assignment_file', file);

    try {
      await axios.post('http://localhost:5000/api/academic/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg('✅ Assignment solution uploaded and submitted successfully!');
      fetchStudentAssignments();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { 
      console.error(err);
      alert('❌ Upload failed: ' + (err.response?.data?.msg || 'Check file format (PDF/JPG/PNG)'));
    }
  };

  const openGradingForm = (submission) => {
    setGradingSubmission(submission);
    setGradingForm({
      status: submission.status || 'submitted',
      marks: submission.marks !== null ? submission.marks : '',
      feedback: submission.feedback || ''
    });
    setShowGradingModal(true);
  };

  const handleSaveGrading = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      await axios.put(`http://localhost:5000/api/academic/submissions/${gradingSubmission.id}`, {
        status: gradingForm.status,
        marks: gradingForm.marks !== '' ? parseInt(gradingForm.marks) : null,
        feedback: gradingForm.feedback
      });
      setMsg('✅ Submission graded successfully!');
      fetchData(selectedCourseId);
      setShowGradingModal(false);
      setGradingSubmission(null);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to update submission grade.');
    }
  };

  const handleDeleteClick = (assignment) => {
    setDeletingId(assignment.id);
    setDeletingName(assignment.title);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/academic/assignments/${deletingId}`);
      setMsg('✅ Assignment removed.');
      setShowDeleteModal(false);
      fetchData(selectedCourseId);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
  };

  // Student Calculations
  const pendingAssignments = assignments.filter(a => 
    !studentSubmissions.some(s => s.assignment_id === a.id)
  );

  const completedSubmissions = studentSubmissions.map(sub => {
    const assig = assignments.find(a => a.id === sub.assignment_id) || {};
    return {
      ...sub,
      title: assig.title || 'Assignment Details',
      description: assig.description || '',
      due_date: assig.due_date || ''
    };
  });

  // Filter assignments shown in the active homework tab
  const displayedAssignments = assignments.filter(a => {
    if (selectedCourseId !== 'All' && String(a.course_id) !== String(selectedCourseId)) return false;
    
    const course = courses.find(c => c.id === a.course_id);
    const standard = a.standard || course?.class_range;
    const board = a.board || course?.board;
    const exam_target = a.exam_target || course?.exam_target;
    
    if (selectedStandard !== 'All' && standard !== selectedStandard) return false;
    if (selectedBoard !== 'All' && board !== selectedBoard) return false;
    if (selectedExam !== 'All' && exam_target !== selectedExam) return false;
    
    if (selectedBatch !== 'All') {
      const batchObj = batches.find(b => String(b.id) === String(selectedBatch));
      if (batchObj) {
        if (batchObj.standard !== standard || batchObj.board !== board) return false;
      }
    }
    return true;
  });

  const displayedSubmissions = submissions.filter(s => {
    if (selectedStandard !== 'All' && s.standard !== selectedStandard) return false;
    if (selectedBoard !== 'All' && s.board !== selectedBoard) return false;
    if (selectedExam !== 'All' && s.exam_target !== selectedExam) return false;
    if (selectedBatch !== 'All' && String(s.batch_id) !== String(selectedBatch)) return false;
    return true;
  });

  const activeStandards = settings?.standards && settings.standards.length > 0 ? settings.standards : STANDARDS;
  const activeBoards = settings?.boards && settings.boards.length > 0 ? settings.boards : BOARDS;
  const activeExams = settings?.exams && settings.exams.length > 0 ? settings.exams : EXAMS;

  if (role === 'admin' || role === 'faculty') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{role === 'admin' ? 'Global Assignments' : 'My Course Tasks'}</h1>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              value={selectedStandard} 
              onChange={e => {
                setSelectedStandard(e.target.value);
                setSelectedCourseId('All');
              }}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
            >
              <option value="All">All Standards</option>
              {activeStandards.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              value={selectedBoard} 
              onChange={e => setSelectedBoard(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
            >
              <option value="All">All Boards</option>
              {activeBoards.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select 
              value={selectedExam} 
              onChange={e => setSelectedExam(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
            >
              <option value="All">All Exams</option>
              {activeExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>

            <select 
              value={selectedBatch} 
              onChange={e => setSelectedBatch(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '130px' }}
            >
              <option value="All">All Batches</option>
              {batches
                .filter(b => selectedStandard === 'All' || b.standard === selectedStandard)
                .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <select 
              value={selectedCourseId} 
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
            >
              <option value="All">All Courses</option>
              {courses
                .filter(c => selectedStandard === 'All' || c.class_range === selectedStandard)
                .map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            
            <button className="btn" onClick={() => setShowSubmissions(!showSubmissions)} style={{ border: showSubmissions ? '1px solid var(--primary)' : '1px solid var(--border-color)', backgroundColor: showSubmissions ? 'rgba(99, 102, 241, 0.1)' : 'transparent', padding: '0.6rem 1rem' }}>
              {showSubmissions ? 'View Assignments' : 'Check Submissions'}
            </button>
            <button className="btn btn-primary" onClick={() => openForm()} style={{ padding: '0.6rem 1rem' }}>
              <Plus size={18} /> New Assignment
            </button>
          </div>
        </div>

        {msg && <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}

        <div className="card">
           {showSubmissions ? (
             <>
               <h2 style={{ marginBottom: '1rem' }}>Student Homework Submissions</h2>
               <div className="table-container">
                 <table>
                   <thead>
                     <tr>
                       <th>Student</th>
                       <th>Assignment</th>
                       <th>Submitted Date</th>
                       <th>Attachment</th>
                       <th>Status</th>
                       <th>Marks</th>
                       <th>Feedback</th>
                       <th>Action</th>
                     </tr>
                   </thead>
                   <tbody>
                      {displayedSubmissions.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.student_name}</td>
                          <td>{s.assignment_title}</td>
                          <td>{new Date(s.submission_date).toLocaleDateString('en-GB')}</td>
                          <td>
                            {s.file_path ? (
                              <a 
                                href={`http://localhost:5000/${s.file_path.replace(/\\/g, '/')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
                              >
                                <Upload size={14} /> Download File
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No file</span>
                            )}
                          </td>
                          <td>
                            <span style={{ 
                              padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: s.status === 'checked' || s.status === 'graded' ? '#DCFCE7' : '#FEE2E2',
                              color: s.status === 'checked' || s.status === 'graded' ? '#166534' : '#991B1B'
                            }}>
                              {s.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{s.marks !== null ? s.marks : '-'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.feedback}>
                             {s.feedback || '-'}
                          </td>
                          <td>
                            <button 
                              onClick={() => openGradingForm(s)} 
                              className="btn btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              Check/Grade
                            </button>
                          </td>
                        </tr>
                      ))}
                      {displayedSubmissions.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>No submissions yet.</td></tr>}
                    </tbody>
                 </table>
               </div>
             </>
           ) : (
             <>
               <h2>Active Homework</h2>
               <ul style={{ paddingLeft: 0, marginTop: '1rem', listStyle: 'none' }}>
                 {displayedAssignments.map(a => (
                   <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                     <div>
                       <strong>{a.title}</strong>
                       <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Due: {a.due_date} | {a.description}</div>
                     </div>
                     <div style={{ display: 'flex', gap: '0.5rem' }}>
                       <button onClick={() => openForm(a)} className="btn btn-icon"><Edit size={16}/></button>
                       <button onClick={() => handleDeleteClick(a)} className="btn btn-icon" style={{color: '#EF4444'}}><Trash2 size={16}/></button>
                     </div>
                   </li>
                 ))}
                 {displayedAssignments.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active assignments.</p>}
               </ul>
             </>
           )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2 style={{ margin: 0 }}>{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h2>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                  </div>
                  {!editingAssignment && (
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Target Standard / Course</label>
                      <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.class_range})</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                    <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Due Date</label>
                    <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={closeForm} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><Save size={18} style={{ marginRight: '0.5rem' }} /> {editingAssignment ? 'Save Changes' : 'Publish Assignment'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grading Modal */}
        {showGradingModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Check & Grade Assignment</h2>
                <button onClick={() => setShowGradingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveGrading}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Student: <strong style={{ color: 'var(--text-primary)' }}>{gradingSubmission?.student_name}</strong><br />
                    Task: <strong>{gradingSubmission?.assignment_title}</strong>
                  </p>
                  
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Evaluation Status</label>
                    <select 
                      value={gradingForm.status} 
                      onChange={e => setGradingForm({...gradingForm, status: e.target.value})} 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="submitted">Submitted (Pending evaluation)</option>
                      <option value="checked">Checked / Evaluated</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Marks Awarded</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={gradingForm.marks} 
                      onChange={e => setGradingForm({...gradingForm, marks: e.target.value})} 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} 
                      placeholder="e.g. 9"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Feedback Remarks</label>
                    <textarea 
                      rows="3" 
                      value={gradingForm.feedback} 
                      onChange={e => setGradingForm({...gradingForm, feedback: e.target.value})} 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }} 
                      placeholder="Enter remarks for the student..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowGradingModal(false)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><Save size={18} style={{ marginRight: '0.5rem' }} /> Save Grading</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DeleteModal 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Assignment"
          message="Are you sure you want to remove this assignment? All linked submissions will also be hidden."
          itemName={deletingName}
        />
      </div>
    );
  }

  // Student View
  return (
    <div>
      <h1 className="page-title">My Assignments</h1>
      {msg && <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>{msg}</div>}
      <div className="grid-cols-2">
        <div className="card">
          <h2 style={{color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Clock size={20}/> Outstanding Tasks</h2>
          {pendingAssignments.map(a => (
             <div key={a.id} style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', background: '#F8FAFC' }}>
               <h3 style={{fontSize: '1rem', marginBottom: '0.25rem'}}>{a.title}</h3>
               <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>{a.description}</p>
               <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Expires on {new Date(a.due_date).toLocaleDateString('en-GB')}</p>
               <div style={{ marginTop: '1rem' }}>
                 <input 
                   type="file" 
                   id={`file-${a.id}`} 
                   style={{ display: 'none' }} 
                   accept=".pdf,.jpg,.jpeg,.png"
                   onChange={(e) => {
                     const file = e.target.files[0];
                     if (file) handleStudentSubmit(a.id, file);
                   }}
                 />
                 <button className="btn btn-primary" onClick={() => document.getElementById(`file-${a.id}`).click()} style={{ width: '100%', justifyContent: 'center' }}>
                   <FileUp size={16} /> Upload Solution (PDF/JPG)
                 </button>
               </div>
             </div>
          ))}
          {pendingAssignments.length === 0 && <p style={{color:'var(--text-secondary)'}}>No pending assignments.</p>}
        </div>
        <div className="card">
          <h2 style={{color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={20}/> Recently Completed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {completedSubmissions.map(sub => (
              <div key={sub.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: sub.status === 'checked' || sub.status === 'graded' ? '#F0FDF4' : '#F8FAFC' }}>
                <h3 style={{fontSize: '1rem', marginBottom: '0.25rem'}}>{sub.title}</h3>
                <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>Submitted on {new Date(sub.submission_date).toLocaleDateString('en-GB')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                   <span style={{ 
                     fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600,
                     backgroundColor: sub.status === 'checked' || sub.status === 'graded' ? '#DCFCE7' : '#F1F5F9',
                     color: sub.status === 'checked' || sub.status === 'graded' ? '#166534' : '#64748B'
                   }}>
                     {sub.status.toUpperCase()}
                   </span>
                   {sub.marks !== null && (
                     <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, backgroundColor: '#EFF6FF', color: '#1E40AF' }}>
                       Marks: {sub.marks}
                     </span>
                   )}
                </div>
                {sub.feedback && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.75rem', background: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    <strong>Feedback:</strong> {sub.feedback}
                  </p>
                )}
              </div>
            ))}
            {completedSubmissions.length === 0 && <p style={{color:'var(--text-secondary)'}}>No solutions submitted yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
