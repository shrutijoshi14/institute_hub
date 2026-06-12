import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, ShieldAlert, Users, DollarSign, Plus, Check, Trash2, Clock } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ branchCount: 0, adminCount: 0, studentCount: 0, globalRevenue: 0 });
  const [branches, setBranches] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newBranch, setNewBranch] = useState({ name: '', location: '', contact_email: '' });
  const [editingBranch, setEditingBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const statsRes = await axios.get('http://localhost:5000/api/super-admin/stats');
      const branchRes = await axios.get('http://localhost:5000/api/super-admin/branches');
      const adminRes = await axios.get('http://localhost:5000/api/super-admin/admins');
      const logsRes = await axios.get('http://localhost:5000/api/super-admin/audit-logs');

      setStats(statsRes.data);
      setBranches(branchRes.data);
      setAdmins(adminRes.data);
      setAuditLogs(logsRes.data);
    } catch (err) {
      console.error('Super Admin Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.location) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/super-admin/branches', newBranch);
      setNewBranch({ name: '', location: '', contact_email: '' });
      setMsg({ text: 'Branch created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create branch.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    if (!editingBranch.name || !editingBranch.location) return;
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/super-admin/branches/${editingBranch.id}`, editingBranch);
      setEditingBranch(null);
      setMsg({ text: 'Branch updated successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to update branch.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await axios.get(`http://localhost:5000/api/super-admin/branches/delete/${id}`);
      setMsg({ text: 'Branch deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete branch.', type: 'danger' });
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Super Admin Portal</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Global multi-branch network and server administrative console.</p>

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

      {/* Global Stats */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
            <Building size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Branches</h3>
            <div className="value">{stats.branchCount}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--secondary)' }}>
            <ShieldAlert size={24} />
          </div>
          <div className="stat-info">
            <h3>System Admins</h3>
            <div className="value">{stats.adminCount}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Enrolled</h3>
            <div className="value">{stats.studentCount}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Global Revenue</h3>
            <div className="value">₹{stats.globalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Branch CRUD */}
        <div className="card">
          <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
          <form onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Branch Name</label>
              <input
                type="text"
                value={editingBranch ? editingBranch.name : newBranch.name}
                onChange={(e) => editingBranch ? setEditingBranch({ ...editingBranch, name: e.target.value }) : setNewBranch({ ...newBranch, name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Westside Campus"
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Location / Address</label>
              <input
                type="text"
                value={editingBranch ? editingBranch.location : newBranch.location}
                onChange={(e) => editingBranch ? setEditingBranch({ ...editingBranch, location: e.target.value }) : setNewBranch({ ...newBranch, location: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Los Angeles, CA"
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Contact Email</label>
              <input
                type="email"
                value={editingBranch ? editingBranch.contact_email : newBranch.contact_email}
                onChange={(e) => editingBranch ? setEditingBranch({ ...editingBranch, contact_email: e.target.value }) : setNewBranch({ ...newBranch, contact_email: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. westside@portal.com"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
                {editingBranch ? 'Save Updates' : 'Create Branch'}
              </button>
              {editingBranch && (
                <button type="button" className="btn" style={{ flex: 1, height: '3rem', borderRadius: '12px', justifyContent: 'center', backgroundColor: '#F3F4F6' }} onClick={() => setEditingBranch(null)}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Branches Directory */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Branch Network Directory</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Active branches hosting administrative databases.</p>
          <div className="table-container" style={{ flex: 1 }}>
            <table>
              <thead>
                <tr>
                  <th>Branch ID</th>
                  <th>Branch Name</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id}>
                    <td><strong>#{b.id}</strong></td>
                    <td>{b.name}</td>
                    <td>{b.location}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn" style={{ padding: '0.4rem', minWidth: 'auto', backgroundColor: '#EEF2FF', color: '#4F46E5' }} onClick={() => setEditingBranch(b)}>Edit</button>
                        <button className="btn" style={{ padding: '0.4rem', minWidth: 'auto', backgroundColor: '#FEF2F2', color: '#DC2626' }} onClick={() => handleDeleteBranch(b.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={20} color="var(--primary)" /> Database Audit Logs</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Real-time database query and schema alteration audits.</p>
        <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Affected Table</th>
                <th>Record ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString('en-GB')}</td>
                  <td><span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{log.action}</span></td>
                  <td><code>{log.table_name || 'N/A'}</code></td>
                  <td>{log.record_id ? `#${log.record_id}` : 'N/A'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{log.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>No audit logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
