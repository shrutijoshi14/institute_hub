import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Archive, RotateCcw, AlertCircle, Database, CheckCircle, HelpCircle } from 'lucide-react';

const ArchiveSystem = () => {
  const [stats, setStats] = useState({});
  const [archiveConfig, setArchiveConfig] = useState({ type: 'attendance', beforeDate: '' });
  const [restoreConfig, setRestoreConfig] = useState({ type: 'attendance' });
  const [loading, setLoading] = useState(false);
  const [confirmArchival, setConfirmArchival] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/archive/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Fetch Archive Stats Error:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRunArchive = async (e) => {
    e.preventDefault();
    if (!confirmArchival) {
      setMsg({ text: 'Please check the confirmation box to proceed.', type: 'danger' });
      return;
    }
    if (archiveConfig.type !== 'batches' && !archiveConfig.beforeDate) {
      setMsg({ text: 'Please select a cut-off date.', type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/archive/run', archiveConfig);
      setMsg({ text: response.data.msg, type: 'success' });
      setConfirmArchival(false);
      setArchiveConfig({ ...archiveConfig, beforeDate: '' });
      fetchStats();
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Archiving failed.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreArchive = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to restore all archived ${restoreConfig.type} records back to active status?`)) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/archive/restore', restoreConfig);
      setMsg({ text: response.data.msg, type: 'success' });
      fetchStats();
    } catch (err) {
      setMsg({ text: 'Restoration failed.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const moduleNames = {
    attendance: 'Attendance Registers',
    results: 'Results & Examination Marks',
    fees: 'Fee Payment Receipts',
    assignments: 'Homework & Assignments',
    batches: 'Academic Batches & Classes'
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Database Archive Management</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Logical cold storage archiving system. Moving historical records improves database query latency while keeping historical logs fully searchable.
      </p>

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

      {/* Info Alert */}
      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        color: '#1E40AF',
        padding: '1rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'start',
        gap: '0.75rem'
      }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Performance Optimization Strategy:</strong> Standard daily listings automatically filter out archived data (`is_archived = 0`), which keeps indices small and search speeds extremely fast. When searching student profiles or historical files, the query context dynamically includes archived rows automatically.
        </div>
      </div>

      {/* Volume Stats */}
      <h2>SaaS Database Volume Partitioning</h2>
      <div className="grid-cols-5" style={{ gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
        {Object.entries(moduleNames).map(([key, label]) => {
          const item = stats[key] || { active: 0, archived: 0 };
          return (
            <div key={key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Database size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Active Rows:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{item.active}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  <span>Archived Rows:</span>
                  <strong style={{ color: 'var(--secondary)' }}>{item.archived}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem' }}>
        {/* Run Archiver Form */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Archive size={20} color="var(--primary)" /> Run Archive Execution</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Pack records older than the target cut-off date into the historical cold partition.
          </p>
          <form onSubmit={handleRunArchive} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Select Target Module</label>
              <select
                value={archiveConfig.type}
                onChange={(e) => setArchiveConfig({ ...archiveConfig, type: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                required
              >
                {Object.entries(moduleNames).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {archiveConfig.type !== 'batches' && (
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Cut-off Date (Exclude newer records)</label>
                <input
                  type="date"
                  value={archiveConfig.beforeDate}
                  onChange={(e) => setArchiveConfig({ ...archiveConfig, beforeDate: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="confirm"
                checked={confirmArchival}
                onChange={(e) => setConfirmArchival(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <label htmlFor="confirm" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                I confirm that I want to logically archive matching records. This will exclude them from standard list queries but preserve them inside historical database searches.
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading || !confirmArchival}>
              Execute Archiver
            </button>
          </form>
        </div>

        {/* Restore Archives Form */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><RotateCcw size={20} color="var(--secondary)" /> Restore Active Partition</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Bring logically archived data back into the active database partitions.
          </p>
          <form onSubmit={handleRestoreArchive} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Select Target Module to Restore</label>
              <select
                value={restoreConfig.type}
                onChange={(e) => setRestoreConfig({ ...restoreConfig, type: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                required
              >
                {Object.entries(moduleNames).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              borderRadius: '12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>Warning: Restoring archived rows increases the active table query size.</span>
            </div>

            <button type="submit" className="btn" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center', backgroundColor: '#F3F4F6', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} disabled={loading}>
              Restore Archived Records
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArchiveSystem;
