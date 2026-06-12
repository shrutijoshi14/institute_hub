import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Edit3, Megaphone, IndianRupee } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    attendancePerc: 0,
    pendingTasks: 0,
    courseCount: 0,
    latestNotice: null,
    totalPaid: 0,
    totalPending: 0
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/academic/student/dashboard/${user.id}`);
        setStats(res.data);
      } catch (err) {
        console.error('Student Dashboard Fetch Error:', err);
      }
    };
    fetchStudentData();
  }, [user.id]);

  return (
    <div>
      <h1 className="page-title">Welcome back!</h1>
      
      <div className="grid-cols-4">
        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Attendance</h3>
            <div className="value" style={{ color: 'white' }}>{stats.attendancePerc}%</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
            <Edit3 size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending Tasks</h3>
            <div className="value">{stats.pendingTasks}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h3>Courses</h3>
            <div className="value">{stats.courseCount} Active</div>
          </div>
        </div>
        <div className="card stat-card" onClick={() => navigate('/student/fees')} style={{ cursor: 'pointer', background: stats.totalPending > 0 ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Fees Pending</h3>
            <div className="value" style={{ color: 'white' }}>₹{stats.totalPending}</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2">
         <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Megaphone size={20} color="var(--primary)" /> Latest Notice</h2>
            {stats.latestNotice ? (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{stats.latestNotice.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{stats.latestNotice.content}</p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Posted on {stats.latestNotice.created_at ? new Date(stats.latestNotice.created_at).toLocaleDateString('en-GB') : 'N/A'}
                </div>
              </div>
            ) : (
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>No notices posted yet.</p>
            )}
         </div>

         <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IndianRupee size={20} color="#10B981" /> Fee Standing & Quick Actions</h2>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Total Course Fees</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{stats.totalFees || 0}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Total Paid</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>₹{stats.totalPaid || 0}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: stats.totalPending > 0 ? '#FEF2F2' : '#F0FDF4', borderRadius: '8px', border: stats.totalPending > 0 ? '1px solid #FECACA' : '1px solid #BBF7D0' }}>
                  <span style={{ fontWeight: 500, color: stats.totalPending > 0 ? '#991B1B' : '#065F46' }}>Total Pending</span>
                  <span style={{ fontWeight: 700, color: stats.totalPending > 0 ? '#EF4444' : '#10B981' }}>₹{stats.totalPending || 0}</span>
               </div>
               <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/student/fees')}>
                     Pay Fees Online
                  </button>
                  <button className="btn" style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--border-color)' }} onClick={() => navigate('/assignments')}>
                     Assignments
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
