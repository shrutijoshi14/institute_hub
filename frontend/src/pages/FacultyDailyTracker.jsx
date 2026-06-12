import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Users, CheckCircle, Save, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FacultyDailyTracker = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Completed');
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/batches');
        setBatches(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      const batch = batches.find(b => String(b.id) === String(selectedBatch));
      if (batch) {
        axios.get(`http://localhost:5000/api/daily-tracker/subjects?standard=${batch.standard}&board=${batch.board}`)
          .then(res => {
            setSubjects(res.data);
            setSelectedSubject('');
            setSelectedTopic('');
            setTopics([]);
          })
          .catch(console.error);

        axios.get(`http://localhost:5000/api/daily-tracker/students/${batch.id}`)
          .then(res => {
            setStudents(res.data);
            const initialAtt = {};
            res.data.forEach(s => { initialAtt[s.id] = 'present'; });
            setAttendance(initialAtt);
          })
          .catch(console.error);
      }
    } else {
      setSubjects([]);
      setStudents([]);
      setTopics([]);
    }
  }, [selectedBatch, batches]);

  useEffect(() => {
    if (selectedBatch && selectedSubject) {
      const batch = batches.find(b => String(b.id) === String(selectedBatch));
      if (batch) {
        axios.get(`http://localhost:5000/api/daily-tracker/topics?standard=${batch.standard}&board=${batch.board}&subject=${selectedSubject}`)
          .then(res => {
            setTopics(res.data);
            setSelectedTopic('');
          })
          .catch(console.error);
      }
    } else {
      setTopics([]);
    }
  }, [selectedSubject, selectedBatch, batches]);

  const handleAttendanceChange = (studentId, attStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: attStatus }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch || !selectedTopic) {
      setMsg('❌ Please select a Batch, Subject, and Topic.');
      return;
    }

    setLoading(true);
    try {
      const attArray = students.map(s => ({
        student_id: s.id,
        status: attendance[s.id] || 'present'
      }));

      await axios.post('http://localhost:5000/api/daily-tracker/submit', {
        batch_id: selectedBatch,
        course_id: selectedTopic,
        date: today,
        status,
        remarks,
        attendance: attArray
      });

      setMsg('✅ Daily Progress and Attendance saved successfully!');
      setTimeout(() => setMsg(''), 4000);
      
      // Reset form slightly to allow next entry easily
      setSelectedTopic('');
      setRemarks('');
      
    } catch (err) {
      console.error(err);
      setMsg('❌ Failed to save progress. Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Daily Class Tracker</h1>
      </div>

      {msg && (
        <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEF2F2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500 }}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Side: Topic Selection */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="var(--primary)" /> Class Details
          </h2>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Batch</label>
            <select 
              value={selectedBatch} 
              onChange={e => setSelectedBatch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}
            >
              <option value="">-- Choose Batch --</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.standard}) - {b.timing}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Subject</label>
            <select 
              value={selectedSubject} 
              onChange={e => setSelectedSubject(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}
              disabled={!selectedBatch}
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Topic Completed Today</label>
            <select 
              value={selectedTopic} 
              onChange={e => setSelectedTopic(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary)', outline: 'none', backgroundColor: '#F0F9FF' }}
              disabled={!selectedSubject}
            >
              <option value="">-- Choose Topic/Chapter --</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Progress Status</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#F8FAFC' }}
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress (Partially Done)</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Remarks / Homework Notes</label>
            <textarea 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}
              rows="3"
              placeholder="e.g. Completed exercise 1.1. Homework given."
            ></textarea>
          </div>

        </div>

        {/* Right Side: Attendance */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--primary)" /> Attendance for {today}
          </h2>

          {!selectedBatch ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
              Please select a batch to view enrolled students.
            </div>
          ) : students.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B', padding: '2rem', textAlign: 'center' }}>
              No students are currently enrolled in this batch.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600 }}>Total Enrolled: {students.length}</span>
                <span style={{ fontWeight: 600, color: '#10B981' }}>Present: {Object.values(attendance).filter(v => v === 'present').length}</span>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem', maxHeight: '400px' }}>
                {students.map(student => (
                  <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.username}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        type="button"
                        onClick={() => handleAttendanceChange(student.id, 'present')}
                        style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #10B981', background: attendance[student.id] === 'present' ? '#10B981' : 'white', color: attendance[student.id] === 'present' ? 'white' : '#10B981', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        P
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                        style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #EF4444', background: attendance[student.id] === 'absent' ? '#EF4444' : 'white', color: attendance[student.id] === 'absent' ? 'white' : '#EF4444', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        A
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleAttendanceChange(student.id, 'late')}
                        style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #F59E0B', background: attendance[student.id] === 'late' ? '#F59E0B' : 'white', color: attendance[student.id] === 'late' ? 'white' : '#F59E0B', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        L
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
             <button 
               type="submit" 
               className="btn btn-primary" 
               style={{ width: '100%', height: '3.5rem', fontSize: '1rem', display: 'flex', justifyContent: 'center' }}
               disabled={loading || !selectedTopic}
             >
               {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} style={{marginRight:'0.5rem'}}/> Submit Daily Report</>}
             </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default FacultyDailyTracker;
