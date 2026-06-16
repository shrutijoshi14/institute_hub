import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Shield, User, Mail, Phone, Loader2, Search, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

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
    try {
      await axios.put(`http://localhost:5000/api/auth/users/${id}/status`, data);
      setMsg(`✅ User updated: ${data.status || data.role}`);
      fetchUsers();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setMsg('❌ Error updating user.');
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
              <option value="suspended">Suspended</option>
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
                      <span style={{ 
                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
                        backgroundColor: user.status === 'active' ? '#DCFCE7' : user.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                        color: user.status === 'active' ? '#166534' : user.status === 'pending' ? '#92400E' : '#991B1B'
                      }}>
                        {user.status.toUpperCase()}
                      </span>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
