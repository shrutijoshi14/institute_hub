import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, IndianRupee, Megaphone, CheckCircle } from 'lucide-react';

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    latestNotice: null,
    totalPending: 0,
    totalPaid: 0,
    totalFees: 0,
    studentName: ''
  });

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const childId = user.childId;
        if (!childId) {
            console.error("Parent has no linked child ID");
            return;
        }
        
        const feeRes = await axios.get(`http://localhost:5000/api/fees/summary/${childId}`).catch(() => ({data: {totalPending: 0, totalPaid: 0, totalFees: 0, studentName: ''}}));
        const noticeRes = await axios.get('http://localhost:5000/api/academic/notices');
        
        setStats({
          latestNotice: noticeRes.data[0] || null,
          totalPending: feeRes.data.totalPending,
          totalPaid: feeRes.data.totalPaid,
          totalFees: feeRes.data.totalFees,
          studentName: feeRes.data.studentName
        });
      } catch (err) {
        console.error('Parent Dashboard Fetch Error:', err);
      }
    };
    fetchParentData();
  }, [user.id]);

  return (
    <div>
      <h1 className="page-title">Parent Dashboard</h1>
      {stats.studentName && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '-1.5rem' }}>
          Linked Child: <strong>{stats.studentName}</strong> (Student ID: AMB-{user.childId.toString().padStart(4, '0')})
        </p>
      )}
      
      <div className="grid-cols-4">
        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: 'white' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Total Fees</h3>
            <div className="value" style={{ color: 'white' }}>₹{stats.totalFees}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Fees Paid</h3>
            <div className="value" style={{ color: 'white' }}>₹{stats.totalPaid}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ background: stats.totalPending > 0 ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : '#F1F5F9', color: stats.totalPending > 0 ? 'white' : 'inherit' }}>
          <div className="stat-icon" style={{ backgroundColor: stats.totalPending > 0 ? 'rgba(255,255,255,0.2)' : '#E2E8F0', color: stats.totalPending > 0 ? 'white' : 'inherit' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: stats.totalPending > 0 ? 'rgba(255,255,255,0.9)' : 'inherit' }}>Fees Pending</h3>
            <div className="value" style={{ color: stats.totalPending > 0 ? 'white' : 'inherit' }}>₹{stats.totalPending}</div>
          </div>
        </div>
        <div className="card stat-card" onClick={() => navigate('/student/results')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h3>Child Marks</h3>
            <div className="value" style={{ fontSize: '1rem', marginTop: '4px', color: 'var(--secondary)' }}>View Report</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2">
         <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Megaphone size={20} color="var(--primary)" /> Institute Notice</h2>
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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={20} color="#10B981" /> Communication & Quick Links</h2>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <p style={{ color: 'var(--text-secondary)' }}>Stay updated with your child's progress or make a quick fee payment online.</p>
               <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/student/fees')}>Pay Pending Fees</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
