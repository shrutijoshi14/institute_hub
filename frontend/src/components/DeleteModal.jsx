import React, { useEffect } from 'react';
import { XCircle, AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  useEffect(() => {
    const handleEvents = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleEvents);
    return () => window.removeEventListener('keydown', handleEvents);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header" style={{ justifyContent: 'flex-end', borderBottom: 'none', paddingBottom: 0 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{title || 'Confirm Deletion'}</h2>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
            {message || 'Are you sure you want to permanently delete this record? This action cannot be undone.'}
          </p>
          {itemName && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '8px', fontWeight: 600, color: '#374151', fontSize: '0.875rem', border: '1px solid #E5E7EB' }}>
              {itemName}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button 
            className="btn" 
            onClick={onClose} 
            style={{ flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'white', color: '#374151', height: '2.75rem', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button 
            className="btn" 
            onClick={onConfirm} 
            style={{ flex: 1, border: 'none', backgroundColor: '#EF4444', color: 'white', height: '2.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default DeleteModal;
