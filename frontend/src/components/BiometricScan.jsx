import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';

const BiometricScan = ({ onVerify, onCancel, amount }) => {
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error

  const startScan = () => {
    setStatus('scanning');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onVerify();
      }, 1500);
    }, 3000);
  };

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2.5rem' }}>
        {status === 'scanning' && (
          <div style={{ position: 'absolute', inset: -10, border: '4px solid #3B82F6', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
        )}
        <div style={{ 
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: status === 'success' ? '#10B981' : status === 'error' ? '#EF4444' : '#3B82F6', 
          background: status === 'success' ? '#DCFCE7' : '#EFF6FF', 
          borderRadius: '50%', transition: 'all 0.3s',
          boxShadow: status === 'scanning' ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'
        }}>
          {status === 'success' ? <CheckCircle2 size={56} /> : <Fingerprint size={56} className={status === 'scanning' ? 'animate-pulse' : ''} />}
        </div>
      </div>

      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5rem', fontWeight: 800 }}>
        {status === 'idle' && 'Biometric Identity'}
        {status === 'scanning' && 'Scanning...'}
        {status === 'success' && 'Verified'}
      </h3>

      <p style={{ color: '#64748B', marginBottom: '2.5rem', lineHeight: 1.6 }}>
        {status === 'idle' && (amount ? `Authorizing payment of ₹${amount}` : 'Authentication required for attendance logging.')}
        {status === 'scanning' && 'Please keep your finger steady on the sensor.'}
        {status === 'success' && 'Identity confirmed. Proceeding...'}
      </p>

      {status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button onClick={startScan} style={{ background: '#3B82F6', color: 'white', padding: '1.25rem', borderRadius: '16px', border: 'none', fontWeight: 700, width: '100%', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 8px 15px -3px rgba(59, 130, 246, 0.3)' }}>
            Start Scan
          </button>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#94A3B8', fontWeight: 600, fontSize: '0.875rem' }}>Cancel</button>
        </div>
      )}

      {status === 'scanning' && (
        <button disabled style={{ background: '#F1F5F9', color: '#64748B', padding: '1.25rem', borderRadius: '16px', border: 'none', fontWeight: 700, width: '100%', cursor: 'not-allowed', fontSize: '1rem' }}>
          Scan In Progress...
        </button>
      )}

      {status === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#10B981', fontWeight: 700 }}>
          <ShieldCheck size={20} /> Encrypted Handshake Complete
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
      `}</style>
    </div>
  );
};

export default BiometricScan;
