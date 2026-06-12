import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Search, Filter, MessageCircle, AlertCircle, CheckCircle, DollarSign, Loader2, X, Clock, IndianRupee } from 'lucide-react';
import { STANDARDS, BOARDS, EXAMS } from '../utils/constants';

const AdminFees = () => {
  const [successMsg, setSuccessMsg] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [batches, setBatches] = useState([]);
  const [filterPending, setFilterPending] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [recordingStudent, setRecordingStudent] = useState(null);
  const [formData, setFormData] = useState({
    amount_paid: '',
    payment_mode: 'Cash'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatted gateway details state
  const [gatewayData, setGatewayData] = useState({
    holderName: '', bankName: '', accountNo: '', ifscCode: '',
    cardNumber: '', cardExpiry: '', cardCvv: '', cardHolder: ''
  });
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

  // Format card number: "1234 5678 9012 3456"
  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Format expiry: "MM/YY"
  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  // Format IFSC: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0001234)
  const formatIFSC = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const [feesRes, batchesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/fees/all-pending'),
        axios.get('http://localhost:5000/api/batches')
      ]);
      setStudents(feesRes.data);
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowHistoryModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const generatePDF = (student, amount, paymentId, paymentMode) => {
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
    doc.text('PAYMENT RECEIPT (ADMIN COPY)', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Receipt #: REC-ADM-${paymentId || Date.now()}`, 140, 50);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 140, 55);
    
    doc.setFontSize(11);
    doc.text('Student Details:', 20, 65);
    doc.setFont(undefined, 'bold');
    doc.text(student.name, 20, 70);
    doc.setFont(undefined, 'normal');
    doc.text(`Course: ${student.course}`, 20, 75);
    doc.text(`Phone: ${student.phone}`, 20, 80);
    
    doc.setFillColor(241, 245, 249);
    doc.rect(20, 90, 170, 10, 'F');
    doc.text('Transaction Description', 25, 96);
    doc.text('Amount', 160, 96);
    
    doc.text(`Fee Payment Received (${paymentMode})`, 25, 110);
    doc.text(`$${parseFloat(amount).toFixed(2)}`, 160, 110);
    
    doc.line(20, 115, 190, 115);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Amount Received:', 125, 125);
    doc.setTextColor(16, 185, 129);
    doc.text(`$${parseFloat(amount).toFixed(2)}`, 160, 125);
    
    doc.save(`Receipt_${student.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSendReminder = (student) => {
    const message = `Hello ${student.name}, this is a reminder from ${settings.schoolName || 'Institute Hub'}. Your pending fee balance for ${student.course} is $${student.pending}. Please settle it at your earliest convenience. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${student.phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setSuccessMsg(`✅ WhatsApp fee reminder link generated for ${student.name}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const openPaymentModal = (student) => {
    setRecordingStudent(student);
    setFormData({ amount_paid: student.pending, payment_mode: 'Cash' });
    setGatewayData({ holderName: '', bankName: '', accountNo: '', ifscCode: '', cardNumber: '', cardExpiry: '', cardCvv: '', cardHolder: '' });
    setShowModal(true);
  };

  const viewHistory = async (student) => {
    setHistoryStudent(student);
    setShowHistoryModal(true);
    setHistoryLogs([]); // temporary clear
    try {
       const res = await axios.get(`http://localhost:5000/api/fees/student/${student.id}`);
       setHistoryLogs(res.data);
    } catch (err) {
       console.error(err);
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!formData.amount_paid || isNaN(formData.amount_paid) || !recordingStudent) return;
    
    const paymentAmount = parseFloat(formData.amount_paid);
    if (paymentAmount > recordingStudent.pending) {
       setSuccessMsg(`⚠️ Amount cannot exceed the pending balance (₹${recordingStudent.pending})`);
       setTimeout(() => setSuccessMsg(''), 4000);
       return;
    }

    setIsSubmitting(true);

    // Simulate payment gateway delay for digital transfers
    if (formData.payment_mode === 'Card' || formData.payment_mode === 'Bank Transfer') {
       await new Promise(resolve => setTimeout(resolve, 2500));
    }

    try {
       const res = await axios.post('http://localhost:5000/api/fees/pay', {
          student_id: recordingStudent.id,
          amount_paid: paymentAmount,
          payment_mode: formData.payment_mode
       });
       
       setSuccessMsg(`✅ Payment of $${formData.amount_paid} recorded. Downloading receipt...`);
       generatePDF(recordingStudent, formData.amount_paid, res.data.id, formData.payment_mode);
       setShowModal(false);
       setRecordingStudent(null);
       await fetchFees();
       setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
       console.error(err);
       setSuccessMsg(`❌ Error: Could not record payment.`);
       setShowModal(false);
       setRecordingStudent(null);
    } finally {
       setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterPending ? s.pending > 0 : true;
    const matchesStandard = selectedStandard === 'All' || s.standard === selectedStandard;
    const matchesBoard = selectedBoard === 'All' || s.board === selectedBoard;
    const matchesExam = selectedExam === 'All' || s.exam_target === selectedExam;
    const matchesBatch = selectedBatch === 'All' || String(s.batch_id) === String(selectedBatch);
    return matchesSearch && matchesFilter && matchesStandard && matchesBoard && matchesExam && matchesBatch;
  });

  const totalPendingVal = students.reduce((sum, s) => sum + s.pending, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Fee Management (Admin)</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total Pending:</span>
            <span style={{ fontWeight: 'bold', color: '#EF4444' }}>${totalPendingVal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '1rem', backgroundColor: successMsg.includes('✅') ? '#D1FAE5' : '#FEE2E2', color: successMsg.includes('✅') ? '#065F46' : '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by student name or course..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
             <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
             <select 
               value={selectedStandard} 
               onChange={(e) => setSelectedStandard(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Standards</option>
               {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             
             <select 
               value={selectedBoard} 
               onChange={(e) => setSelectedBoard(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Boards</option>
               {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
             </select>

             <select 
               value={selectedExam} 
               onChange={(e) => setSelectedExam(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Exams</option>
               {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
             </select>

             <select 
               value={selectedBatch} 
               onChange={(e) => setSelectedBatch(e.target.value)}
               style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'white', minWidth: '150px' }}
             >
               <option value="All">All Batches</option>
               {batches
                 .filter(b => selectedStandard === 'All' || b.standard === selectedStandard)
                 .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
          </div>

          <button 
            className="btn" 
            onClick={() => setFilterPending(!filterPending)}
            style={{ 
              border: '1px solid var(--border-color)', 
              backgroundColor: filterPending ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
              color: filterPending ? 'var(--primary)' : 'var(--text-primary)',
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem'
            }}
          >
            <AlertCircle size={18} /> {filterPending ? 'Showing Pending' : 'Filter Pending'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Plan</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 600 }}>
                      {student.name}
                      <br/>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{student.phone}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>{student.course}</span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.72rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: 700,
                        background: student.fee_plan === 'EMI' ? '#EFF6FF' : '#F1F5F9',
                        color: student.fee_plan === 'EMI' ? '#2563EB' : '#475569'
                      }}>
                        {student.fee_plan}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>₹{Number(student.totalFee).toLocaleString()}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>₹{Number(student.paid).toLocaleString()}</td>
                    <td style={{ color: student.pending > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                      ₹{Number(student.pending).toLocaleString()}
                    </td>
                    <td>
                      {student.status === 'Paid' ? (
                        <span style={{ padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: '#D1FAE5', color: '#065F46', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={11}/> Paid
                        </span>
                      ) : (
                        <span style={{ padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: '#FEE2E2', color: '#991B1B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={11}/> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap' }}>
                        {/* Record Pay */}
                        <button
                          onClick={() => openPaymentModal(student)}
                          disabled={student.pending <= 0}
                          title="Record Payment"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                            borderRadius: '8px', border: 'none', cursor: student.pending <= 0 ? 'not-allowed' : 'pointer',
                            background: student.pending <= 0 ? '#F1F5F9' : 'linear-gradient(135deg,#3B82F6,#2563EB)',
                            color: student.pending <= 0 ? '#94A3B8' : 'white',
                            transition: 'opacity 0.2s'
                          }}
                        >
                          <IndianRupee size={13}/> Record Pay
                        </button>

                        {/* History */}
                        <button
                          onClick={() => viewHistory(student)}
                          title="Payment History"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                            borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer',
                            background: '#F8FAFC', color: '#475569',
                            transition: 'background 0.2s'
                          }}
                        >
                          <Clock size={13}/> History
                        </button>

                        {/* Send Reminder */}
                        {student.pending > 0 ? (
                          <button
                            onClick={() => handleSendReminder(student)}
                            title="Send WhatsApp Reminder"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                              borderRadius: '8px', border: 'none', cursor: 'pointer',
                              background: '#25D366', color: 'white'
                            }}
                          >
                            <MessageCircle size={13}/> Remind
                          </button>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                            borderRadius: '8px', background: '#D1FAE5', color: '#065F46'
                          }}>
                            <CheckCircle size={13}/> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                      No student records match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && recordingStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Record Payment</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            <form onSubmit={submitPayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '6px', fontSize: '0.875rem' }}>
                  Student: <strong>{recordingStudent.name}</strong><br/>
                  Pending Balance: <strong style={{ color: '#EF4444' }}>₹{recordingStudent.pending}</strong>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Amount Received (₹)</label>
                  <input 
                    type="number" 
                    value={formData.amount_paid} 
                    onChange={e => setFormData({...formData, amount_paid: e.target.value})} 
                    max={recordingStudent.pending}
                    min="1"
                    step="0.01"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Payment Method</label>
                  <select value={formData.payment_mode} onChange={e => setFormData({...formData, payment_mode: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">UPI / Online Gateway</option>
                  </select>
                </div>

                {formData.payment_mode === 'Online' && formData.amount_paid && formData.amount_paid > 0 && (
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Scan to Pay (₹{formData.amount_paid})</p>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=pay@bank&pn=${encodeURIComponent(settings.schoolName || 'Institute')}&am=${formData.amount_paid}&cu=INR`} 
                      alt="UPI QR Code" 
                      style={{ width: '150px', height: '150px', margin: '0 auto', display: 'block', borderRadius: '8px' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.75rem' }}>Scan & pay, then click Confirm below.</p>
                  </div>
                )}

                {formData.payment_mode === 'Bank Transfer' && (
                  <div style={{ padding: '1rem', background: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ fontWeight: 600, color: '#0369A1', marginBottom: '0.25rem', fontSize: '0.9rem' }}>📦 Sender Bank Details</p>

                    {/* Account Holder Name */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>Account Holder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={gatewayData.holderName}
                        onChange={e => setGatewayData({...gatewayData, holderName: e.target.value})}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India"
                        value={gatewayData.bankName}
                        onChange={e => setGatewayData({...gatewayData, bankName: e.target.value})}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>

                    {/* Account Number */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>Account Number</label>
                      <input
                        type="text"
                        placeholder="Enter account number"
                        value={gatewayData.accountNo}
                        onChange={e => setGatewayData({...gatewayData, accountNo: e.target.value.replace(/\D/g, '').slice(0, 18)})}
                        required
                        inputMode="numeric"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace', letterSpacing: '1px' }}
                      />
                    </div>

                    {/* IFSC Code with pattern hint */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>IFSC Code <span style={{ color: '#94A3B8', fontWeight: 400 }}>(e.g. SRCB0000061)</span></label>
                      <input
                        type="text"
                        placeholder="ABCD0123456"
                        value={gatewayData.ifscCode}
                        onChange={e => setGatewayData({...gatewayData, ifscCode: formatIFSC(e.target.value)})}
                        required
                        maxLength={11}
                        pattern="[A-Z]{4}[0][A-Z0-9]{6}"
                        title="IFSC format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234)"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }}
                      />
                      <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '3px' }}>Format: 4 letters + 0 + 6 characters (e.g. HDFC0001234)</p>
                    </div>
                  </div>
                )}

                {formData.payment_mode === 'Card' && (
                  <div style={{ padding: '1rem', background: '#FAF5FF', borderRadius: '8px', border: '1px solid #E9D5FF', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ fontWeight: 600, color: '#7C3AED', marginBottom: '0.25rem', fontSize: '0.9rem' }}>💳 Card Details</p>

                    {/* Name on Card */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>Name on Card</label>
                      <input
                        type="text"
                        placeholder="As printed on card"
                        value={gatewayData.cardHolder}
                        onChange={e => setGatewayData({...gatewayData, cardHolder: e.target.value})}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>

                    {/* Card Number with auto-spacing */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>Card Number</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={gatewayData.cardNumber}
                        onChange={e => setGatewayData({...gatewayData, cardNumber: formatCardNumber(e.target.value)})}
                        required
                        maxLength={19}
                        inputMode="numeric"
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1rem' }}
                      />
                    </div>

                    {/* Expiry + CVV side by side */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>Expiry Date <span style={{ color: '#94A3B8', fontWeight: 400 }}>(MM/YY)</span></label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={gatewayData.cardExpiry}
                          onChange={e => setGatewayData({...gatewayData, cardExpiry: formatExpiry(e.target.value)})}
                          required
                          maxLength={5}
                          inputMode="numeric"
                          pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
                          title="Expiry must be in MM/YY format"
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace', letterSpacing: '2px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>CVV <span style={{ color: '#94A3B8', fontWeight: 400 }}>(3-4 digits)</span></label>
                        <input
                          type="password"
                          placeholder="• • •"
                          value={gatewayData.cardCvv}
                          onChange={e => setGatewayData({...gatewayData, cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                          required
                          maxLength={4}
                          inputMode="numeric"
                          pattern="[0-9]{3,4}"
                          title="CVV must be 3 or 4 digits"
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'monospace', letterSpacing: '4px' }}
                        />
                      </div>
                    </div>

                    {/* Bank Name for card */}
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '3px' }}>Issuing Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank, ICICI Bank"
                        value={gatewayData.bankName}
                        onChange={e => setGatewayData({...gatewayData, bankName: e.target.value})}
                        required
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" style={{ marginRight: '0.5rem' }} /> Processing...</>
                  ) : (
                    <><DollarSign size={18} style={{ marginRight: '0.5rem' }} /> Confirm Payment</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && historyStudent && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Payment Ledger</h2>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{historyStudent.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{historyStudent.course}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div>Total Fee: <strong>₹{historyStudent.totalFee}</strong></div>
                  <div style={{ color: '#10B981' }}>Paid: <strong>₹{historyStudent.paid}</strong></div>
                  <div style={{ color: '#EF4444' }}>Pending: <strong>₹{historyStudent.pending}</strong></div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Transaction History</h3>
              
              {historyLogs.length === 0 ? (
                 <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No payment records found.</p>
              ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   {historyLogs.map(log => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                         <div>
                           <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{new Date(log.payment_date).toLocaleDateString('en-GB')}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Method: {log.payment_mode || 'Cash'}</div>
                         </div>
                         <div style={{ fontWeight: 'bold', color: '#10B981' }}>+ ₹{log.amount_paid}</div>
                      </div>
                   ))}
                 </div>
              )}
            </div>

            <div className="modal-footer">
               <button className="btn" onClick={() => setShowHistoryModal(false)} style={{ border: '1px solid var(--border-color)' }}>Close Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFees;
