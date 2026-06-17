import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, DollarSign, MessageSquare, Award, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    newEnquiries: 0,
    totalRevenue: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await axios.get('http://localhost:5000/api/fees/stats');
        const regRes = await axios.get('http://localhost:5000/api/registration');
        const courseRes = await axios.get('http://localhost:5000/api/courses').catch(() => ({ data: [] }));
        
        setStats({
          totalStudents: statsRes.data.totalStudents || 0,
          activeCourses: courseRes.data.length || 0,
          newEnquiries: regRes.data.length || 0,
          totalRevenue: statsRes.data.totalRevenue || 0
        });
        
        setRecentRegistrations(regRes.data.slice(0, 5));
      } catch (err) {
        console.error('Dashboard Fetch Error:', err);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div>
      <h1 className="page-title">Dashboard Overview</h1>
      
      <div className="grid-cols-4">
        <div className="card stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <div className="value">{stats.totalStudents}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)' }}>
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Courses</h3>
            <div className="value">{stats.activeCourses}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <MessageSquare size={24} />
          </div>
          <div className="stat-info">
            <h3>New Enquiries</h3>
            <div className="value">{stats.newEnquiries}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <div className="value">₹{stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2">
        <div className="card">
          <h2>Recent Applications</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Course Interest</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.map(reg => (
                  <tr key={reg.id}>
                    <td>{reg.name}</td>
                    <td>{reg.course_interest}</td>
                    <td>{reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
                    <td>
                      <span style={{ 
                        color: reg.status === 'pending' ? '#F59E0B' : 'var(--secondary)', 
                        fontWeight: 500,
                        textTransform: 'capitalize'
                      }}>
                        {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentRegistrations.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No recent registrations found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={22} color="#F59E0B" /> Academic Standing</h2>
             <button className="btn" onClick={() => navigate('/admin/reports')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Analyze <ChevronRight size={14}/></button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Overall class performance and identity focus areas.</p>
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <button className="btn" style={{ justifyContent: 'center', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} onClick={() => navigate('/admin/reports')}>Performance Report</button>
              <button className="btn" style={{ justifyContent: 'center', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} onClick={() => navigate('/admin/reports')}>Attendance Report</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Quick Administration</h2>
        <div className="flex-row-responsive" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '1rem' }} onClick={() => navigate('/registrations')}>
            <Users size={18} /> Registrations
          </button>
          <button className="btn" style={{ flex: 1, justifyContent: 'center', padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)' }} onClick={() => navigate('/admin/fees')}>
            <DollarSign size={18} /> Financials
          </button>
          <button className="btn" style={{ flex: 1, justifyContent: 'center', padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)' }} onClick={() => navigate('/syllabus')}>
            <GraduationCap size={18} /> Syllabus
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
