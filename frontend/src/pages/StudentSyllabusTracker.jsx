import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentSyllabusTracker = () => {
  const { user, role } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [courses, setCourses] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [studentEnrollments, setStudentEnrollments] = useState([]);

  useEffect(() => {
    const fetchBatchesAndStudent = async () => {
      try {
        const batchRes = await axios.get('http://localhost:5000/api/batches');
        setBatches(batchRes.data || []);
        
        const studentId = role === 'parent' ? user.childId : user.id;
        if (studentId) {
          const studentRes = await axios.get('http://localhost:5000/api/auth/users?role=student');
          const student = studentRes.data.find(s => String(s.id) === String(studentId));
          if (student) {
            const enrollments = student.Enrollments || [];
            setStudentEnrollments(enrollments);
            const sortedEnrollments = [...enrollments].sort((a, b) => b.id - a.id);
            const batchId = sortedEnrollments[0]?.batch_id;
            if (batchId) {
              setSelectedBatchId(String(batchId));
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBatchesAndStudent();
  }, [role, user.id, user.childId]);

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

  const calculateOverallProgress = () => {
    if (courses.length === 0) return 0;
    const completedCount = progressData.filter(p => p.status === 'Completed').length;
    return Math.round((completedCount / courses.length) * 100);
  };

  return (
    <div>
      <h1 className="page-title">My Syllabus Progress</h1>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>Select Your Batch:</h3>
        <select 
          value={selectedBatchId} 
          onChange={(e) => setSelectedBatchId(e.target.value)}
          style={{ padding: '0.5rem 2.5rem 0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '250px', fontWeight: 600, backgroundColor: 'white', cursor: 'pointer' }}
        >
          <option value="">-- Choose Batch --</option>
          {batches.filter(b => studentEnrollments.some(e => String(e.batch_id) === String(b.id))).map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard})</option>)}
        </select>
      </div>

      {loading && <p>Loading syllabus progress...</p>}

      {!loading && selectedBatchId && courses.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Overall Completion</h2>
          <div style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: '20px', height: '24px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: 'var(--primary)', 
                width: `${calculateOverallProgress()}%`,
                transition: 'width 1s ease-in-out',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.75rem', fontWeight: 'bold'
              }}
            >
              {calculateOverallProgress() > 5 ? `${calculateOverallProgress()}%` : ''}
            </div>
          </div>
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
                      readOnly
                      style={{ width: '20px', height: '20px', cursor: 'default', accentColor: '#10B981' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: isCompleted ? '#065F46' : 'var(--primary)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {course.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {course.description}
                    </div>
                    {currentRemarks && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fff', borderLeft: '4px solid #F59E0B', borderRadius: '0 4px 4px 0', fontSize: '0.875rem' }}>
                        <strong>Teacher's Remark:</strong> {currentRemarks}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCompleted ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', fontWeight: 600, fontSize: '0.875rem' }}>
                        <CheckCircle size={16} /> Completed
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#EF4444', fontWeight: 600, fontSize: '0.875rem' }}>
                        <Clock size={16} /> Pending
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

export default StudentSyllabusTracker;
