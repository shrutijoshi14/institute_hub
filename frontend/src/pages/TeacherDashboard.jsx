import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, FileText, Send, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div>
      <h1 className="page-title">Teacher Dashboard</h1>
      
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#F8FAFC' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
          {(user.name || 'T').charAt(0)}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Welcome, {user.name}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Manage your daily classes, attendance, and student performance.</p>
        </div>
      </div>

      <div className="grid-cols-4" style={{ gap: '1rem' }}>
        <div className="card stat-card" onClick={() => navigate('/admin/attendance')} style={{ cursor: 'pointer', border: '1px solid #DBEAFE' }}>
          <div className="stat-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}>
            <ClipboardList size={24} />
          </div>
          <div className="stat-info">
            <h3>Attendance</h3>
            <div className="value" style={{ fontSize: '1.1rem', marginTop: '4px', color: 'var(--text-primary)' }}>Mark Register</div>
          </div>
        </div>
        
        <div className="card stat-card" onClick={() => navigate('/admin/results')} style={{ cursor: 'pointer', border: '1px solid #D1FAE5' }}>
          <div className="stat-icon" style={{ backgroundColor: '#D1FAE5', color: '#10B981' }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <h3>Examinations</h3>
            <div className="value" style={{ fontSize: '1.1rem', marginTop: '4px', color: 'var(--text-primary)' }}>Upload Marks</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => navigate('/assignments')} style={{ cursor: 'pointer', border: '1px solid #F3E8FF' }}>
          <div className="stat-icon" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
            <Send size={24} />
          </div>
          <div className="stat-info">
            <h3>Assignments</h3>
            <div className="value" style={{ fontSize: '1.1rem', marginTop: '4px', color: 'var(--text-primary)' }}>Manage Tasks</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => navigate('/notices')} style={{ cursor: 'pointer', border: '1px solid #FEF3C7' }}>
          <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Notices</h3>
            <div className="value" style={{ fontSize: '1.1rem', marginTop: '4px', color: 'var(--text-primary)' }}>Broadcast</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Calendar size={20} color="var(--primary)" /> Today's Schedule</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '1rem', borderLeft: '4px solid var(--primary)', backgroundColor: '#F8FAFC', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>10:00 AM - 11:30 AM</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary)', padding: '0.1rem 0.5rem', backgroundColor: '#DBEAFE', borderRadius: '999px' }}>Lecture</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Mathematics - Class 11 (Batch A)</div>
            </div>
            
            <div style={{ padding: '1rem', borderLeft: '4px solid #10B981', backgroundColor: '#F8FAFC', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>12:00 PM - 01:30 PM</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10B981', padding: '0.1rem 0.5rem', backgroundColor: '#D1FAE5', borderRadius: '999px' }}>Practical</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>Physics Lab - Class 12 (Batch B)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
