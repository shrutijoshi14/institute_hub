import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Printer, Download, CreditCard, Banknote, Loader2, 
  Fingerprint, Smartphone, CheckCircle2, Calendar, 
  ArrowRight, ShieldCheck, Zap, Info, X, ChevronRight,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BiometricScan from '../components/BiometricScan';

const StudentFees = () => {
  const [feeSummary, setFeeSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method'); // method, biometric, upi, stripe, gpay, processing, success
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvc: '', name: '', bank: '' });
  const [cardError, setCardError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [upiVerifiedName, setUpiVerifiedName] = useState('');
  const [upiPayTab, setUpiPayTab] = useState('qr'); // qr, id
  const [upiRequestSent, setUpiRequestSent] = useState(false);
  const [gpayId, setGpayId] = useState('');
  const [gpayVerifying, setGpayVerifying] = useState(false);
  const [gpayVerified, setGpayVerified] = useState(false);
  const [gpayOverlay, setGpayOverlay] = useState(false);
  const [gpayPin, setGpayPin] = useState('');
  const [gpayPinError, setGpayPinError] = useState('');
  const [settings, setSettings] = useState({ schoolName: 'Institute Hub', logoUrl: '', contactEmail: 'info@institute.com', iconName: 'GraduationCap' });
  const [amountOption, setAmountOption] = useState('installment'); // installment, full, custom
  const [showCardOtpModal, setShowCardOtpModal] = useState(false);
  const [cardOtpInput, setCardOtpInput] = useState('');
  const [cardOtpError, setCardOtpError] = useState('');
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  
  const { user, role } = useAuth();
  
  const fetchFeeData = async () => {
    try {
      const studentId = role === 'parent' ? user.childId : user.id;
      if (!studentId) {
        setFeeSummary(null);
        setHistory([]);
        setLoading(false);
        return;
      }
      const summaryRes = await axios.get(`http://localhost:5000/api/fees/summary/${studentId}`);
      const historyRes = await axios.get(`http://localhost:5000/api/fees/student/${studentId}`);
      const summary = summaryRes.data;
      setFeeSummary(summary);
      setHistory(historyRes.data);
      if (summary) {
        if (summary.fee_plan === 'EMI' && summary.installment_amount > 0 && summary.installment_amount < summary.totalPending) {
          setAmountOption('installment');
          setCustomAmount(summary.installment_amount);
        } else {
          setAmountOption('full');
          setCustomAmount(summary.totalPending);
        }
      }
    } catch (err) {
      console.error('Fee Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchFeeData();
    fetchSettings();

    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /iphone|ipad|ipod|android|blackberry|mini|windows\sphone|palm/i.test(userAgent);
      setIsMobileOrTablet(width <= 1024 || isMobileUA);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowPayModal(false);
        setGpayOverlay(false);
        setShowCardOtpModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAmountChange = (val) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (val === '') {
      setAmountError('Please specify a payment amount.');
    } else if (isNaN(parsed) || parsed <= 0) {
      setAmountError('Payment amount must be greater than zero.');
    } else if (parsed > (feeSummary?.totalPending || 0)) {
      setAmountError(`Payment amount cannot exceed the pending balance (₹${feeSummary?.totalPending}).`);
    } else {
      setAmountError('');
    }
  };

  const handleNameChange = (val) => {
    setCardForm(prev => ({ ...prev, name: val }));
  };

  const handleAmountOptionChange = (option) => {
    setAmountOption(option);
    setAmountError('');
    if (option === 'installment') {
      const amount = feeSummary?.installment_amount || feeSummary?.totalPending || 0;
      setCustomAmount(amount);
    } else if (option === 'full') {
      const amount = feeSummary?.totalPending || 0;
      setCustomAmount(amount);
    } else {
      // Custom option keeps whatever is there
    }
  };

  const handleVerifyCardOtp = () => {
    if (cardOtpInput === '123456') {
      setCardOtpError('');
      setShowCardOtpModal(false);
      handleDirectPayment(`Card (Stripe - ${cardForm.name})`);
    } else {
      setCardOtpError('Invalid secure code. Please try again (Use code: 123456).');
    }
  };

  const handleCardNumberChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardForm(prev => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length >= 3) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    setCardForm(prev => ({ ...prev, expiry: formatted }));
  };

  const handleCvcChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setCardForm(prev => ({ ...prev, cvc: digits }));
  };

  const verifyUpiId = () => {
    if (!upiId || !upiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    setUpiVerifying(true);
    setTimeout(() => {
      setUpiVerifying(false);
      setUpiVerified(true);
      setUpiVerifiedName(feeSummary?.studentName || user.name);
    }, 1500);
  };

  const sendUpiRequest = () => {
    setUpiRequestSent(true);
  };

  const verifyGpayId = () => {
    if (!gpayId || (!gpayId.includes('@') && gpayId.replace(/\D/g, '').length < 10)) {
      alert('Please enter a valid GPay ID (e.g. phone or name@okaxis)');
      return;
    }
    setGpayVerifying(true);
    setTimeout(() => {
      setGpayVerifying(false);
      setGpayVerified(true);
    }, 1500);
  };

  const processCardPayment = () => {
    const { number, expiry, cvc, name } = cardForm;
    if (number.replace(/\s/g, '').length !== 16) {
      setCardError('Please enter a valid 16-digit card number.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)) {
      setCardError('Please enter a expiry date in MM/YY format.');
      return;
    }
    if (cvc.length < 3) {
      setCardError('Please enter a 3 or 4-digit CVC code.');
      return;
    }
    if (!name.trim()) {
      setCardError('Please enter the cardholder name.');
      return;
    }
    setCardError('');
    setCardOtpInput('');
    setCardOtpError('');
    setShowCardOtpModal(true);
  };

  const processGpayPayment = () => {
    if (gpayPin.length !== 4 && gpayPin.length !== 6) {
      setGpayPinError('Please enter a valid 4 or 6 digit UPI PIN');
      return;
    }
    setGpayPinError('');
    setGpayOverlay(false);
    handleDirectPayment('GPay (Google Pay)');
  };

  const generatePDF = (payment) => {
    setDownloading(true);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text(settings.schoolName || 'Institute Hub', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings.contactEmail || 'info@institute.com', 105, 27, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('FEE RECEIPT', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Receipt #: REC-${payment.id}${Date.now().toString().slice(-4)}`, 140, 50);
    doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString('en-GB')}`, 140, 55);
    
    doc.setFontSize(11);
    doc.text('Billed To:', 20, 65);
    doc.setFont(undefined, 'bold');
    doc.text(user?.name || 'Student', 20, 70);
    doc.setFont(undefined, 'normal');
    doc.text(`Course: ${feeSummary?.courseTitle || 'N/A'}`, 20, 75);
    
    // Table content
    doc.setFillColor(241, 245, 249);
    doc.rect(20, 90, 170, 10, 'F');
    doc.text('Description', 25, 96);
    doc.text('Amount', 160, 96);
    
    doc.text(`${feeSummary?.fee_plan === 'EMI' ? 'EMI Installment' : 'Full Course Fee'}`, 25, 110);
    doc.text(`Rs. ${payment.amount_paid}`, 160, 110);
    
    doc.save(`Receipt_${(settings.schoolName || 'Receipt').replace(/\s+/g, '_')}_${payment.id}.pdf`);
    setDownloading(false);
  };

  const handleSimulatedPayment = async () => {
    setPaymentStep('processing');
    
    // Simulate network delay
    setTimeout(async () => {
      try {
        await axios.post('http://localhost:5000/api/fees/pay', {
          student_id: role === 'parent' ? user.childId : user.id,
          amount_paid: parseFloat(customAmount),
          payment_mode: selectedMethod === 'biometric' ? 'Biometric (Verified)' : selectedMethod === 'upi' ? 'UPI (Scanner)' : 'Card (Gateway)'
        });
        setPaymentStep('success');
        fetchFeeData();
      } catch (err) {
        console.error(err);
        alert('❌ Payment failed.');
        setPaymentStep('method');
      }
    }, 2500);
  };

  const handleDirectPayment = async (mode) => {
    setPaymentStep('processing');
    try {
      await axios.post('http://localhost:5000/api/fees/pay', {
        student_id: role === 'parent' ? user.childId : user.id,
        amount_paid: parseFloat(customAmount),
        payment_mode: mode
      });
      setPaymentStep('success');
      fetchFeeData();
    } catch (err) {
      console.error(err);
      alert('❌ Payment failed.');
      setPaymentStep('method');
    }
  };

  const upiString = `upi://pay?pa=pay@bank&pn=${encodeURIComponent(settings.schoolName || 'Institute Hub')}&am=${customAmount}&cu=INR&tn=Fee%20Payment`;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching your account details...</p>
      </div>
    );
  }

  if (!feeSummary) {
    return (
      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AlertCircle size={48} style={{ color: '#EF4444', marginBottom: '1rem' }} />
        </div>
        <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>No Fee Summary Found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>We couldn't retrieve fee details. This student might not be enrolled in an active batch or course plan yet. Please contact the administration.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Account & Fee Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {role === 'parent' ? 'Child' : 'Student'} Name: <strong style={{ color: 'var(--text-primary)' }}>{feeSummary?.studentName || user.name}</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {role === 'parent' ? 'Child' : 'Student'} ID: AMB-{(role === 'parent' ? user.childId : user.id).toString().padStart(4, '0')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <span style={{ 
             padding: '0.5rem 1rem', borderRadius: 'full', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
             backgroundColor: feeSummary?.totalPending <= 0 ? '#DCFCE7' : '#FEF2F2',
             color: feeSummary?.totalPending <= 0 ? '#166534' : '#991B1B',
             borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
           }}>
             {feeSummary?.totalPending <= 0 ? <CheckCircle2 size={14}/> : <Zap size={14}/>}
             {feeSummary?.totalPending <= 0 ? 'Fully Cleared' : 'Payment Due'}
           </span>
        </div>
      </div>
      
      <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Main Fee Card */}
        <div style={{ background: '#1E293B', color: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ opacity: 0.7, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{feeSummary?.courseTitle || 'Active Course'}</p>
            <h2 style={{ color: 'white', fontSize: '2rem', margin: '0 0 2rem 0', fontWeight: 800 }}>₹{feeSummary?.totalPending || 0} <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.6 }}>Pending</span></h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div>
                <p style={{ opacity: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Fees</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>₹{feeSummary?.totalFees || 0}</p>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
                <p style={{ opacity: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</p>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#4ADE80' }}>₹{feeSummary?.totalPaid || 0}</p>
              </div>
            </div>

            {feeSummary?.totalPending > 0 ? (
              <button 
                onClick={() => { 
                  setShowPayModal(true); 
                  setPaymentStep('method'); 
                  if (feeSummary.fee_plan === 'EMI' && feeSummary.installment_amount > 0 && feeSummary.installment_amount < feeSummary.totalPending) {
                    setAmountOption('installment');
                    setCustomAmount(feeSummary.installment_amount);
                  } else {
                    setAmountOption('full');
                    setCustomAmount(feeSummary.totalPending);
                  }
                  setAmountError('');
                  setCardForm({ number: '', expiry: '', cvc: '', name: '', bank: '' });
                  setCardError('');
                  setUpiId('');
                  setUpiVerified(false);
                  setUpiVerifiedName('');
                  setUpiPayTab('qr');
                  setUpiRequestSent(false);
                  setGpayId('');
                  setGpayVerified(false);
                  setGpayOverlay(false);
                  setGpayPin('');
                  setGpayPinError('');
                  setShowCardOtpModal(false);
                  setCardOtpInput('');
                  setCardOtpError('');
                }}
                style={{ 
                  width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', 
                  background: 'white', color: '#1E293B', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <Zap size={18} fill="#1E293B" /> Pay Securely Now
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ADE80', background: 'rgba(74, 222, 128, 0.1)', padding: '1rem', borderRadius: '12px', justifyContent: 'center' }}>
                <ShieldCheck size={20} /> All payments settled
              </div>
            )}
          </div>
        </div>

        {/* EMI/Plan Info */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Payment Plan</h3>
            <div style={{ padding: '0.25rem 0.75rem', background: '#F0F9FF', color: '#0369A1', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
              {feeSummary?.fee_plan === 'EMI' ? 'Installments' : 'Full Pay'}
            </div>
          </div>

          {feeSummary?.fee_plan === 'EMI' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '12px' }}>
                <div style={{ background: '#3B82F6', color: 'white', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Installment Amount</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>₹{feeSummary?.installment_amount || 0} / month</p>
                </div>
              </div>
 
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} /> Upcoming Deadlines
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#FEF2F2', borderLeft: '4px solid #EF4444', borderRadius: '4px' }}>
                    <span style={{ fontWeight: 500, color: '#991B1B' }}>Next Due</span>
                    <span style={{ fontWeight: 700, color: '#EF4444' }}>{feeSummary?.next_due_date ? new Date(feeSummary.next_due_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <span>Progress</span>
                    <span>{feeSummary ? Math.round((feeSummary.totalPaid / feeSummary.totalFees) * 100) : 0}% Settled</span>
                  </div>
                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${feeSummary ? (feeSummary.totalPaid / feeSummary.totalFees) * 100 : 0}%`, height: '100%', background: '#3B82F6' }}></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <Info size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>You have opted for a one-time full fee payment. No recurring installments are scheduled.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Ledger */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center shadow' }}>
          <h3 style={{ margin: 0 }}>Transaction History</h3>
          <button style={{ color: 'var(--primary)', border: 'none', background: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Download size={14} /> Full Ledger
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem' }}>Amount</th>
                <th style={{ padding: '1rem 1.5rem' }}>Method</th>
                <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((pay, i) => (
                <tr key={pay.id} style={{ borderBottom: i === history.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{new Date(pay.payment_date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#10B981' }}>+ ₹{pay.amount_paid}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{pay.payment_mode}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#DCFCE7', color: '#166534', borderRadius: '4px', fontWeight: 600 }}>Cleared</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <button onClick={() => generatePDF(pay)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Printer size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            {/* Modal Header */}
            <div className="modal-header">
               <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Complete Payment</h2>
               <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>

            <div className="modal-body custom-modal-body">
              {paymentStep === 'method' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Select Payment Amount Option</label>
                    
                    {/* Payment Amount Option Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '4px', borderRadius: '10px', marginBottom: '1.25rem' }}>
                      {feeSummary?.fee_plan === 'EMI' && feeSummary?.installment_amount > 0 && feeSummary?.installment_amount < feeSummary?.totalPending && (
                        <button 
                          type="button"
                          onClick={() => handleAmountOptionChange('installment')}
                          style={{ 
                            flex: 1, 
                            padding: '0.5rem 0.25rem', 
                            border: 'none', 
                            borderRadius: '8px', 
                            background: amountOption === 'installment' ? 'var(--primary)' : 'transparent', 
                            color: amountOption === 'installment' ? 'white' : 'var(--text-secondary)', 
                            fontWeight: 600, 
                            fontSize: '0.75rem', 
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Installment (₹{feeSummary.installment_amount})
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => handleAmountOptionChange('full')}
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem 0.25rem', 
                          border: 'none', 
                          borderRadius: '8px', 
                          background: amountOption === 'full' ? 'var(--primary)' : 'transparent', 
                          color: amountOption === 'full' ? 'white' : 'var(--text-secondary)', 
                          fontWeight: 600, 
                          fontSize: '0.75rem', 
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Full Outstanding (₹{feeSummary.totalPending})
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleAmountOptionChange('custom')}
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem 0.25rem', 
                          border: 'none', 
                          borderRadius: '8px', 
                          background: amountOption === 'custom' ? 'var(--primary)' : 'transparent', 
                          color: amountOption === 'custom' ? 'white' : 'var(--text-secondary)', 
                          fontWeight: 600, 
                          fontSize: '0.75rem', 
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Custom Amount
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', maxWidth: '280px', margin: '0 auto' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B' }}>₹</span>
                      <input 
                        type="number" 
                        value={customAmount} 
                        onChange={(e) => handleAmountChange(e.target.value)}
                        readOnly={amountOption !== 'custom'}
                        style={{ 
                          width: '100%', 
                          border: 'none', 
                          borderBottom: '3px solid ' + (amountError ? '#EF4444' : 'var(--primary)'), 
                          fontSize: '2.25rem', 
                          fontWeight: 800, 
                          color: amountOption !== 'custom' ? '#64748B' : '#1E293B', 
                          textAlign: 'center', 
                          outline: 'none', 
                          padding: '0.25rem',
                          background: 'transparent',
                          cursor: amountOption !== 'custom' ? 'not-allowed' : 'text'
                        }} 
                      />
                    </div>
                    {amountError ? (
                      <p style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.5rem', fontWeight: 600 }}>
                        {amountError}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Remaining Balance: ₹{((feeSummary?.totalPending || 0) - (parseFloat(customAmount) || 0)).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Biometric Pay (Hides on desktop viewports) */}
                    {isMobileOrTablet && (
                      <div 
                        onClick={() => { 
                          if (amountError || !customAmount) return;
                          setSelectedMethod('biometric'); 
                          setPaymentStep('biometric'); 
                        }}
                        style={{ 
                          padding: '1.25rem', 
                          border: '2px solid #F1F5F9', 
                          borderRadius: '16px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem', 
                          cursor: (amountError || !customAmount) ? 'not-allowed' : 'pointer', 
                          opacity: (amountError || !customAmount) ? 0.5 : 1,
                          transition: 'all 0.2s' 
                        }}
                        onMouseOver={(e) => !(amountError || !customAmount) && (e.currentTarget.style.borderColor = 'var(--primary)')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = '#F1F5F9')}
                      >
                        <div style={{ background: '#EFF6FF', color: '#3B82F6', padding: '0.75rem', borderRadius: '12px' }}><Fingerprint size={24}/></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>Biometric Pay</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TouchID / FaceID Scan verification</div>
                        </div>
                        <ChevronRight size={18} color="#94A3B8" />
                      </div>
                    )}

                    {/* UPI */}
                    <div 
                      onClick={() => { 
                        if (amountError || !customAmount) return;
                        setSelectedMethod('upi'); 
                        setPaymentStep('upi'); 
                        setUpiPayTab('qr');
                      }}
                      style={{ 
                        padding: '1.25rem', 
                        border: '2px solid #F1F5F9', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        cursor: (amountError || !customAmount) ? 'not-allowed' : 'pointer', 
                        opacity: (amountError || !customAmount) ? 0.5 : 1,
                        transition: 'all 0.2s' 
                      }}
                      onMouseOver={(e) => !(amountError || !customAmount) && (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#F1F5F9')}
                    >
                      <div style={{ background: '#F0FDF4', color: '#10B981', padding: '0.75rem', borderRadius: '12px' }}><Smartphone size={24}/></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>Unified Payments (UPI)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scan QR or Pay via UPI ID</div>
                      </div>
                      <ChevronRight size={18} color="#94A3B8" />
                    </div>

                    {/* Google Pay */}
                    <div 
                      onClick={() => { 
                        if (amountError || !customAmount) return;
                        setSelectedMethod('gpay'); 
                        setPaymentStep('gpay'); 
                        setGpayVerified(false);
                        setGpayPin('');
                        setGpayPinError('');
                      }}
                      style={{ 
                        padding: '1.25rem', 
                        border: '2px solid #F1F5F9', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        cursor: (amountError || !customAmount) ? 'not-allowed' : 'pointer', 
                        opacity: (amountError || !customAmount) ? 0.5 : 1,
                        transition: 'all 0.2s' 
                      }}
                      onMouseOver={(e) => !(amountError || !customAmount) && (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#F1F5F9')}
                    >
                      <div style={{ background: '#F5F5F5', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontWeight: 800, fontSize: '0.72rem', color: '#3c4043', letterSpacing: '0.5px' }}>G Pay</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>Google Pay (GPay)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct GPay App verification</div>
                      </div>
                      <ChevronRight size={18} color="#94A3B8" />
                    </div>

                    {/* Stripe Card */}
                    <div 
                      onClick={() => { 
                        if (amountError || !customAmount) return;
                        setSelectedMethod('stripe'); 
                        setPaymentStep('stripe'); 
                        setCardError('');
                      }}
                      style={{ 
                        padding: '1.25rem', 
                        border: '2px solid #F1F5F9', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        cursor: (amountError || !customAmount) ? 'not-allowed' : 'pointer', 
                        opacity: (amountError || !customAmount) ? 0.5 : 1,
                        transition: 'all 0.2s' 
                      }}
                      onMouseOver={(e) => !(amountError || !customAmount) && (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#F1F5F9')}
                    >
                      <div style={{ background: '#EEF2FF', color: '#6366F1', padding: '0.75rem', borderRadius: '12px' }}><CreditCard size={24}/></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>Credit/Debit Card</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Stripe Gateway checkout</div>
                      </div>
                      <ChevronRight size={18} color="#94A3B8" />
                    </div>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', marginTop: '1rem' }}>
                    <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
                    256-bit SSL Secure Payment Gateway
                  </p>
                </div>
              )}

              {paymentStep === 'biometric' && (
                <BiometricScan 
                  amount={customAmount} 
                  onVerify={() => handleDirectPayment('Biometric (Fingerprint)')} 
                  onCancel={() => setPaymentStep('method')} 
                />
              )}

              {paymentStep === 'upi' && (
                <div style={{ textAlign: 'center' }}>
                  {/* Tab Selector */}
                  <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <button 
                      onClick={() => setUpiPayTab('qr')} 
                      style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', background: upiPayTab === 'qr' ? 'white' : 'transparent', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      Scan QR Code
                    </button>
                    <button 
                      onClick={() => setUpiPayTab('id')} 
                      style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', background: upiPayTab === 'id' ? 'white' : 'transparent', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                      Pay via UPI ID
                    </button>
                  </div>

                  {upiPayTab === 'qr' ? (
                    <>
                      <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '180px', height: '180px', background: 'white', margin: '0 auto', border: '1px solid #E2E8F0', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QRCodeCanvas value={upiString} size={150} />
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Scan this QR using any UPI app like GPay, PhonePe, or BHIM</p>
                      <button onClick={handleSimulatedPayment} style={{ background: '#10B981', color: 'white', padding: '1rem 2rem', borderRadius: '12px', border: 'none', fontWeight: 600, width: '100%', cursor: 'pointer' }}>
                        I have scanned and paid
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>UPI ID</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            placeholder="e.g. name@okhdfcbank" 
                            value={upiId}
                            onChange={e => { setUpiId(e.target.value); setUpiVerified(false); }}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                          />
                          <button 
                            type="button" 
                            onClick={verifyUpiId}
                            disabled={upiVerifying || !upiId}
                            className="btn btn-primary"
                            style={{ minWidth: '80px', display: 'flex', justifyContent: 'center' }}
                          >
                            {upiVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                          </button>
                        </div>
                      </div>

                      {upiVerified && (
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#166534', fontWeight: 500 }}>
                          Verified Name: <strong>{upiVerifiedName}</strong> ✅
                        </div>
                      )}

                      {upiVerified && !upiRequestSent && (
                        <button 
                          onClick={sendUpiRequest}
                          style={{ background: '#10B981', color: 'white', padding: '1rem', borderRadius: '12px', border: 'none', fontWeight: 600, width: '100%', cursor: 'pointer', marginTop: '0.5rem' }}
                        >
                          Request payment of ₹{customAmount}
                        </button>
                      )}

                      {upiRequestSent && (
                        <div style={{ textAlign: 'center', padding: '1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px' }}>
                          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#D97706' }} />
                          <p style={{ fontWeight: 600, color: '#92400E', fontSize: '0.875rem' }}>Payment Request Pushed</p>
                          <p style={{ color: '#B45309', fontSize: '0.75rem', marginTop: '0.25rem' }}>Please check your UPI app and approve the request of ₹{customAmount}</p>
                          <button 
                            onClick={() => handleDirectPayment(`UPI ID (${upiId})`)}
                            style={{ background: '#D97706', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', marginTop: '1rem' }}
                          >
                            Simulate Bank Approval
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={() => setPaymentStep('method')} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#64748B', fontSize: '0.875rem', cursor: 'pointer' }}>Try another method</button>
                </div>
              )}

              {paymentStep === 'stripe' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   {/* Credit Card Mockup */}
                   <div style={{ 
                     background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', 
                     color: 'white', 
                     padding: '1.5rem', 
                     borderRadius: '16px', 
                     boxShadow: '0 15px 35px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                     position: 'relative',
                     overflow: 'hidden',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'space-between',
                     height: '200px',
                     border: '1px solid rgba(255,255,255,0.1)'
                   }}>
                      {/* Holographic reflection effect */}
                      <div style={{ 
                        position: 'absolute', 
                        top: '-50%', 
                        left: '-50%', 
                        width: '200%', 
                        height: '200%', 
                        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', 
                        transform: 'rotate(25deg)', 
                        pointerEvents: 'none' 
                      }}></div>
                      
                      {/* Bank Details & Contactless Indicator */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1.5px', color: '#E2E8F0', textTransform: 'uppercase' }}>
                          {settings.schoolName || 'Institute Hub'} Platinum
                        </span>
                        {/* Contactless symbol */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                          <path d="M5 18a10 10 0 0 1 0-12" />
                          <path d="M8 15a6 6 0 0 1 0-6" />
                          <path d="M11 12a2 2 0 0 1 0-2" />
                        </svg>
                      </div>
                      
                      {/* Chip Icon (premium golden style) */}
                      <div style={{ 
                        width: '45px', 
                        height: '32px', 
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                        borderRadius: '6px', 
                        position: 'relative', 
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 1
                      }}>
                        {/* Chip internal lines */}
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33%', width: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66%', width: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                        <div style={{ position: 'absolute', top: '20%', bottom: '20%', left: '15%', right: '15%', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '2px' }}></div>
                      </div>
                      
                      {/* Card Number */}
                      <div style={{ 
                        fontFamily: '"Share Tech Mono", monospace, "Courier New"', 
                        fontSize: '1.45rem', 
                        letterSpacing: '3px', 
                        fontWeight: 700,
                        color: '#F8FAFC',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        zIndex: 1,
                        margin: '0.25rem 0'
                      }}>
                        {cardForm.number || '•••• •••• •••• ••••'}
                      </div>
                      
                      {/* Footer Details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                        <div>
                          <span style={{ opacity: 0.5, display: 'block', fontSize: '0.55rem', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Card Holder</span>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                            {cardForm.name || 'Your Name'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          <div>
                            <span style={{ opacity: 0.5, display: 'block', fontSize: '0.55rem', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Valid Thru</span>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                              {cardForm.expiry || 'MM/YY'}
                            </span>
                          </div>
                          {/* Card Network Logo */}
                          <div style={{ 
                            width: '45px', 
                            height: '28px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '0.75rem',
                            letterSpacing: '1.5px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#F8FAFC'
                          }}>
                            {cardForm.number.replace(/\s/g, '').startsWith('4') ? 'VISA' : cardForm.number.replace(/\s/g, '').startsWith('5') ? 'MC' : 'CARD'}
                          </div>
                        </div>
                      </div>
                   </div>

                   {/* Card Inputs Form */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>CARDHOLDER NAME</label>
                        <input 
                          type="text" 
                          placeholder="As printed on card"
                          value={cardForm.name} 
                          onChange={(e) => handleNameChange(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>CARD NUMBER</label>
                        <input 
                          type="text" 
                          placeholder="4111 1111 1111 1111"
                          maxLength={19}
                          value={cardForm.number} 
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>EXPIRY</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardForm.expiry} 
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace' }} 
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>CVC</label>
                          <input 
                            type="password" 
                            placeholder="•••"
                            maxLength={4}
                            value={cardForm.cvc} 
                            onChange={(e) => handleCvcChange(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace', letterSpacing: '4px' }} 
                          />
                        </div>
                      </div>
                      
                      {cardError && (
                        <p style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, margin: '4px 0 0' }}>
                          {cardError}
                        </p>
                      )}
                   </div>

                   <button onClick={processCardPayment} style={{ background: '#6366F1', color: 'white', padding: '1.25rem', borderRadius: '16px', border: 'none', fontWeight: 700, width: '100%', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' }}>
                     Process Secure Payment of ₹{customAmount}
                   </button>
                   <button onClick={() => setPaymentStep('method')} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.875rem', cursor: 'pointer' }}>Try another method</button>
                </div>
              )}

              {paymentStep === 'gpay' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ width: '64px', height: '64px', background: '#F3F4F6', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3C4043' }}>
                      <Smartphone size={32} />
                    </div>
                    <h3 style={{ margin: 0 }}>GPay Wallet Checkout</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Provide Google Pay Account details below</p>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>GPay Phone Number / UPI ID</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        placeholder="e.g. 9876543210 or name@okaxis" 
                        value={gpayId}
                        onChange={e => { setGpayId(e.target.value); setGpayVerified(false); }}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                      <button 
                        type="button" 
                        onClick={verifyGpayId}
                        disabled={gpayVerifying || !gpayId}
                        className="btn btn-primary"
                        style={{ minWidth: '80px', display: 'flex', justifyContent: 'center' }}
                      >
                        {gpayVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {gpayVerified ? (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => setGpayOverlay(true)}
                        style={{ background: '#000000', color: 'white', padding: '1.25rem', borderRadius: '16px', border: 'none', fontWeight: 700, width: '100%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        Pay with <span style={{ fontWeight: 800 }}>GPay</span> (₹{customAmount})
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Please verify your account credentials before checking out.</p>
                  )}

                  <button onClick={() => setPaymentStep('method')} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.875rem', cursor: 'pointer' }}>Try another method</button>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <Loader2 size={64} color="var(--primary)" className="animate-spin" style={{ margin: '0 auto 2rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Processing Transaction</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Communicating with banking servers... Please do not close this window.</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '80px', height: '80px', background: '#DCFCE7', color: '#10B981', borderRadius: '50%', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Payment Successful!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>A total of <strong>₹{customAmount}</strong> has been received. Your fee ledger has been updated.</p>
                  <button onClick={() => setShowPayModal(false)} style={{ background: '#1E293B', color: 'white', padding: '1rem 2rem', borderRadius: '12px', border: 'none', fontWeight: 600, width: '100%', cursor: 'pointer' }}>
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Google Pay Phone Scan PIN Simulation Overlay */}
            {gpayOverlay && (
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                zIndex: 100, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2rem 1.5rem'
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F3F4', padding: '0.4rem 1rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#5f6368' }}>Google Pay</span>
                   </div>
                   <h3 style={{ color: '#202124', margin: 0, fontSize: '1rem', fontWeight: 500 }}>Paying {settings.schoolName || 'Institute Hub'}</h3>
                   <div style={{ fontSize: '2rem', fontWeight: 800, color: '#202124', margin: '0.5rem 0' }}>₹{customAmount}</div>
                   <p style={{ fontSize: '0.8rem', color: '#5f6368', margin: 0 }}>Google Pay secure checkout portal</p>
                </div>

                {/* PIN Display */}
                <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                   <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a73e8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ENTER UPI PIN</label>
                   <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1rem 0' }}>
                     {[...Array(6)].map((_, i) => (
                       <div key={i} style={{ 
                         width: '16px', 
                         height: '16px', 
                         borderRadius: '50%', 
                         border: '2px solid #5f6368',
                         backgroundColor: gpayPin.length > i ? '#1a73e8' : 'transparent',
                         borderColor: gpayPin.length > i ? '#1a73e8' : '#5f6368',
                         transition: 'all 0.1s'
                       }}></div>
                     ))}
                   </div>
                   {gpayPinError && (
                     <p style={{ color: '#d93025', fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>{gpayPinError}</p>
                   )}
                </div>

                {/* Custom Styled Num Pad */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', maxWidth: '280px', margin: '0 auto' }}>
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                     <button key={n} onClick={() => gpayPin.length < 6 && setGpayPin(prev => prev + n)} style={{ width: '56px', height: '56px', border: 'none', borderRadius: '50%', background: '#F1F3F4', color: '#202124', fontSize: '1.25rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {n}
                     </button>
                   ))}
                   <button onClick={() => setGpayPin(prev => prev.slice(0, -1))} style={{ width: '56px', height: '56px', border: 'none', borderRadius: '50%', background: '#F1F3F4', color: '#202124', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     DEL
                   </button>
                   <button onClick={() => gpayPin.length < 6 && setGpayPin(prev => prev + '0')} style={{ width: '56px', height: '56px', border: 'none', borderRadius: '50%', background: '#F1F3F4', color: '#202124', fontSize: '1.25rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     0
                   </button>
                   <button onClick={processGpayPayment} style={{ width: '56px', height: '56px', border: 'none', borderRadius: '50%', background: '#1a73e8', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     OK
                   </button>
                </div>

                {/* Cancel */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                   <button onClick={() => setGpayOverlay(false)} style={{ background: 'none', border: 'none', color: '#5f6368', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel Transfer</button>
                </div>
              </div>
            )}

            {/* Card 3D-Secure PIN/OTP Simulation Overlay */}
            {showCardOtpModal && (
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                zIndex: 100, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2rem 1.5rem'
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', padding: '0.5rem 1.25rem', borderRadius: '30px', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.5px' }}>Verified by VISA</span>
                      <span style={{ color: '#CBD5E1', fontSize: '0.85rem' }}>|</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EA580C', letterSpacing: '0.5px' }}>Mastercard. Identity Check</span>
                   </div>
                   <h3 style={{ color: '#1E293B', margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Cardholder Verification</h3>
                   <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.5rem 0' }}>Paying {settings.schoolName || 'Institute Hub'}</p>
                   <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B', margin: '0.5rem 0' }}>₹{customAmount}</div>
                   <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                     Card Number: •••• •••• •••• {cardForm.number.slice(-4)}
                   </p>
                </div>

                {/* OTP Input */}
                <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
                   <p style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 600, marginBottom: '0.75rem' }}>
                     Enter 6-digit Secure OTP
                   </p>
                   <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', fontStyle: 'italic' }}>
                     A mock code has been sent to your registered mobile. Use code: <strong style={{ color: 'var(--primary)' }}>123456</strong>
                   </p>
                   <input 
                     type="text" 
                     placeholder="123456"
                     maxLength={6}
                     value={cardOtpInput}
                     onChange={e => setCardOtpInput(e.target.value.replace(/\D/g, ''))}
                     style={{ 
                       fontSize: '1.75rem', 
                       fontWeight: 800, 
                       color: '#1E293B', 
                       border: '2px solid #E2E8F0', 
                       borderRadius: '12px', 
                       width: '180px', 
                       textAlign: 'center', 
                       outline: 'none', 
                       padding: '0.5rem',
                       letterSpacing: '6px'
                     }} 
                   />
                   {cardOtpError && (
                     <p style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.75rem' }}>{cardOtpError}</p>
                   )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <button 
                     onClick={handleVerifyCardOtp} 
                     style={{ 
                       background: 'var(--primary)', 
                       color: 'white', 
                       padding: '1rem', 
                       borderRadius: '12px', 
                       border: 'none', 
                       fontWeight: 700, 
                       width: '100%', 
                       cursor: 'pointer', 
                       fontSize: '1rem' 
                     }}
                   >
                     Verify & Complete Payment
                   </button>
                   <button 
                     onClick={() => setShowCardOtpModal(false)} 
                     style={{ 
                       background: 'none', 
                       border: 'none', 
                       color: '#64748B', 
                       fontSize: '0.85rem', 
                       cursor: 'pointer',
                       padding: '0.5rem'
                     }}
                   >
                     Cancel Transaction
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Internal CSS for simple animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        
        .custom-modal-body::-webkit-scrollbar {
          width: 6px;
        }
        .custom-modal-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-modal-body::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 9999px;
        }
        .custom-modal-body::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>
    </div>
  );
};

export default StudentFees;

