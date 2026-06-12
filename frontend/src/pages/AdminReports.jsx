import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BarChart, TrendingUp, Users, Award, Download, Loader2, FileText, PieChart, Filter } from 'lucide-react';
import { STANDARDS } from '../utils/constants';

const AdminReports = () => {
  const [reports, setReports] = useState({
    attendanceReport: [],
    performanceReport: [],
    recentAttendance: [],
    recentResults: []
  });
  const [finance, setFinance] = useState({ totalExpected: 0, totalCollected: 0, totalPending: 0 });
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '', contactEmail: 'info@institute.com', iconName: 'GraduationCap' });

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/settings');
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const standardParam = selectedStandard !== 'All' ? `?standard=${selectedStandard}` : '';
      const [reportRes, financeRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/academic/admin/reports${standardParam}`),
        axios.get(`http://localhost:5000/api/academic/admin/finance/summary${standardParam}`)
      ]);
      setReports(reportRes.data);
      setFinance(financeRes.data);
    } catch (err) {
      console.error('Reports Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStandard]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const downloadReport = (type) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text(`${settings.schoolName || 'Institute Hub'} - Institutional Report`, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${timestamp}`, 105, 27, { align: 'center' });
    
    doc.setDrawColor(37, 99, 235);
    doc.line(20, 35, 190, 35);

    if (type === 'attendance') {
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Global Attendance Summary', 20, 45);
      
      const tableData = reports.attendanceReport.map(st => [
        st.student_name,
        `${st.present_days} / ${st.total_days}`,
        `${st.total_days > 0 ? Math.round((st.present_days / st.total_days) * 100) : 0}%`
      ]);

      doc.autoTable({
        startY: 55,
        head: [['Student Name', 'Present / Total Days', 'Attendance %']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillStyle: [37, 99, 235] }
      });
    } else if (type === 'finance') {
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Financial Revenue & Dues Report', 20, 45);

      const tableData = [
        ['Total Expected Revenue', `$${finance.totalExpected.toLocaleString()}`],
        ['Total Collected Amount', `$${finance.totalCollected.toLocaleString()}`],
        ['Outstanding Dues', `$${finance.totalPending.toLocaleString()}`]
      ];

      doc.autoTable({
        startY: 55,
        head: [['Account Description', 'Amount ($)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Note: This report includes all active enrollments and recorded payments.', 20, doc.lastAutoTable.finalY + 10);
    }

    doc.save(`${(settings.schoolName || 'Report').replace(/\s+/g, '_')}_${type}_report_${Date.now()}.pdf`);
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
      <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      <p style={{ color: 'var(--text-secondary)' }}>Compiling academic data...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Institutional Intelligence</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} color="#64748B" />
            <select 
              value={selectedStandard} 
              onChange={(e) => setSelectedStandard(e.target.value)}
              style={{ border: 'none', outline: 'none', fontWeight: 600, color: '#1E293B', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              <option value="All">All Standards</option>
              {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <span style={{ color: '#64748B', fontSize: '0.875rem' }}>Showing intelligence for {selectedStandard === 'All' ? 'entire institution' : `Standard ${selectedStandard}`}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={() => downloadReport('finance')} className="btn" style={{ 
             background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none',
             display: 'flex', alignItems: 'center', padding: '0.6rem 1.2rem', borderRadius: '8px',
             boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
           }}>
             <Download size={16} style={{marginRight: '0.5rem'}}/> Revenue PDF
           </button>
           <button onClick={() => downloadReport('attendance')} className="btn" style={{ 
             background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', border: 'none',
             display: 'flex', alignItems: 'center', padding: '0.6rem 1.2rem', borderRadius: '8px',
             boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
           }}>
             <Download size={16} style={{marginRight: '0.5rem'}}/> Attendance PDF
           </button>
        </div>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
         <div className="card" style={{ 
           background: 'linear-gradient(135deg, #ffffff, #f8fafc)', borderLeft: '4px solid #3B82F6',
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column'
         }}>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expected</p>
            <h3 style={{ fontSize: '2rem', margin: 0, color: '#1E293B', fontWeight: 800 }}>₹{finance.totalExpected.toLocaleString()}</h3>
         </div>
         <div className="card" style={{ 
           background: 'linear-gradient(135deg, #ffffff, #f8fafc)', borderLeft: '4px solid #10B981',
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column'
         }}>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collected</p>
            <h3 style={{ fontSize: '2rem', margin: 0, color: '#10B981', fontWeight: 800 }}>₹{finance.totalCollected.toLocaleString()}</h3>
         </div>
         <div className="card" style={{ 
           background: 'linear-gradient(135deg, #ffffff, #f8fafc)', borderLeft: '4px solid #EF4444',
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column'
         }}>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Pending</p>
            <h3 style={{ fontSize: '2rem', margin: 0, color: '#EF4444', fontWeight: 800 }}>₹{finance.totalPending.toLocaleString()}</h3>
         </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
        {/* Attendance Insights */}
        <div className="card" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.25rem' }}>
            <div style={{ background: '#EFF6FF', padding: '0.5rem', borderRadius: '8px' }}><TrendingUp size={20} color="#3B82F6" /></div> 
            Attendance Monitoring
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ background: '#F8FAFC' }}>Student</th>
                  <th style={{ background: '#F8FAFC' }}>Present/Total</th>
                  <th style={{ background: '#F8FAFC' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {reports.attendanceReport.map(st => {
                  const perc = st.total_days > 0 ? Math.round((st.present_days / st.total_days) * 100) : 0;
                  return (
                    <tr key={st.student_id}>
                      <td style={{ fontWeight: 600 }}>{st.student_name}</td>
                      <td style={{ color: '#475569' }}>{st.present_days} / {st.total_days}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${perc}%`, height: '100%', background: perc >= 80 ? '#10B981' : perc >= 60 ? '#F59E0B' : '#EF4444', transition: 'width 0.5s ease-out' }}></div>
                          </div>
                          <span style={{ fontWeight: 700, color: perc >= 80 ? '#10B981' : perc >= 60 ? '#F59E0B' : '#EF4444', minWidth: '35px' }}>{perc}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {reports.attendanceReport.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>No attendance data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="card" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.25rem' }}>
            <div style={{ background: '#FFFBEB', padding: '0.5rem', borderRadius: '8px' }}><Award size={20} color="#F59E0B" /></div> 
            Academic Standing
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ background: '#F8FAFC' }}>Student</th>
                  <th style={{ background: '#F8FAFC' }}>Avg. Marks</th>
                  <th style={{ background: '#F8FAFC' }}>Standing</th>
                </tr>
              </thead>
              <tbody>
                {reports.performanceReport.map(st => {
                  const avg = Math.round(st.average_marks);
                  const standing = avg >= 90 ? 'Excellent' : avg >= 75 ? 'Good' : avg >= 50 ? 'Average' : 'Needs Focus';
                  return (
                    <tr key={st.student_id}>
                      <td style={{ fontWeight: 600 }}>{st.student_name}</td>
                      <td style={{ fontWeight: 700, color: '#3B82F6' }}>{avg}%</td>
                      <td>
                        <span style={{ 
                          padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                          background: standing === 'Excellent' ? '#D1FAE5' : standing === 'Good' ? '#DBEAFE' : standing === 'Average' ? '#FEF3C7' : '#FEE2E2',
                          color: standing === 'Excellent' ? '#065F46' : standing === 'Good' ? '#1E40AF' : standing === 'Average' ? '#92400E' : '#991B1B'
                        }}>
                          {standing}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {reports.performanceReport.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>No performance data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', fontSize: '1.25rem' }}>
          <div style={{ background: '#F3E8FF', padding: '0.5rem', borderRadius: '8px' }}><FileText size={20} color="#9333EA"/></div> 
          Recent Academic Activity
        </h2>
        <div className="grid-cols-2" style={{ gap: '3rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Last 5 Attendance Entries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reports.recentAttendance.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{a.student_name}</span>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                    background: a.status === 'present' ? '#D1FAE5' : '#FEE2E2', 
                    color: a.status === 'present' ? '#065F46' : '#991B1B', 
                    textTransform: 'capitalize' 
                  }}>
                    {a.status}
                  </span>
                </div>
              ))}
              {reports.recentAttendance.length === 0 && <div style={{ padding: '1rem', color: '#94A3B8', textAlign: 'center' }}>No recent attendance</div>}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Last 5 Exam Results</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reports.recentResults.map((r, i) => {
                const perc = Math.round((r.marks_obtained / r.total_marks) * 100);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>{r.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.subject}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: perc >= 80 ? '#10B981' : perc >= 50 ? '#3B82F6' : '#EF4444', fontSize: '1rem' }}>
                        {r.marks_obtained}<span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>/{r.total_marks}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {reports.recentResults.length === 0 && <div style={{ padding: '1rem', color: '#94A3B8', textAlign: 'center' }}>No recent results</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
