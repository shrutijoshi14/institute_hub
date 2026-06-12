import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const AdminSyllabusTracker = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [courses, setCourses] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/batches');
        setBatches(res.data);
        // Pre-select if passed in URL
        const queryParams = new URLSearchParams(window.location.search);
        const batchIdParam = queryParams.get('batchId');
        if (batchIdParam) {
          setSelectedBatchId(batchIdParam);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBatches();
  }, []);

  useEffect(() => {
    const fetchTrackerData = async () => {
      if (!selectedBatchId) {
        setCourses([]);
        setProgressData([]);
        return;
      }
      setLoading(true);
      try {
        const batch = batches.find(b => b.id === parseInt(selectedBatchId));
        if (batch) {
          const coursesRes = await axios.get('http://localhost:5000/api/courses');
          const batchCourses = coursesRes.data.filter(c => c.class_range === batch.standard && c.board === batch.board);
          setCourses(batchCourses);

          const progressRes = await axios.get(`http://localhost:5000/api/progress/${selectedBatchId}`);
          setProgressData(progressRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrackerData();
  }, [selectedBatchId, batches]);

  const handleStatusChange = async (courseId, newStatus) => {
    try {
      const res = await axios.post('http://localhost:5000/api/progress', {
        batch_id: selectedBatchId,
        course_id: courseId,
        status: newStatus
      });
      // Update local state
      const updatedProgress = progressData.filter(p => p.course_id !== courseId);
      setProgressData([...updatedProgress, res.data]);
      showSaveMsg();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemarksChange = async (courseId, remarks) => {
    try {
      const res = await axios.post('http://localhost:5000/api/progress', {
        batch_id: selectedBatchId,
        course_id: courseId,
        remarks: remarks
      });
      // Update local state
      const updatedProgress = progressData.filter(p => p.course_id !== courseId);
      setProgressData([...updatedProgress, res.data]);
      showSaveMsg();
    } catch (err) {
      console.error(err);
    }
  };

  const showSaveMsg = () => {
    setSaveMsg('Progress updated successfully!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // Group courses by subject
  const groupedCourses = courses.reduce((acc, course) => {
    const subj = course.subject || 'General';
    if (!acc[subj]) acc[subj] = [];
    acc[subj].push(course);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    if (status === 'Completed') return '#10B981'; // green
    if (status === 'In Progress') return '#F59E0B'; // yellow
    return '#EF4444'; // red (Pending)
  };

  const toggleSubject = (subject) => {
    if (expandedSubject === subject) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subject);
    }
  };

  const toggleCompletion = (courseId) => {
    const progress = progressData.find(p => p.course_id === courseId);
    const isCompleted = progress && progress.status === 'Completed';
    const newStatus = isCompleted ? 'Pending' : 'Completed';
    handleStatusChange(courseId, newStatus);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Update Syllabus Progress</h1>
        {saveMsg && <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 500 }}>{saveMsg}</div>}
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>Select Batch:</h3>
        <select 
          value={selectedBatchId} 
          onChange={(e) => setSelectedBatchId(e.target.value)}
          style={{ padding: '0.5rem 2.5rem 0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '250px', backgroundColor: 'white', cursor: 'pointer' }}
        >
          <option value="">-- Choose Batch --</option>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard} - {b.board})</option>)}
        </select>
      </div>

      {loading && <p>Loading syllabus...</p>}

      {!loading && selectedBatchId && courses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#F8FAFC', borderRadius: '8px', color: 'var(--text-secondary)' }}>
          No syllabus items found for this batch's standard and board combination.
          <br/>
          <a href="/syllabus" style={{ color: 'var(--primary)', textDecoration: 'underline', marginTop: '1rem', display: 'inline-block' }}>Add Syllabus for this Standard & Board</a>
        </div>
      )}

      {!loading && selectedBatchId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {Object.keys(groupedCourses).map(subject => {
            const subjectCourses = groupedCourses[subject];
            const total = subjectCourses.length;
            const completedCount = subjectCourses.filter(c => {
              const p = progressData.find(pd => pd.course_id === c.id);
              return p && p.status === 'Completed';
            }).length;
            const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            return (
              <div key={subject} className="card" onClick={() => toggleSubject(subject)} style={{ cursor: 'pointer', transition: 'transform 0.2s', border: expandedSubject === subject ? '2px solid var(--primary)' : '1px solid var(--border-color)', position: 'relative' }}>
                <h2 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>{subject}</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>{completedCount} / {total} Chapters</span>
                  <span style={{ fontWeight: 600, color: progressPercent === 100 ? '#10B981' : 'var(--primary)' }}>{progressPercent}%</span>
                </div>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent === 100 ? '#10B981' : 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500, textAlign: 'right' }}>
                  {expandedSubject === subject ? 'Hide Chapters ▲' : 'View Chapters ▼'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Subject Modal / Accordion View */}
      {expandedSubject && (
        <div style={{ marginTop: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--primary)', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #E5E7EB', paddingBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: 'var(--primary)' }}>{expandedSubject} Chapters</h2>
            <button onClick={() => setExpandedSubject(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groupedCourses[expandedSubject].map(course => {
              const progress = progressData.find(p => p.course_id === course.id);
              const isCompleted = progress && progress.status === 'Completed';
              const currentRemarks = progress ? progress.remarks : '';

              return (
                <div key={course.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', backgroundColor: isCompleted ? '#F0FDF4' : '#F8FAFC', borderRadius: '6px', border: `1px solid ${isCompleted ? '#BBF7D0' : '#E5E7EB'}`, transition: 'all 0.2s' }}>
                  <div style={{ paddingTop: '0.25rem' }}>
                    <input 
                      type="checkbox" 
                      checked={isCompleted}
                      onChange={() => toggleCompletion(course.id)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10B981' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: isCompleted ? '#065F46' : 'var(--primary)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {course.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      {course.description}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add teacher remarks (optional)..." 
                      defaultValue={currentRemarks}
                      onBlur={(e) => {
                        if(e.target.value !== currentRemarks) {
                          handleRemarksChange(course.id, e.target.value);
                        }
                      }}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCompleted ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', fontWeight: 600, fontSize: '0.875rem' }}>
                        <CheckCircle size={16} /> Completed
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#EF4444', fontWeight: 600, fontSize: '0.875rem' }}>
                        <AlertCircle size={16} /> Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSyllabusTracker;
