import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserCheck, Calendar, PhoneCall, Plus, Check, X, ShieldAlert } from 'lucide-react';

const ReceptionistDashboard = () => {
  const [visitors, setVisitors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forms
  const [visitorForm, setVisitorForm] = useState({ name: '', purpose: '', contact: '', remarks: '' });
  const [apptForm, setApptForm] = useState({ visitor_name: '', parent_phone: '', host_name: '', date: new Date().toISOString().split('T')[0], time: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const visitorRes = await axios.get('http://localhost:5000/api/receptionist/visitors');
      const apptRes = await axios.get('http://localhost:5000/api/receptionist/appointments');
      
      setVisitors(visitorRes.data);
      setAppointments(apptRes.data);
    } catch (err) {
      console.error('Receptionist Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    if (!visitorForm.name || !visitorForm.contact) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/receptionist/visitors', visitorForm);
      setVisitorForm({ name: '', purpose: '', contact: '', remarks: '' });
      setMsg({ text: 'Visitor checked in successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to register visitor check-in.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOutVisitor = async (id, remarks) => {
    try {
      await axios.put(`http://localhost:5000/api/receptionist/visitors/${id}`, { remarks });
      setMsg({ text: 'Visitor checked out successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to record check-out.', type: 'danger' });
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!apptForm.visitor_name || !apptForm.host_name) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/receptionist/appointments', apptForm);
      setApptForm({ visitor_name: '', parent_phone: '', host_name: '', date: new Date().toISOString().split('T')[0], time: '', reason: '' });
      setMsg({ text: 'Appointment booked successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to book appointment.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApptStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/receptionist/appointments/${id}`, { status });
      setMsg({ text: `Appointment marked as ${status}!`, type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to update appointment status.', type: 'danger' });
    }
  };

  const handleStudentSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/receptionist/search-student?query=${val}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Student Search Error:', err);
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Reception / Front Desk</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Check in visitors, schedule parent appointments, and search student enrollment files.</p>

      {msg.text && (
        <div style={{
          padding: '1rem',
          backgroundColor: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: msg.type === 'success' ? '#047857' : '#B91C1C',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          fontSize: '0.9rem'
        }}>
          {msg.text}
        </div>
      )}

      {/* Quick Search Student */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Quick Student Search</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Instant lookup to answer parent/admission queries quickly.</p>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleStudentSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            placeholder="Type student name, username, or phone number to search..."
          />
        </div>

        {searchResults.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {searchResults.map(student => {
              const enrollment = student.Enrollments?.[0] || {};
              const course = enrollment.Course || {};
              return (
                <div key={student.id} style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#F9FAFB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{student.name}</strong> 
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({student.username || 'No username'})</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Phone: {student.phone || 'N/A'} | Parent: {student.parent_name || 'N/A'} ({student.parent_phone || 'N/A'})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>Course: {course.title || 'Not Enrolled'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Plan: {enrollment.fee_plan || 'N/A'} | Standard: {student.standard || 'N/A'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Check-In Visitor */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserCheck size={22} color="var(--primary)" /> Visitor Check-In</h2>
          <form onSubmit={handleCreateVisitor} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Visitor Name</label>
              <input
                type="text"
                value={visitorForm.name}
                onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Robert Downey"
                required
              />
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Contact Phone</label>
                <input
                  type="text"
                  value={visitorForm.contact}
                  onChange={(e) => setVisitorForm({ ...visitorForm, contact: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 9888877777"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Purpose of Visit</label>
                <input
                  type="text"
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. General Admission Inquiry"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Remarks / Check-in Notes</label>
              <textarea
                value={visitorForm.remarks}
                onChange={(e) => setVisitorForm({ ...visitorForm, remarks: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '70px' }}
                placeholder="Optional notes"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
              Check-In Visitor
            </button>
          </form>
        </div>

        {/* Visitor log listing */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Checked-In Log</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Active visitors currently on premises.</p>
          <div className="table-container" style={{ flex: 1, maxHeight: '310px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Purpose</th>
                  <th>Check-In</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map(log => (
                  <tr key={log.id}>
                    <td>
                      <strong>{log.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.contact}</div>
                    </td>
                    <td>{log.purpose}</td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(log.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!log.check_out ? (
                        <button className="btn btn-primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleCheckOutVisitor(log.id, 'Checked out safely')}>
                          Check-Out
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Checked Out</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem' }}>
        {/* Book Appointment */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={22} color="var(--secondary)" /> Book Appointment</h2>
          <form onSubmit={handleBookAppointment} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Visitor / Parent Name</label>
              <input
                type="text"
                value={apptForm.visitor_name}
                onChange={(e) => setApptForm({ ...apptForm, visitor_name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Bruce Wayne"
                required
              />
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Parent Contact Phone</label>
                <input
                  type="text"
                  value={apptForm.parent_phone}
                  onChange={(e) => setApptForm({ ...apptForm, parent_phone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 9888877777"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Meeting Host Staff</label>
                <input
                  type="text"
                  value={apptForm.host_name}
                  onChange={(e) => setApptForm({ ...apptForm, host_name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Principal Sarah Connor"
                  required
                />
              </div>
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Date</label>
                <input
                  type="date"
                  value={apptForm.date}
                  onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Time Slot</label>
                <input
                  type="text"
                  value={apptForm.time}
                  onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 10:30 AM"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Reason for Meeting</label>
              <input
                type="text"
                value={apptForm.reason}
                onChange={(e) => setApptForm({ ...apptForm, reason: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Review child attendance report"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center', backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)' }} disabled={loading}>
              Book Meeting Appointment
            </button>
          </form>
        </div>

        {/* Appointment registry */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Scheduled Appointments</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Calendar logs of visitor appointments.</p>
          <div className="table-container" style={{ flex: 1, maxHeight: '420px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Staff Host</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id}>
                    <td>
                      <strong>{appt.visitor_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{appt.parent_phone}</div>
                    </td>
                    <td>{appt.host_name}</td>
                    <td>{new Date(appt.date).toLocaleDateString('en-GB')} at {appt.time}</td>
                    <td>
                      <span style={{
                        color: appt.status === 'completed' ? 'var(--secondary)' : appt.status === 'cancelled' ? '#DC2626' : '#F59E0B',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {appt.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {appt.status === 'scheduled' && (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleUpdateApptStatus(appt.id, 'completed')}>
                            Done
                          </button>
                          <button className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', backgroundColor: '#FEF2F2', color: '#DC2626' }} onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
