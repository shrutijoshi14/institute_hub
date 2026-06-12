import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User as UserIcon, Calendar, Phone, Mail, MapPin, 
  Award, BookOpen, Layers, DollarSign, ShieldAlert,
  Loader2, CheckCircle2, TrendingUp, Users, Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentProfile = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const studentId = role === 'parent' ? user.childId : user.id;
      if (!studentId) {
        setError('No student account associated with this login.');
        setLoading(false);
        return;
      }
      const res = await axios.get(`http://localhost:5000/api/auth/student-profile/${studentId}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.id, role]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching profile records...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2.5rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <ShieldAlert size={48} style={{ color: '#EF4444' }} />
        </div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Error Loading Profile</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'We could not retrieve details for this student.'}</p>
        <button onClick={fetchProfile} className="btn btn-primary">Retry Load</button>
      </div>
    );
  }

  const enrollment = profile.Enrollments?.[0] || {};
  const course = enrollment.Course || {};
  const batch = enrollment.Batch || {};
  const payments = profile.FeePayments || [];

  // Calculations
  const totalFees = parseFloat(course.fees) || 50000;
  const totalPaid = payments.reduce((acc, curr) => acc + parseFloat(curr.amount_paid), 0);
  const totalPending = Math.max(0, totalFees - totalPaid);
  const paidPercent = Math.min(100, Math.round((totalPaid / totalFees) * 100));

  // Initials for avatar
  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>
        {role === 'parent' ? "Child's Profile" : 'My Profile'}
      </h1>

      {/* Header Profile Banner Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)', 
        color: 'white', 
        padding: '2.5rem 2rem', 
        borderRadius: '20px', 
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '220px', height: '220px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-30%', left: '-5%', width: '150px', height: '150px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%', filter: 'blur(20px)' }}></div>

        {/* Profile Avatar circle */}
        <div style={{ 
          width: '90px', 
          height: '90px', 
          borderRadius: '50%', 
          background: 'white', 
          color: '#3B82F6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '2.25rem', 
          fontWeight: 800, 
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          flexShrink: 0,
          zIndex: 1
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, zIndex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{profile.name}</h2>
            <span style={{ 
              padding: '0.25rem 0.75rem', 
              background: 'rgba(255, 255, 255, 0.2)', 
              color: 'white', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              AMB-{profile.id.toString().padStart(4, '0')}
            </span>
          </div>
          
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} /> Standard {profile.standard || 'Unassigned'} | Class Batch: {batch.name || 'N/A'}
          </p>

          <p style={{ margin: '0.25rem 0 0 0', opacity: 0.75, fontSize: '0.85rem' }}>
            Username: <strong style={{ color: 'white' }}>{profile.username || 'N/A'}</strong>
          </p>
        </div>

        <div style={{ zIndex: 1, flexShrink: 0 }}>
          <span style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '999px', 
            fontSize: '0.75rem', 
            fontWeight: 800, 
            textTransform: 'uppercase',
            backgroundColor: profile.status === 'active' ? '#DCFCE7' : '#FEF2F2',
            color: profile.status === 'active' ? '#15803D' : '#B91C1C',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            {profile.status === 'active' ? <CheckCircle2 size={12}/> : <ShieldAlert size={12}/>}
            {profile.status || 'Active'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }} className="grid-cols-2">
        {/* Left Column: Personal and Academic Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Personal Information */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <UserIcon size={18} color="var(--primary)" /> Personal Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-cols-2">
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Date of Birth</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <Calendar size={15} color="#94A3B8" />
                  {profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not Configured'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Blood Group</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <Heart size={15} color="#EF4444" fill="#EF4444" style={{ opacity: 0.7 }} />
                  {profile.blood_group || 'Not Specified'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Student Email</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <Mail size={15} color="#94A3B8" />
                  {profile.email || 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Student Contact</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <Phone size={15} color="#94A3B8" />
                  {profile.phone || 'Not Specified'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F8FAFC' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Residential Address</span>
              <span style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.4rem', lineHeight: '1.5' }}>
                <MapPin size={16} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} />
                {profile.address || 'No registered residential address recorded.'}
              </span>
            </div>
          </div>

          {/* Academic Enrollment details */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <Award size={18} color="var(--primary)" /> Academic Course & Batch Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-cols-2">
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Course/Program</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                  <BookOpen size={15} color="#94A3B8" />
                  {course.title || 'General Batch Curriculum'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Assigned Batch Class</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <Users size={15} color="#94A3B8" />
                  {batch.name ? `${batch.name} (${batch.board})` : 'Unassigned'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Enrollment Year</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <Calendar size={15} color="#94A3B8" />
                  {enrollment.batch_year || '2025-2026'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Fee Plan Type</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <DollarSign size={15} color="#94A3B8" />
                  {enrollment.fee_plan === 'EMI' ? `EMI (${enrollment.total_installments} Installments)` : 'One-time Full Pay'}
                </span>
              </div>
            </div>

            {enrollment.fee_plan === 'EMI' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #F8FAFC' }} className="grid-cols-2">
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Monthly EMI Amount</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginTop: '0.25rem', fontSize: '1.1rem' }}>
                    ₹{parseFloat(enrollment.installment_amount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Next EMI Due Date</span>
                  <span style={{ fontWeight: 700, color: '#EF4444', display: 'block', marginTop: '0.25rem', fontSize: '1.1rem' }}>
                    {enrollment.next_due_date ? new Date(enrollment.next_due_date).toLocaleDateString('en-GB') : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fee Account Standings & Parents details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Parent Details Card */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <Users size={18} color="var(--primary)" /> Parent Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Parent/Guardian Name</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.25rem' }}>
                  {profile.parent_name || 'Not Listed'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Parent Phone Contact</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.92rem', marginTop: '0.25rem' }}>
                  <Phone size={14} color="#94A3B8" />
                  {profile.parent_phone || 'Not Specified'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Parent Username</span>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {profile.parent_name ? `${profile.username}_parent` : 'N/A'} (linked)
                </span>
              </div>
            </div>
          </div>

          {/* Fee Standings Card */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <TrendingUp size={18} color="var(--primary)" /> Fee Account Standing
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total Course Fee</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{totalFees.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#10B981', fontWeight: 500 }}>Total Paid Amount</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>₹{totalPaid.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', paddingTop: '0.5rem', borderTop: '1px dashed #E2E8F0' }}>
                <span style={{ color: totalPending > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>Dues Outstanding</span>
                <span style={{ fontWeight: 800, color: totalPending > 0 ? '#EF4444' : '#10B981' }}>₹{totalPending.toLocaleString()}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                <span>Payment Settlement</span>
                <span>{paidPercent}%</span>
              </div>
              <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${paidPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1 0%, #3B82F6 100%)', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger block */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '2rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: '#F8FAFC' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Receipt & Transaction Ledger</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', background: '#F8FAFC' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>Payment Date</th>
                <th style={{ padding: '0.85rem 1.5rem' }}>Transaction ID</th>
                <th style={{ padding: '0.85rem 1.5rem' }}>Amount Settled</th>
                <th style={{ padding: '0.85rem 1.5rem' }}>Payment Channel</th>
                <th style={{ padding: '0.85rem 1.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? payments.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: idx === payments.length - 1 ? 'none' : '1px solid #F1F5F9', fontSize: '0.875rem' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{new Date(p.payment_date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>TXN-{(p.id + 1000).toString()}{idx}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#10B981' }}>₹{parseFloat(p.amount_paid).toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{p.payment_mode || 'Cash'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#DCFCE7', color: '#15803D', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>Cleared</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>No fee payments recorded in current batch.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
