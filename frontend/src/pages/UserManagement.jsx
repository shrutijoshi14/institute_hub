import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Shield, User, Mail, Phone, Loader2, Search, Filter, CheckCircle, XCircle, AlertCircle, Info, X, KeyRound } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const handleResetPassword = async (id, name) => {
    showToast('Resetting password...', 'info');
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/users/${id}/reset-password`);
      const { username, tempPassword } = res.data;
      setCreatedCredentials({
        name,
        username,
        password: tempPassword
      });
      showToast('Password reset successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to reset password.', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (id, data) => {
    showToast('Updating user settings...', 'info');
    try {
      await axios.put(`http://localhost:5000/api/auth/users/${id}/status`, data);
      showToast(`User updated: ${data.status || data.role}`, 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Error updating user.', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '1rem' }}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.95rem',
          animation: 'slideIn 0.3s ease-out',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <XCircle size={20} /> : <Info size={20} />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            style={{ background: 'none', border: 'none', color: 'white', display: 'flex', padding: 0, cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Portal Access Control</h1>
      </div>

      {msg && (
        <div style={{ padding: '1rem', backgroundColor: msg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: msg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by name, email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white' }}
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted (Soft Delete)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <User size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          <div className="email-wrap" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email} | @{user.username || 'no-username'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdate(user.id, { role: e.target.value })}
                        style={{ padding: '0.4rem 2.5rem 0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem', minWidth: '110px', backgroundColor: 'white', cursor: 'pointer' }}
                      >
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={user.status}
                        onChange={(e) => handleUpdate(user.id, { status: e.target.value })}
                        style={{
                          padding: '0.4rem 2rem 0.4rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor:
                            user.status === 'active' ? '#DCFCE7' :
                              user.status === 'pending' ? '#FEF3C7' :
                                user.status === 'inactive' ? '#F3F4F6' :
                                  user.status === 'blocked' ? '#FEE2E2' :
                                    user.status === 'suspended' ? '#FEE2E2' :
                                      user.status === 'archived' ? '#F3E8FF' : '#E2E8F0',
                          color:
                            user.status === 'active' ? '#166534' :
                              user.status === 'pending' ? '#92400E' :
                                user.status === 'inactive' ? '#374151' :
                                  user.status === 'blocked' ? '#991B1B' :
                                    user.status === 'suspended' ? '#991B1B' :
                                      user.status === 'archived' ? '#6B21A8' : '#475569'
                        }}
                      >
                        <option value="pending">PENDING</option>
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                        <option value="blocked">BLOCKED</option>
                        <option value="suspended">SUSPENDED</option>
                        <option value="archived">ARCHIVED</option>
                        <option value="deleted">DELETED</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {user.status !== 'active' && (
                          <button
                            onClick={() => handleUpdate(user.id, { status: 'active' })}
                            className="btn"
                            style={{ padding: '0.4rem', backgroundColor: '#DCFCE7', border: 'none', color: '#166534' }}
                            title="Approve / Activate"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button
                            onClick={() => handleUpdate(user.id, { status: 'suspended' })}
                            className="btn"
                            style={{ padding: '0.4rem', backgroundColor: '#FEE2E2', border: 'none', color: '#991B1B' }}
                            title="Suspend Access"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {user.status === 'suspended' && (
                          <button
                            onClick={() => handleUpdate(user.id, { status: 'active' })}
                            className="btn"
                            style={{ padding: '0.4rem', backgroundColor: '#DBEAFE', border: 'none', color: '#1E40AF' }}
                            title="Reactivate"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          className="btn"
                          style={{ padding: '0.4rem', backgroundColor: '#FEF3C7', border: 'none', color: '#B45309' }}
                          title="Reset Password (Free)"
                        >
                          <KeyRound size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createdCredentials && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>
                <CheckCircle size={24} color="#10B981" />
                <span>Temporary Credentials Generated</span>
              </h3>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9CA3AF', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => setCreatedCredentials(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                The password has been reset. Below are the new login credentials for the account.
                <strong style={{ color: '#EF4444', display: 'block', marginTop: '0.5rem' }}>
                  ⚠️ WARNING: This is the ONLY time this temporary password will be displayed. Copy or print it now; it cannot be retrieved later.
                </strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.0rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Login Details</span>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}><strong>Name:</strong> {createdCredentials.name}</div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}><strong>Username:</strong> <code style={{ backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>{createdCredentials.username}</code></div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}><strong>Password:</strong> <code style={{ backgroundColor: '#F1F5F9', color: '#0F172A', padding: '2px 6px', borderRadius: '4px', border: '1px dashed #CBD5E1' }}>{createdCredentials.password}</code></div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn"
                style={{ border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#334155' }}
                onClick={() => {
                  const text = `CREDENTIALS RESET\nName: ${createdCredentials.name}\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  alert('Credentials copied to clipboard!');
                }}
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                  <html>
                  <head><title>Credentials Print</title></head>
                  <body style="font-family: sans-serif; padding: 40px;">
                    <h2>Temporary Account Credentials</h2>
                    <hr />
                    <p><strong>Name:</strong> ${createdCredentials.name}</p>
                    <p><strong>Username:</strong> ${createdCredentials.username}</p>
                    <p><strong>Temporary Password:</strong> ${createdCredentials.password}</p>
                    <p style="color: #EF4444;">Note: Password change will be forced on first login.</p>
                    <script>window.print();</script>
                  </body>
                  </html>
                `);
                  printWindow.document.close();
                }}
              >
                Print
              </button>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#1E293B', color: 'white' }}
                onClick={() => setCreatedCredentials(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
