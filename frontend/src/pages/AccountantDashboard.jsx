import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ArrowUpRight, ArrowDownRight, Users, Plus, Check, Trash2, ShieldAlert } from 'lucide-react';

const AccountantDashboard = () => {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, totalPayroll: 0, netBalance: 0 });
  const [expenses, setExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  
  // Forms
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], description: '' });
  const [salaryForm, setSalaryForm] = useState({ user_id: '', month: 'June', year: 2026, amount: '', status: 'pending' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const statsRes = await axios.get('http://localhost:5000/api/accountant/stats');
      const expRes = await axios.get('http://localhost:5000/api/accountant/expenses');
      const salRes = await axios.get('http://localhost:5000/api/accountant/salaries');
      const staffRes = await axios.get('http://localhost:5000/api/accountant/staff');
      const feesRes = await axios.get('http://localhost:5000/api/accountant/pending-fees');

      setStats(statsRes.data);
      setExpenses(expRes.data);
      setSalaries(salRes.data);
      setStaff(staffRes.data);
      setPendingFees(feesRes.data);

      if (staffRes.data.length > 0 && !salaryForm.user_id) {
        setSalaryForm(prev => ({ ...prev, user_id: staffRes.data[0].id }));
      }
    } catch (err) {
      console.error('Accountant Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/accountant/expenses', expenseForm);
      setExpenseForm({ title: '', amount: '', category: 'General', date: new Date().toISOString().split('T')[0], description: '' });
      setMsg({ text: 'Expense recorded successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to record expense.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/accountant/expenses/${id}`);
      setMsg({ text: 'Expense deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete expense.', type: 'danger' });
    }
  };

  const handleGenerateSalary = async (e) => {
    e.preventDefault();
    if (!salaryForm.user_id || !salaryForm.amount) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/accountant/salaries', salaryForm);
      setSalaryForm(prev => ({ ...prev, amount: '' }));
      setMsg({ text: 'Salary slip generated successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to generate salary slip.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaySalary = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/accountant/salaries/${id}`, { status: 'paid' });
      setMsg({ text: 'Salary paid successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to process salary payment.', type: 'danger' });
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Accountant Console</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Manage institute financials, expenditures, payroll salary logs, and pending balances.</p>

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

      {/* Financial Overview Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Fee Collections</h3>
            <div className="value">₹{stats.totalIncome.toLocaleString()}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <h3>Misc Expenses</h3>
            <div className="value">₹{stats.totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-info">
            <h3>Salary Payroll</h3>
            <div className="value">₹{stats.totalPayroll.toLocaleString()}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Net Balance</h3>
            <div className="value">₹{stats.netBalance.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Record Expense */}
        <div className="card">
          <h2>Record New Expense</h2>
          <form onSubmit={handleCreateExpense} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Expense Title</label>
              <input
                type="text"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Broadband Subscription"
                required
              />
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 4500"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                >
                  <option value="Utilities">Utilities</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Rent">Rent</option>
                  <option value="Repairs">Repairs & Maintenance</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Payment Date</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Description / Remarks</label>
              <textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '80px' }}
                placeholder="Optional description"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
              <Plus size={18} /> Add Expense Log
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Expense Ledger</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Log of all operational disbursements.</p>
          <div className="table-container" style={{ flex: 1, maxHeight: '420px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td><strong>{exp.title}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{exp.description}</div></td>
                    <td><span style={{ fontSize: '0.75rem', backgroundColor: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{exp.category}</span></td>
                    <td>{new Date(exp.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ color: '#DC2626', fontWeight: 600 }}>₹{parseFloat(exp.amount).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '0.4rem', minWidth: 'auto', backgroundColor: '#FEF2F2', color: '#DC2626' }} onClick={() => handleDeleteExpense(exp.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No expense logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Payroll Section */}
        <div className="card">
          <h2>Generate Salary Slip</h2>
          <form onSubmit={handleGenerateSalary} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Select Staff / Faculty Member</label>
              <select
                value={salaryForm.user_id}
                onChange={(e) => setSalaryForm({ ...salaryForm, user_id: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                required
              >
                {staff.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                ))}
              </select>
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Month</label>
                <select
                  value={salaryForm.month}
                  onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Year</label>
                <input
                  type="number"
                  value={salaryForm.year}
                  onChange={(e) => setSalaryForm({ ...salaryForm, year: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Net Payable (₹)</label>
                <input
                  type="number"
                  value={salaryForm.amount}
                  onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 45000"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Initial Status</label>
                <select
                  value={salaryForm.status}
                  onChange={(e) => setSalaryForm({ ...salaryForm, status: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
              Create Salary Ledger
            </button>
          </form>
        </div>

        {/* Salary Registry */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Salary Registry</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Payroll logs and disbursement controls.</p>
          <div className="table-container" style={{ flex: 1, maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map(sal => (
                  <tr key={sal.id}>
                    <td><strong>{sal.staff_name}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sal.staff_role}</div></td>
                    <td>{sal.month} {sal.year}</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(sal.amount).toLocaleString()}</td>
                    <td>
                      <span style={{
                        color: sal.status === 'paid' ? 'var(--secondary)' : '#F59E0B',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {sal.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {sal.status === 'pending' && (
                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handlePaySalary(sal.id)}>
                          <Check size={12} /> Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Outstanding Fees Ledger */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldAlert size={22} color="#F59E0B" /> Outstanding Student Dues</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Listing all enrolled students with remaining tuition fees balance.</p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Contact</th>
                <th>Course</th>
                <th>Total Course Fees</th>
                <th>Fees Paid</th>
                <th>Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {pendingFees.map(pf => (
                <tr key={pf.student_id}>
                  <td><strong>#STU-{pf.student_id}</strong></td>
                  <td><strong>{pf.student_name}</strong></td>
                  <td>{pf.student_phone || 'N/A'}</td>
                  <td>{pf.course_title}</td>
                  <td>₹{parseFloat(pf.total_fees).toLocaleString()}</td>
                  <td style={{ color: 'var(--secondary)', fontWeight: 500 }}>₹{parseFloat(pf.paid_fees).toLocaleString()}</td>
                  <td style={{ color: '#DC2626', fontWeight: 700 }}>₹{parseFloat(pf.pending_fees).toLocaleString()}</td>
                </tr>
              ))}
              {pendingFees.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>No outstanding dues ledger found. All students are fully paid!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
