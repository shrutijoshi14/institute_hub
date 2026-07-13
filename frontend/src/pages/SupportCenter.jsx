import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  LifeBuoy, Plus, Check, Trash2, Clock, Settings, AlertCircle, 
  HelpCircle, MessageSquare, Bug, Sparkles, Filter, CheckCircle, RefreshCw 
} from 'lucide-react';

const SupportCenter = () => {
  const { user, role } = useAuth();
  const userId = user?.id;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Support Ticket'
  });

  const isAdminOrSuper = ['admin', 'super-admin'].includes(role);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = isAdminOrSuper 
        ? 'http://localhost:5000/api/extra-academic/complaints'
        : `http://localhost:5000/api/extra-academic/complaints/user/${userId}`;
      const res = await axios.get(url);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to fetch support records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTickets();
    }
  }, [userId, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setMsg({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('http://localhost:5000/api/extra-academic/complaints', {
        user_id: userId,
        title: form.title,
        description: form.description,
        category: form.category
      });

      setForm({ title: '', description: '', category: 'Support Ticket' });
      setMsg({ text: 'Support request submitted successfully!', type: 'success' });
      fetchTickets();
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to submit request.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/extra-academic/complaints/${id}`, {
        status: newStatus
      });
      setMsg({ text: 'Status updated successfully.', type: 'success' });
      fetchTickets();
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to update status.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/extra-academic/complaints/${id}`);
      setMsg({ text: 'Record deleted successfully.', type: 'success' });
      fetchTickets();
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to delete record.', type: 'error' });
    }
  };

  // Filter logs
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reporter_name && t.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Category Helpers
  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Support Ticket': return <LifeBuoy size={16} color="#3B82F6" />;
      case 'Complaint': return <AlertCircle size={16} color="#EF4444" />;
      case 'Feature Request': return <Sparkles size={16} color="#EC4899" />;
      case 'Bug Report': return <Bug size={16} color="#F59E0B" />;
      default: return <HelpCircle size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return { bg: '#DCFCE7', text: '#15803D' };
      case 'in-progress': return { bg: '#FEF9C3', text: '#A16207' };
      case 'pending':
      default:
        return { bg: '#FFE4E6', text: '#B91C1C' };
    }
  };

  return (
    <div className="fade-in-pane" style={{ padding: '2rem' }}>
      
      {/* Premium Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '2.5rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LifeBuoy size={32} /> Helpdesk & Support Center
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.95rem' }}>
            {isAdminOrSuper 
              ? 'Oversee, assign status, and resolve user tickets, feature requests, bug reports, and complaints.'
              : 'Submit support requests, report bugs, file complaints, or request new features.'}
          </p>
        </div>
        <div style={{ fontSize: '5rem', opacity: 0.1, position: 'absolute', right: '1rem', bottom: '-1rem' }}>
          <LifeBuoy size={120} />
        </div>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
          {msg.text}
        </div>
      )}

      {/* Stats Board (For Admins) */}
      {isAdminOrSuper && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #3B82F6' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Logged Items</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{tickets.length}</span>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #EF4444' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unresolved (Pending)</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626' }}>{tickets.filter(t => t.status === 'pending').length}</span>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #F59E0B' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>In Progress</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706' }}>{tickets.filter(t => t.status === 'in-progress').length}</span>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #10B981' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Resolved</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>{tickets.filter(t => t.status === 'resolved').length}</span>
          </div>
        </div>
      )}

      {/* Main Split Grid */}
      <div 
        className={isAdminOrSuper ? "" : "support-grid"} 
        style={isAdminOrSuper ? { display: 'grid', gridTemplateColumns: '1fr' } : {}}
      >
        
        {/* Creator Form Column (Hidden for Admin/Super-Admin) */}
        {!isAdminOrSuper && (
          <div className="card" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Log a Request</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.8rem' }}>Type of Request</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                >
                  <option value="Support Ticket">Support Ticket</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.8rem' }}>Subject / Title</label>
                <input 
                  type="text"
                  placeholder="Summarize the issue..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.8rem' }}>Detailed Description</label>
                <textarea 
                  placeholder="Describe your issue or request in detail..."
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', resize: 'vertical' }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={submitting}
              >
                Submit Request
              </button>
            </form>
          </div>
        )}

        {/* Directory Listings Column */}
        <div className="card" style={{ padding: '1.5rem' }}>
          
          {/* Filters TopBar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              {isAdminOrSuper ? 'All Registered Support Tickets' : 'My Ticket History'}
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', width: '180px' }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: '0.45rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="All">All Categories</option>
                <option value="Support Ticket">Tickets</option>
                <option value="Complaint">Complaints</option>
                <option value="Feature Request">Feature Requests</option>
                <option value="Bug Report">Bug Reports</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.45rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', backgroundColor: '#FFFFFF' }}
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <button 
                className="btn" 
                onClick={fetchTickets}
                style={{ padding: '0.45rem', minWidth: 'auto', display: 'flex', alignItems: 'center' }}
                title="Refresh logs"
              >
                <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem' }}>Category</th>
                  <th>Title</th>
                  <th>Description</th>
                  {isAdminOrSuper && <th>Reporter</th>}
                  <th>Status</th>
                  <th>Logged Date</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => {
                  const sColor = getStatusColor(t.status);
                  return (
                    <tr key={t.id}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          {getCategoryIcon(t.category)}
                          <span>{t.category || 'General'}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.title}</td>
                      <td style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-secondary)', 
                        maxWidth: '220px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }} title={t.description}>
                        {t.description}
                      </td>
                      {isAdminOrSuper && (
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{t.reporter_name || 'System User'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                              Role: {t.reporter_role || 'user'}
                            </span>
                          </div>
                        </td>
                      )}
                      <td>
                        {isAdminOrSuper ? (
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                            style={{ 
                              padding: '0.2rem 0.4rem', 
                              borderRadius: '6px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              backgroundColor: sColor.bg, 
                              color: sColor.text,
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        ) : (
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '6px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            backgroundColor: sColor.bg, 
                            color: sColor.text,
                            textTransform: 'uppercase'
                          }}>
                            {t.status}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(t.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '0.25rem', minWidth: 'auto', backgroundColor: '#FEF2F2', color: '#DC2626' }}
                          onClick={() => handleDelete(t.id)}
                          title="Delete Request"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={isAdminOrSuper ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                      No support tickets, complaints, or bug reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SupportCenter;
