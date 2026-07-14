import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, ShieldAlert, Users, DollarSign, Plus, Check, Trash2, Clock, ShieldCheck, ToggleLeft, ToggleRight, Settings, Pencil, Calendar, Eye, EyeOff, Copy, ExternalLink, HardDrive, LogIn, RefreshCw, KeyRound, Send, Megaphone, Image, FileText, Award, Video, BarChart2, BookOpen } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalInstitutes: 0,
    activeInstitutes: 0,
    trialInstitutes: 0,
    suspendedInstitutes: 0,
    expiredInstitutes: 0,
    totalStudents: 0,
    totalParents: 0,
    totalFaculty: 0,
    totalRevenue: 0,
    storageUsage: '0.00 GB'
  });
  const [institutes, setInstitutes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [activeTenantFlags, setActiveTenantFlags] = useState(null); // Selected tenant for flag configuration
  
  // Onboarding/Edit Form Inputs (Auto URL Generation, Trial Days, Custom Admin fields mapping)
  const [newInst, setNewInst] = useState({ 
    name: '', 
    code: '', 
    subdomain: '', 
    custom_domain: '', 
    status: 'active', 
    subscription_id: '', 
    subscription_end_date: '', 
    plan: '', 
    trialDays: '14', 
    adminName: '', 
    adminEmail: '', 
    adminMobile: '', 
    adminUsername: '', 
    adminPassword: '' 
  });
  const [editingInst, setEditingInst] = useState(null);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', billing_cycle: 'yearly', max_students: '', max_parents: '', max_faculty: '', max_storage_gb: '', duration_months: '12', features: '' });
  const [editingPlan, setEditingPlan] = useState(null);
  const [extendingInst, setExtendingInst] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [viewingInst, setViewingInst] = useState(null);
  const [resetPasswordInst, setResetPasswordInst] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [cloningSettingsInst, setCloningSettingsInst] = useState(null);
  const [sourceTenantId, setSourceTenantId] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', target_type: 'all', target_institutes: [] });
  const [analytics, setAnalytics] = useState(null);

  // Global Syllabus states
  const [syllabusData, setSyllabusData] = useState({
    boards: [],
    standards: [],
    subjects: [],
    chapters: [],
    topics: [],
    questions: [],
    versions: []
  });
  const [syllabusTab, setSyllabusTab] = useState('boards');
  const [boardInput, setBoardInput] = useState({ name: '', code: '' });
  const [standardInput, setStandardInput] = useState({ board_id: '', name: '' });
  const [subjectInput, setSubjectInput] = useState({ standard_id: '', name: '', code: '' });
  const [chapterInput, setChapterInput] = useState({ subject_id: '', name: '', chapter_number: '' });
  const [topicInput, setTopicInput] = useState({ chapter_id: '', name: '', teaching_hours: '', learning_outcomes: '' });
  const [questionInput, setQuestionInput] = useState({ topic_id: '', question_text: '', question_type: 'Short', difficulty: 'Medium', answer_key: '' });
  const [versionInput, setVersionInput] = useState({ board_id: '', version: '', changes_summary: '', status: 'Draft', effective_date: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [showOnboardPass, setShowOnboardPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [showOnboardForm, setShowOnboardForm] = useState(false);

  // SaaS Portal Refactored Dashboard State
  const [mainTab, setMainTab] = useState('overview');
  const [instSearch, setInstSearch] = useState('');
  const [instStatusFilter, setInstStatusFilter] = useState('All');
  const [instPage, setInstPage] = useState(1);
  const [instPageSize] = useState(10);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('All');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(10);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.content) {
      setMsg({ text: 'Please fill in uploader title and content.', type: 'error' });
      return;
    }
    
    if (newAnn.target_type === 'specific' && newAnn.target_institutes.length === 0) {
      setMsg({ text: 'Please select at least one target institute.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/super-admin/announcements', {
        title: newAnn.title,
        content: newAnn.content,
        target_type: newAnn.target_type,
        target_institutes: newAnn.target_type === 'all' ? [] : newAnn.target_institutes
      });

      setNewAnn({ title: '', content: '', target_type: 'all', target_institutes: [] });
      setMsg({ text: 'Global announcement broadcasted successfully!', type: 'success' });
      
      const annRes = await axios.get('http://localhost:5000/api/super-admin/announcements');
      setAnnouncements(annRes.data);
    } catch (err) {
      console.error(err);
      setMsg({ text: err.response?.data?.msg || 'Failed to send announcement.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast? It will be removed from all targeted portals.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/super-admin/announcements/${id}`);
      setMsg({ text: 'Broadcast deleted successfully.', type: 'success' });

      const annRes = await axios.get('http://localhost:5000/api/super-admin/announcements');
      setAnnouncements(annRes.data);
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to delete announcement.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTargetInstitute = (id) => {
    const parsedId = Number(id);
    if (newAnn.target_institutes.includes(parsedId)) {
      setNewAnn({
        ...newAnn,
        target_institutes: newAnn.target_institutes.filter(t => t !== parsedId)
      });
    } else {
      setNewAnn({
        ...newAnn,
        target_institutes: [...newAnn.target_institutes, parsedId]
      });
    }
  };

  const fetchData = async () => {
    try {
      axios.get('http://localhost:5000/api/super-admin/stats')
        .then(res => setStats(res.data))
        .catch(err => console.error('Stats fetch error:', err));

      axios.get('http://localhost:5000/api/super-admin/institutes')
        .then(res => setInstitutes(res.data))
        .catch(err => console.error('Institutes fetch error:', err));

      axios.get('http://localhost:5000/api/super-admin/subscriptions')
        .then(res => setSubscriptions(res.data))
        .catch(err => console.error('Subscriptions fetch error:', err));

      axios.get('http://localhost:5000/api/super-admin/audit-logs')
        .then(res => setAuditLogs(res.data))
        .catch(err => console.error('Audit logs fetch error:', err));

      axios.get('http://localhost:5000/api/super-admin/global-syllabus')
        .then(res => setSyllabusData(res.data))
        .catch(err => console.error('Syllabus fetch error:', err));

      axios.get('http://localhost:5000/api/super-admin/announcements')
        .then(res => setAnnouncements(res.data))
        .catch(err => console.error('Announcements fetch error:', err));

      axios.get('http://localhost:5000/api/super-admin/analytics')
        .then(res => setAnalytics(res.data))
        .catch(err => console.error('Analytics fetch error:', err));
    } catch (err) {
      console.error('Error initializing data fetch:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setExtendingInst(null);
        setDeleteConfirm(prev => ({ ...prev, show: false }));
        setActiveTenantFlags(null);
        setEditingInst(null);
        setEditingPlan(null);
        setViewingInst(null);
        setResetPasswordInst(null);
        setNewAdminPassword('');
        setCloningSettingsInst(null);
        setSourceTenantId('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => {
        setMsg({ text: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const getPortalUrl = (inst) => {
    if (inst.custom_domain) {
      let domain = inst.custom_domain.trim();
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        return domain;
      }
      return `https://${domain}`;
    }

    const hostname = window.location.hostname;
    const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const frontendBase = isLocal ? 'http://localhost:5173' : window.location.origin;

    return `${frontendBase}/${inst.subdomain}`;
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setMsg({ text: 'Institute URL copied to clipboard!', type: 'success' });
  };

  const handleCreateInstitute = async (e) => {
    e.preventDefault();
    if (!newInst.name || !newInst.subdomain || !newInst.code) {
      setMsg({ text: 'Institute Name, Code, and Subdomain Prefix are required.', type: 'danger' });
      return;
    }
    if (!newInst.adminEmail || !newInst.adminName) {
      setMsg({ text: 'Default Admin Name and Email are required.', type: 'danger' });
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/super-admin/institutes', newInst);
      setNewInst({ 
        name: '', 
        code: '', 
        subdomain: '', 
        custom_domain: '', 
        status: 'active', 
        subscription_id: '', 
        subscription_end_date: '', 
        plan: '', 
        trialDays: '14', 
        adminName: '', 
        adminEmail: '', 
        adminMobile: '', 
        adminUsername: '', 
        adminPassword: '' 
      });
      setMsg({ text: 'Institute Tenant onboarded successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Failed to onboard institute.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInstitute = async (e) => {
    if (e) e.preventDefault();
    if (!editingInst.name || !editingInst.name.trim()) {
      setMsg({ text: 'Institute Name is required.', type: 'danger' });
      return;
    }
    if (!editingInst.subdomain || !editingInst.subdomain.trim()) {
      setMsg({ text: 'Subdomain Prefix is required.', type: 'danger' });
      return;
    }
    if (editingInst.adminEmail && !editingInst.adminEmail.includes('@')) {
      setMsg({ text: 'Please enter a valid admin email address.', type: 'danger' });
      return;
    }
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/super-admin/institutes/${editingInst.id}`, editingInst);
      setEditingInst(null);
      setMsg({ text: 'Institute updated successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      console.error(err);
      setMsg({ text: err.response?.data?.msg || 'Failed to update institute.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (inst) => {
    const nextStatus = inst.status === 'active' ? 'suspended' : 'active';
    try {
      await axios.put(`http://localhost:5000/api/super-admin/institutes/${inst.id}`, { status: nextStatus });
      setMsg({ text: `Tenant status changed to ${nextStatus}`, type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to update status.', type: 'danger' });
    }
  };

  const executeDeleteInstitute = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/institutes/${id}`);
      setMsg({ text: 'Institute deleted successfully!', type: 'success' });
      setDeleteConfirm({ show: false, title: '', message: '', onConfirm: null });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete institute (has active user/batch data).', type: 'danger' });
      setDeleteConfirm({ show: false, title: '', message: '', onConfirm: null });
    }
  };

  const handleDeleteInstitute = (id) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Institute Tenant',
      message: 'Are you sure you want to delete this institute tenant? All associated student records, faculty profiles, and fee configurations will be permanently removed.',
      onConfirm: () => executeDeleteInstitute(id)
    });
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.price) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/subscriptions', newPlan);
      setNewPlan({ name: '', price: '', billing_cycle: 'yearly', max_students: '', max_users: '', features: '' });
      setMsg({ text: 'Subscription plan created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create subscription plan.', type: 'danger' });
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan.name || !editingPlan.price) return;
    try {
      await axios.put(`http://localhost:5000/api/super-admin/subscriptions/${editingPlan.id}`, editingPlan);
      setEditingPlan(null);
      setMsg({ text: 'Subscription plan updated successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to update subscription plan.', type: 'danger' });
    }
  };

  const executeDeletePlan = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/subscriptions/${id}`);
      setMsg({ text: 'Subscription plan deleted successfully!', type: 'success' });
      setDeleteConfirm({ show: false, title: '', message: '', onConfirm: null });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete subscription plan.', type: 'danger' });
      setDeleteConfirm({ show: false, title: '', message: '', onConfirm: null });
    }
  };

  const handleDeletePlan = (id) => {
    setDeleteConfirm({
      show: true,
      title: 'Delete Subscription Plan',
      message: 'Are you sure you want to delete this subscription plan? Existing institutes linked to this plan will remain active but won\'t be able to renew under this tier.',
      onConfirm: () => executeDeletePlan(id)
    });
  };

  const handleExtendSubscription = async (days) => {
    if (!extendingInst) return;
    
    let baseDate = new Date();
    if (extendingInst.subscription_end_date) {
      const currentEnd = new Date(extendingInst.subscription_end_date);
      if (currentEnd > new Date()) {
        baseDate = currentEnd;
      }
    }
    
    baseDate.setDate(baseDate.getDate() + parseInt(days));
    const newEndDateStr = baseDate.toISOString().split('T')[0];

    try {
      await axios.put(`http://localhost:5000/api/super-admin/institutes/${extendingInst.id}`, {
        subscription_end_date: newEndDateStr
      });
      setMsg({ text: `Subscription for ${extendingInst.name} extended successfully until ${newEndDateStr}!`, type: 'success' });
      setExtendingInst(null);
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to extend subscription.', type: 'danger' });
    }
  };

  // Feature Flags Overlay Management
  const loadFeatureFlags = async (tenant) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/super-admin/feature-flags/${tenant.id}`);
      setFeatureFlags(response.data);
      setActiveTenantFlags(tenant);
      setTimeout(() => {
        const el = document.getElementById('feature-flags-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFlag = async (flagId) => {
    try {
      await axios.put(`http://localhost:5000/api/super-admin/feature-flags/toggle/${flagId}`);
      if (activeTenantFlags) {
        loadFeatureFlags(activeTenantFlags); // Refresh flags status
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newAdminPassword || !newAdminPassword.trim()) return;
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/super-admin/institutes/${resetPasswordInst.id}/reset-password`, {
        newPassword: newAdminPassword
      });
      setMsg({ text: `Successfully reset administrator password for ${resetPasswordInst.name}!`, type: 'success' });
      setResetPasswordInst(null);
      setNewAdminPassword('');
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Failed to reset password.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (inst) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/super-admin/institutes/${inst.id}/impersonate`);
      const { role, name, userId, username, tenantSubdomain } = res.data;
      
      const userObj = {
        id: userId,
        name: name,
        role: role,
        username: username,
        childId: null,
        children: []
      };
      
      sessionStorage.setItem('user', JSON.stringify(userObj));
      window.location.href = `/?tenant=${tenantSubdomain}`;
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Impersonation failed.', type: 'danger' });
    }
  };

  const handleCloneSettings = async (e) => {
    e.preventDefault();
    if (!sourceTenantId || !cloningSettingsInst) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/super-admin/institutes/clone-settings', {
        sourceTenantId,
        targetTenantId: cloningSettingsInst.id
      });
      setMsg({ text: `Settings cloned from source institute successfully!`, type: 'success' });
      setCloningSettingsInst(null);
      setSourceTenantId('');
    } catch (err) {
      setMsg({ text: 'Failed to clone settings.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    e.preventDefault();
    if (!boardInput.name || !boardInput.code) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/global-syllabus/boards', boardInput);
      setBoardInput({ name: '', code: '' });
      setMsg({ text: 'Global Board created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create board.', type: 'danger' });
    }
  };

  const handleDeleteBoard = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/global-syllabus/boards/${id}`);
      setMsg({ text: 'Global Board deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete board.', type: 'danger' });
    }
  };

  const handleCreateStandard = async (e) => {
    e.preventDefault();
    if (!standardInput.board_id || !standardInput.name) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/global-syllabus/standards', standardInput);
      setStandardInput({ board_id: '', name: '' });
      setMsg({ text: 'Global Standard created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create standard.', type: 'danger' });
    }
  };

  const handleDeleteStandard = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/global-syllabus/standards/${id}`);
      setMsg({ text: 'Global Standard deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete standard.', type: 'danger' });
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectInput.standard_id || !subjectInput.name || !subjectInput.code) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/global-syllabus/subjects', subjectInput);
      setSubjectInput({ standard_id: '', name: '', code: '' });
      setMsg({ text: 'Global Subject created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create subject.', type: 'danger' });
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/global-syllabus/subjects/${id}`);
      setMsg({ text: 'Global Subject deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete subject.', type: 'danger' });
    }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!chapterInput.subject_id || !chapterInput.name || !chapterInput.chapter_number) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/global-syllabus/chapters', chapterInput);
      setChapterInput({ subject_id: '', name: '', chapter_number: '' });
      setMsg({ text: 'Global Chapter created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create chapter.', type: 'danger' });
    }
  };

  const handleDeleteChapter = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/global-syllabus/chapters/${id}`);
      setMsg({ text: 'Global Chapter deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete chapter.', type: 'danger' });
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicInput.chapter_id || !topicInput.name) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/global-syllabus/topics', topicInput);
      setTopicInput({ chapter_id: '', name: '', teaching_hours: '', learning_outcomes: '' });
      setMsg({ text: 'Global Topic created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create topic.', type: 'danger' });
    }
  };

  const handleDeleteTopic = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/global-syllabus/topics/${id}`);
      setMsg({ text: 'Global Topic deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete topic.', type: 'danger' });
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!questionInput.topic_id || !questionInput.question_text) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/global-syllabus/questions', questionInput);
      setQuestionInput({ topic_id: '', question_text: '', question_type: 'Short', difficulty: 'Medium', answer_key: '' });
      setMsg({ text: 'Question added to Global Bank successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to add question to bank.', type: 'danger' });
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/global-syllabus/questions/${id}`);
      setMsg({ text: 'Question deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete question.', type: 'danger' });
    }
  };

  const handleCreateVersion = async (e) => {
    e.preventDefault();
    if (!versionInput.board_id || !versionInput.version) return;
    try {
      await axios.post('http://localhost:5000/api/super-admin/global-syllabus/versions', versionInput);
      setVersionInput({ board_id: '', version: '', changes_summary: '', status: 'Draft', effective_date: '' });
      setMsg({ text: 'Syllabus Version created successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to create version.', type: 'danger' });
    }
  };

  const handleDeleteVersion = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/super-admin/global-syllabus/versions/${id}`);
      setMsg({ text: 'Syllabus Version deleted successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete version.', type: 'danger' });
    }
  };

  // Filter and Paginate Institutes
  const filteredInstitutes = institutes.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(instSearch.toLowerCase()) ||
      inst.subdomain.toLowerCase().includes(instSearch.toLowerCase()) ||
      (inst.code && inst.code.toLowerCase().includes(instSearch.toLowerCase()));
    const matchesStatus = instStatusFilter === 'All' || inst.status === instStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const paginatedInstitutes = filteredInstitutes.slice((instPage - 1) * instPageSize, instPage * instPageSize);
  const totalInstPages = Math.ceil(filteredInstitutes.length / instPageSize) || 1;

  // Filter and Paginate Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = (log.action && log.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.table_name && log.table_name.toLowerCase().includes(auditSearch.toLowerCase()));
    const matchesAction = auditActionFilter === 'All' || log.action === auditActionFilter;
    return matchesSearch && matchesAction;
  });

  const paginatedAuditLogs = filteredAuditLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize);
  const totalAuditPages = Math.ceil(filteredAuditLogs.length / auditPageSize) || 1;

  // List of unique audit actions for filter dropdown
  const uniqueAuditActions = ['All', ...new Set(auditLogs.map(l => l.action).filter(Boolean))];

  // CSV Export functions
  const exportInstitutesToCSV = () => {
    if (filteredInstitutes.length === 0) {
      setMsg({ text: 'No institutes to export.', type: 'danger' });
      return;
    }
    const headers = ['ID', 'Name', 'Subdomain', 'Code', 'Status', 'Plan', 'Expiry Date'];
    const rows = filteredInstitutes.map(inst => [
      inst.id,
      `"${inst.name.replace(/"/g, '""')}"`,
      inst.subdomain,
      inst.code || '',
      inst.status,
      inst.plan || '',
      inst.expiry_date || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `institutes_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMsg({ text: 'Institutes exported successfully!', type: 'success' });
  };

  const exportAuditLogsToCSV = () => {
    if (filteredAuditLogs.length === 0) {
      setMsg({ text: 'No audit logs to export.', type: 'danger' });
      return;
    }
    const headers = ['Timestamp', 'Action', 'Affected Table', 'Record ID', 'Details', 'IP Address'];
    const rows = filteredAuditLogs.map(log => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.table_name || '',
      log.record_id || '',
      `"${(log.details || '').replace(/"/g, '""')}"`,
      log.ip_address || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMsg({ text: 'Audit logs exported successfully!', type: 'success' });
  };

  const renderOverview = () => {
    return (
      <div>
        {/* Global SaaS Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
        {/* Card 1: Total Institutes */}
        <div className="card stat-card" style={{ margin: 0 }}>
          <div className="stat-icon" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "var(--primary)" }}>
            <Building size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, margin: "0 0 0.25rem 0" }}>Total Institutes</h3>
            <div className="value" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{stats.totalInstitutes}</div>
          </div>
        </div>

        {/* Card 2: Active Institutes */}
        <div className="card stat-card" style={{ margin: 0 }}>
          <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, margin: "0 0 0.25rem 0" }}>Active Institutes</h3>
            <div className="value" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10B981" }}>{stats.activeInstitutes}</div>
          </div>
        </div>

        {/* Card 3: Trial Institutes */}
        <div className="card stat-card" style={{ margin: 0 }}>
          <div className="stat-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, margin: "0 0 0.25rem 0" }}>Trial Institutes</h3>
            <div className="value" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#F59E0B" }}>{stats.trialInstitutes}</div>
          </div>
        </div>

        {/* Card 4: Suspended Institutes */}
        <div className="card stat-card" style={{ margin: 0 }}>
          <div className="stat-icon" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#EF4444" }}>
            <ShieldAlert size={24} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, margin: "0 0 0.25rem 0" }}>Suspended</h3>
            <div className="value" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#EF4444" }}>{stats.suspendedInstitutes}</div>
          </div>
        </div>
        </div>
      </div>
    );
  };

  const renderInstitutes = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Controls Section */}
        <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", backgroundColor: "#F8FAFC" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", flex: 1 }}>
            {/* Search */}
            <div style={{ position: "relative", minWidth: "240px" }}>
              <input
                type="text"
                placeholder="Search by Name, Subdomain or Code..."
                value={instSearch}
                onChange={(e) => { setInstSearch(e.target.value); setInstPage(1); }}
                style={{ width: "100%", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.9rem" }}
              />
            </div>
            
            {/* Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Status:</span>
              <select
                value={instStatusFilter}
                onChange={(e) => { setInstStatusFilter(e.target.value); setInstPage(1); }}
                style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", backgroundColor: "white" }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setShowOnboardForm(!showOnboardForm)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                backgroundColor: showOnboardForm ? "#EF4444" : "var(--primary)",
                color: "white",
                transition: "all 0.2s"
              }}
            >
              <Plus size={18} />
              {showOnboardForm ? "Hide Form" : "Onboard Tenant"}
            </button>
            <button
              onClick={exportInstitutesToCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                backgroundColor: "white",
                color: "var(--text-primary)",
                transition: "all 0.2s"
              }}
            >
              <FileText size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Collapsible Onboard form */}
        {showOnboardForm && (
          <div className="card" style={{ borderTop: "4px solid var(--primary)", animation: "slideIn 0.3s ease-out" }}>
            <h2>Onboard New Tenant Institute</h2>
            <form onSubmit={(e) => { handleCreateInstitute(e); setShowOnboardForm(false); }} style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Institute Name</label>
                  <input
                    type="text"
                    value={newInst.name}
                    onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. Apex High School"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Institute Code</label>
                  <input
                    type="text"
                    value={newInst.code}
                    onChange={(e) => setNewInst({ ...newInst, code: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. APEX01"
                    required
                  />
                </div>
              </div>
              
              <div className="grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Subdomain Prefix</label>
                  <input
                    type="text"
                    value={newInst.subdomain}
                    onChange={(e) => setNewInst({ ...newInst, subdomain: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. apex"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Custom Domain (Optional)</label>
                  <input
                    type="text"
                    value={newInst.custom_domain}
                    onChange={(e) => setNewInst({ ...newInst, custom_domain: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. school.apex.org"
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Admin Name</label>
                  <input
                    type="text"
                    value={newInst.adminName}
                    onChange={(e) => setNewInst({ ...newInst, adminName: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Admin Email</label>
                  <input
                    type="email"
                    value={newInst.adminEmail}
                    onChange={(e) => setNewInst({ ...newInst, adminEmail: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. admin@apex.com"
                    required
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Admin Username</label>
                  <input
                    type="text"
                    value={newInst.adminUsername}
                    onChange={(e) => setNewInst({ ...newInst, adminUsername: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. apex_admin"
                    required
                  />
                </div>
                <div className="form-group" style={{ position: "relative" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Admin Password</label>
                  <input
                    type={showOnboardPass ? "text" : "password"}
                    value={newInst.adminPassword}
                    onChange={(e) => setNewInst({ ...newInst, adminPassword: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem 2.5rem 0.75rem 0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="Min 8 characters"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowOnboardPass(!showOnboardPass)} 
                    style={{ position: "absolute", right: "12px", bottom: "12px", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
                  >
                    {showOnboardPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Pricing Tier Plan</label>
                  <select
                    value={newInst.subscription_id}
                    onChange={(e) => {
                      const selectedPlan = subscriptions.find(sub => String(sub.id) === String(e.target.value));
                      setNewInst({
                        ...newInst,
                        subscription_id: e.target.value,
                        plan: selectedPlan ? selectedPlan.name : ""
                      });
                    }}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    required
                  >
                    <option value="">Select subscription tier...</option>
                    {subscriptions.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name} (₹{plan.price}/{plan.billing_cycle})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Admin Mobile</label>
                  <input
                    type="text"
                    value={newInst.adminMobile}
                    onChange={(e) => setNewInst({ ...newInst, adminMobile: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: "1rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Trial Days</label>
                  <input
                    type="number"
                    value={newInst.trialDays}
                    onChange={(e) => setNewInst({ ...newInst, trialDays: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                    placeholder="e.g. 14"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.85rem" }}>Status</label>
                  <select
                    value={newInst.status}
                    onChange={(e) => setNewInst({ ...newInst, status: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: "3rem", borderRadius: "12px", justifyContent: "center" }} disabled={loading}>
                  Onboard Institute
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tenants List */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>SaaS Tenant Directory</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>Active institute databases hosting academic portals.</p>
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <RefreshCw size={36} className="text-primary" style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>Loading tenants list...</p>
            </div>
          ) : paginatedInstitutes.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
              <Building size={48} style={{ opacity: 0.5, marginBottom: "1rem" }} />
              <h3>No Tenants Found</h3>
              <p>No institutes match the current search or filters.</p>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: "none", borderRadius: 0 }}>
              <table style={{ minWidth: "1000px" }}>
                <thead>
                  <tr>
                    <th>Institute Name</th>
                    <th>Institute URL</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Student Limit</th>
                    <th style={{ textAlign: "center" }}>Faculty Limit</th>
                    <th>Storage Used</th>
                    <th>Expiry Date</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInstitutes.map(inst => {
                    const portalUrl = getPortalUrl(inst);
                    return (
                      <tr key={inst.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{inst.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Code: {inst.code || "N/A"}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <code style={{ fontSize: "0.8rem", color: "var(--primary)" }}>
                              {portalUrl}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(portalUrl)}
                              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#9CA3AF" }}
                              title="Copy URL"
                            >
                              <Copy size={14} />
                            </button>
                            <a
                              href={portalUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "flex", color: "#9CA3AF" }}
                              title="Open Portal"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{inst.plan || "Trial Tier"}</span>
                        </td>
                        <td>
                          <span style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: inst.status === "active" ? "#ECFDF5" : "#FEF2F2",
                            color: inst.status === "active" ? "#047857" : "#B91C1C"
                          }}>{inst.status}</span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{inst.studentCount || 0}</td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{inst.facultyCount || 0}</td>
                        <td style={{ fontWeight: 600 }}>{inst.storageUsed || "0.00 MB"}</td>
                        <td>
                          <span style={{ fontSize: "0.85rem" }}>
                            {inst.expiry_date ? new Date(inst.expiry_date).toLocaleDateString("en-GB") : (inst.subscription_end_date ? new Date(inst.subscription_end_date).toLocaleDateString("en-GB") : "Trial Mode")}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setViewingInst(inst)} title="View Info"><Eye size={16} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingInst(inst)} title="Edit Tenant"><Pencil size={16} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setExtendingInst(inst)} title="Extend Plan"><Calendar size={16} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => loadFeatureFlags(inst)} title="Feature Flags"><Settings size={16} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = `/settings?tenantId=${inst.id}`} title="Configure Settings"><Settings size={16} color="var(--primary)" /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setCloningSettingsInst(inst)} title="Clone Config"><RefreshCw size={16} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setResetPasswordInst(inst)} title="Reset Password"><KeyRound size={16} /></button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleImpersonate(inst)} title="Impersonate Admin" style={{ backgroundColor: "#FEE2E2", border: "none" }}><LogIn size={16} color="#DC2626" /></button>
                            <button className={`btn ${inst.status === "active" ? "btn-secondary" : "btn-primary"} btn-sm`} onClick={() => handleToggleStatus(inst)} title={inst.status === "active" ? "Suspend" : "Activate"}>
                              {inst.status === "active" ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteInstitute(inst.id)} title="Delete Tenant"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalInstPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", borderTop: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Page <strong>{instPage}</strong> of <strong>{totalInstPages}</strong> (Showing {paginatedInstitutes.length} of {filteredInstitutes.length} tenants)
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={instPage === 1}
                  onClick={() => setInstPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                {Array.from({ length: totalInstPages }, (_, idx) => (
                  <button
                    key={idx + 1}
                    className={`btn btn-sm ${instPage === idx + 1 ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setInstPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={instPage === totalInstPages}
                  onClick={() => setInstPage(prev => Math.min(prev + 1, totalInstPages))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

﻿  const renderPlans = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          {/* Create/Edit Pricing Plan Form */}
          <div className="card">
            <h2>{editingPlan ? 'Edit Billing Plan Tier' : 'Create Pricing Plan Tier'}</h2>
            <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Plan Name</label>
                <input
                  type="text"
                  value={editingPlan ? editingPlan.name : newPlan.name}
                  onChange={(e) => editingPlan 
                    ? setEditingPlan({ ...editingPlan, name: e.target.value })
                    : setNewPlan({ ...newPlan, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Premium Tier"
                  required
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Price (INR)</label>
                  <input
                    type="number"
                    value={editingPlan ? editingPlan.price : newPlan.price}
                    onChange={(e) => editingPlan
                      ? setEditingPlan({ ...editingPlan, price: e.target.value })
                      : setNewPlan({ ...newPlan, price: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 15000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Billing Cycle</label>
                  <select
                    value={editingPlan ? editingPlan.billing_cycle : newPlan.billing_cycle}
                    onChange={(e) => editingPlan
                      ? setEditingPlan({ ...editingPlan, billing_cycle: e.target.value })
                      : setNewPlan({ ...newPlan, billing_cycle: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-3" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Max Students</label>
                  <input
                    type="number"
                    value={editingPlan ? editingPlan.max_students : newPlan.max_students}
                    onChange={(e) => editingPlan
                      ? setEditingPlan({ ...editingPlan, max_students: e.target.value })
                      : setNewPlan({ ...newPlan, max_students: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Max Faculty</label>
                  <input
                    type="number"
                    value={editingPlan ? editingPlan.max_faculty : newPlan.max_faculty}
                    onChange={(e) => editingPlan
                      ? setEditingPlan({ ...editingPlan, max_faculty: e.target.value })
                      : setNewPlan({ ...newPlan, max_faculty: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Max Storage (GB)</label>
                  <input
                    type="number"
                    value={editingPlan ? editingPlan.max_storage_gb : newPlan.max_storage_gb}
                    onChange={(e) => editingPlan
                      ? setEditingPlan({ ...editingPlan, max_storage_gb: e.target.value })
                      : setNewPlan({ ...newPlan, max_storage_gb: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Feature List (Comma separated)</label>
                <input
                  type="text"
                  value={editingPlan ? editingPlan.features : newPlan.features}
                  onChange={(e) => editingPlan
                    ? setEditingPlan({ ...editingPlan, features: e.target.value })
                    : setNewPlan({ ...newPlan, features: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Attendance, Fees, Results, Transport"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3rem', borderRadius: '12px', justifyContent: 'center' }}>
                  {editingPlan ? 'Update Plan Tier' : 'Create Plan Tier'}
                </button>
                {editingPlan && (
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => setEditingPlan(null)} 
                    style={{ flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center' }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Pricing plans listing */}
          <div className="card">
            <h2>Active Platform Pricing Plans</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Active billing packages for onboarding custom portals.</p>
            {subscriptions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No pricing plans created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {subscriptions.map(plan => (
                  <div 
                    key={plan.id} 
                    style={{
                      padding: '1.25rem',
                      border: editingPlan?.id === plan.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>{plan.name}</h4>
                      <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>₹{plan.price} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ {plan.billing_cycle}</span></p>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>Students: {plan.max_students || 'Unlimited'}</span>
                        <span>Faculty: {plan.max_faculty || 'Unlimited'}</span>
                        <span>Storage: {plan.max_storage_gb ? `${plan.max_storage_gb} GB` : 'Unlimited'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingPlan(plan)}><Pencil size={16} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeletePlan(plan.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  const renderSyllabus = () => {
    return (
      <div className="card">
        <h2>Global Curriculum Database & Versions</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Construct default boards, standards, subjects, and topics to clone to local tenants.</p>

        {/* Inner Syllabus Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { id: 'boards', label: 'Boards' },
            { id: 'standards', label: 'Standards' },
            { id: 'subjects', label: 'Subjects' },
            { id: 'chapters', label: 'Chapters' },
            { id: 'topics', label: 'Topics' },
            { id: 'questions', label: 'Questions Pool' },
            { id: 'versions', label: 'Version Logs' }
          ].map(innerTab => (
            <button
              key={innerTab.id}
              type="button"
              onClick={() => setSyllabusTab(innerTab.id)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: syllabusTab === innerTab.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                color: syllabusTab === innerTab.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '0.85rem'
              }}
            >
              {innerTab.label}
            </button>
          ))}
        </div>

        {/* Tab contents */}
        {syllabusTab === 'boards' && (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
              <h3>Add Education Board</h3>
              <form onSubmit={handleCreateBoard} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Board Name</label>
                  <input
                    type="text"
                    value={boardInput.name}
                    onChange={(e) => setBoardInput({ ...boardInput, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. CBSE"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Code</label>
                  <input
                    type="text"
                    value={boardInput.code}
                    onChange={(e) => setBoardInput({ ...boardInput, code: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. cbse_board"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Board</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Configured Boards</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {syllabusData.boards.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{b.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({b.code})</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBoard(b.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {syllabusTab === 'standards' && (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
              <h3>Add Class Standard</h3>
              <form onSubmit={handleCreateStandard} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Board</label>
                  <select
                    value={standardInput.board_id}
                    onChange={(e) => setStandardInput({ ...standardInput, board_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select Board...</option>
                    {syllabusData.boards.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Standard Name</label>
                  <input
                    type="text"
                    value={standardInput.name}
                    onChange={(e) => setStandardInput({ ...standardInput, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 10th Standard"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Standard</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Configured Standards</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {syllabusData.standards.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{s.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>Board: {s.Board?.name || 'N/A'}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStandard(s.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {syllabusTab === 'subjects' && (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
              <h3>Add Global Subject</h3>
              <form onSubmit={handleCreateSubject} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Standard</label>
                  <select
                    value={subjectInput.standard_id}
                    onChange={(e) => setSubjectInput({ ...subjectInput, standard_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select Standard...</option>
                    {syllabusData.standards.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.Board?.name || 'N/A'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject Name</label>
                  <input
                    type="text"
                    value={subjectInput.name}
                    onChange={(e) => setSubjectInput({ ...subjectInput, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Code</label>
                  <input
                    type="text"
                    value={subjectInput.code}
                    onChange={(e) => setSubjectInput({ ...subjectInput, code: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. math_10"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Subject</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Configured Subjects</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {syllabusData.subjects.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{sub.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({sub.code}) - {sub.Standard?.name || 'N/A'}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubject(sub.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {syllabusTab === 'chapters' && (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
              <h3>Add Global Chapter</h3>
              <form onSubmit={handleCreateChapter} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Subject</label>
                  <select
                    value={chapterInput.subject_id}
                    onChange={(e) => setChapterInput({ ...chapterInput, subject_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select Subject...</option>
                    {syllabusData.subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.Standard?.name || 'N/A'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chapter Name</label>
                  <input
                    type="text"
                    value={chapterInput.name}
                    onChange={(e) => setChapterInput({ ...chapterInput, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. Quadratic Equations"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chapter Number</label>
                  <input
                    type="number"
                    value={chapterInput.chapter_number}
                    onChange={(e) => setChapterInput({ ...chapterInput, chapter_number: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 1"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Chapter</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Configured Chapters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {syllabusData.chapters.map(ch => (
                  <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Ch {ch.chapter_number}: {ch.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({ch.Subject?.name || 'N/A'})</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteChapter(ch.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {syllabusTab === 'topics' && (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
              <h3>Add Global Topic</h3>
              <form onSubmit={handleCreateTopic} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chapter</label>
                  <select
                    value={topicInput.chapter_id}
                    onChange={(e) => setTopicInput({ ...topicInput, chapter_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select Chapter...</option>
                    {syllabusData.chapters.map(ch => (
                      <option key={ch.id} value={ch.id}>Ch {ch.chapter_number}: {ch.name} ({ch.Subject?.name})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Topic Name</label>
                  <input
                    type="text"
                    value={topicInput.name}
                    onChange={(e) => setTopicInput({ ...topicInput, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. Roots of quadratic equation"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Teaching Hours</label>
                  <input
                    type="number"
                    value={topicInput.teaching_hours}
                    onChange={(e) => setTopicInput({ ...topicInput, teaching_hours: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 5"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Topic</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Configured Topics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {syllabusData.topics.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{t.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({t.teaching_hours || 0} hrs) - Ch {t.Chapter?.chapter_number}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTopic(t.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {syllabusTab === 'questions' && (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
              <h3>Add Global Question</h3>
              <form onSubmit={handleCreateQuestion} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Topic</label>
                  <select
                    value={questionInput.topic_id}
                    onChange={(e) => setQuestionInput({ ...questionInput, topic_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select Topic...</option>
                    {syllabusData.topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Ch {t.Chapter?.chapter_number})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Question Text</label>
                  <textarea
                    value={questionInput.question_text}
                    onChange={(e) => setQuestionInput({ ...questionInput, question_text: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', height: '80px', resize: 'none' }}
                    placeholder="Enter global question..."
                    required
                  />
                </div>
                <div className="grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Question Type</label>
                    <select
                      value={questionInput.question_type}
                      onChange={(e) => setQuestionInput({ ...questionInput, question_type: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    >
                      <option value="Short">Short</option>
                      <option value="Long">Long</option>
                      <option value="MCQ">MCQ</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Difficulty</label>
                    <select
                      value={questionInput.difficulty}
                      onChange={(e) => setQuestionInput({ ...questionInput, difficulty: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Create Question</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Configured Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
                {syllabusData.questions.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No questions added yet.</p>
                ) : (
                  syllabusData.questions.map(q => (
                    <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{q.question_text}</p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '1rem' }}>Type: {q.question_type}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Diff: {q.difficulty}</span>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q.id)}><Trash2 size={14} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {syllabusTab === 'versions' && (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
              <h3>Log Syllabus Version Change</h3>
              <form onSubmit={handleCreateVersion} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Education Board</label>
                  <select
                    value={versionInput.board_id}
                    onChange={(e) => setVersionInput({ ...versionInput, board_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select Board...</option>
                    {syllabusData.boards.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Version Number</label>
                  <input
                    type="text"
                    value={versionInput.version}
                    onChange={(e) => setVersionInput({ ...versionInput, version: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 2026.1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Changes Summary</label>
                  <input
                    type="text"
                    value={versionInput.changes_summary}
                    onChange={(e) => setVersionInput({ ...versionInput, changes_summary: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. Updated standard 10th algebra syllabus"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Log Version</button>
              </form>
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Syllabus Version Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {syllabusData.versions.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>v{v.version} - {v.Board?.name || 'N/A'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.changes_summary || 'No description'}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVersion(v.id)}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBroadcasts = () => {
    return (
      <div className="grid-cols-2" style={{ gap: '2rem' }}>
        {/* Create Broadcast form */}
        <div className="card">
          <h2>Create Global Announcement Broadcast</h2>
          <form onSubmit={handleCreateAnnouncement} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Title</label>
              <input
                type="text"
                value={newAnn.title}
                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. System Maintenance Notice"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Content</label>
              <textarea
                value={newAnn.content}
                onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '120px', resize: 'none' }}
                placeholder="Enter notice content details..."
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Target Audience</label>
              <select
                value={newAnn.target_type}
                onChange={(e) => setNewAnn({ ...newAnn, target_type: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
              >
                <option value="all">All Portals (Global Network)</option>
                <option value="specific">Specific Tenants Only</option>
              </select>
            </div>

            {newAnn.target_type === 'specific' && (
              <div className="form-group card" style={{ border: '1px solid var(--border-color)', maxHeight: '180px', overflowY: 'auto', gap: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Select Target Institutes</label>
                {institutes.map(inst => (
                  <label key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={newAnn.target_institutes.includes(inst.id)}
                      onChange={() => handleToggleTargetInstitute(inst.id)}
                    />
                    <span>{inst.name} ({inst.subdomain})</span>
                  </label>
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', height: '3rem', borderRadius: '12px' }} disabled={loading}>
              <Send size={18} />
              Broadcast Notice
            </button>
          </form>
        </div>

        {/* Existing Announcements */}
        <div className="card">
          <h2>Active Platform Broadcasts</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Announcements visible in targeted tenant notice boards.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '550px', overflowY: 'auto' }}>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No broadcasts created yet.</p>
            ) : (
              announcements.map(ann => (
                <div
                  key={ann.id}
                  style={{
                    padding: '1.25rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>{ann.title}</h4>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAnnouncement(ann.id)}><Trash2 size={16} /></button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{ann.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    <span>Target: {ann.target_type === 'all' ? 'All Portals' : `${ann.target_institutes?.length || 0} Portals`}</span>
                    <span>Sent: {new Date(ann.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAudit = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Filters */}
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search logs by keyword..."
                value={auditSearch}
                onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
              />
            </div>

            {/* Action Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Action:</span>
              <select
                value={auditActionFilter}
                onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', backgroundColor: 'white' }}
              >
                {uniqueAuditActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={exportAuditLogsToCSV}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "2.5rem" }}
          >
            Export to CSV
          </button>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Affected Table</th>
                  <th>Record ID</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAuditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {new Date(log.created_at).toLocaleString("en-GB")}
                    </td>
                    <td>
                      <span style={{
                        backgroundColor: "#EEF2FF",
                        color: "#4F46E5",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td><code>{log.table_name || "N/A"}</code></td>
                    <td>{log.record_id ? `#${log.record_id}` : "N/A"}</td>
                    <td style={{ fontSize: "0.85rem" }}>{log.details}</td>
                    <td style={{ fontSize: "0.8rem", color: "#6B7280" }}>{log.ip_address || "N/A"}</td>
                  </tr>
                ))}
                {paginatedAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                      No audit logs recorded matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalAuditPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page <strong>{auditPage}</strong> of <strong>{totalAuditPages}</strong> (Showing {paginatedAuditLogs.length} of {filteredAuditLogs.length} audit logs)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={auditPage === 1}
                  onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={auditPage === totalAuditPages}
                  onClick={() => setAuditPage(prev => Math.min(prev + 1, totalAuditPages))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">SaaS Super Admin Platform Desk</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Global multi-tenant network, pricing plans, notices, curriculum database, and SaaS governance console.</p>

      {/* Dynamic Top Alerts */}
      {msg.text && (
        <>
          <style>{`
            @keyframes toastSlideIn {
              from {
                transform: translateX(120%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            padding: '1rem 1.25rem',
            backgroundColor: msg.type === 'success' ? '#10B981' : msg.type === 'info' ? '#3B82F6' : '#EF4444',
            color: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            minWidth: '320px',
            maxWidth: '450px',
            border: 'none',
            animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <span>{msg.text}</span>
            <button
              type="button"
              onClick={() => setMsg({ text: '', type: '' })}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '0',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s'
              }}
            >
              &times;
            </button>
          </div>
        </>
      )}

            {/* SaaS Horizontal Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'overview', label: 'Platform Overview', icon: BarChart2 },
          { id: 'institutes', label: 'Tenants Manager', icon: Building },
          { id: 'plans', label: 'Billing & Plans', icon: DollarSign },
          { id: 'broadcasts', label: 'Global Notice Board', icon: Megaphone },
          { id: 'syllabus', label: 'Curriculum Database', icon: BookOpen },
          { id: 'audit', label: 'Governance Logs', icon: Clock }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <TabIcon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="fade-in-pane">
        {mainTab === 'overview' && renderOverview()}
        {mainTab === 'institutes' && renderInstitutes()}
        {mainTab === 'plans' && renderPlans()}
        {mainTab === 'broadcasts' && renderBroadcasts()}
        {mainTab === 'syllabus' && renderSyllabus()}
        {mainTab === 'audit' && renderAudit()}
      </div>

      {/* Extend Subscription Modal */}
      {extendingInst && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '450px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              padding: '2rem 2rem 1rem 2rem',
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                <Settings size={20} color="var(--primary)" />
                <span>Extend Plan</span>
              </div>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9CA3AF', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => setExtendingInst(null)}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 2rem' }}>
              Extend active access validity for <strong>{extendingInst.name}</strong>.
            </p>
            <div style={{ padding: '0 2rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Expiry:</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {extendingInst.subscription_end_date ? new Date(extendingInst.subscription_end_date).toLocaleDateString('en-GB') : 'No active end date'}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 2rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Choose Duration to Add:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <button type="button" className="btn" style={{ backgroundColor: '#F3F4F6', justifyContent: 'center', height: '2.5rem' }} onClick={() => handleExtendSubscription(30)}>+30 Days</button>
                <button type="button" className="btn" style={{ backgroundColor: '#F3F4F6', justifyContent: 'center', height: '2.5rem' }} onClick={() => handleExtendSubscription(90)}>+90 Days</button>
                <button type="button" className="btn" style={{ backgroundColor: '#F3F4F6', justifyContent: 'center', height: '2.5rem' }} onClick={() => handleExtendSubscription(180)}>+180 Days</button>
                <button type="button" className="btn" style={{ backgroundColor: '#F3F4F6', justifyContent: 'center', height: '2.5rem' }} onClick={() => handleExtendSubscription(365)}>+1 Year</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', position: 'sticky', bottom: 0, zIndex: 2 }}>
              <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#EF4444', color: 'white', justifyContent: 'center', height: '2.75rem' }} onClick={() => setExtendingInst(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Flags Overlay Modal */}
      {activeTenantFlags && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1005,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              padding: '2rem 2rem 1rem 2rem',
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                <Settings size={20} color="var(--primary)" />
                <span>Feature Management</span>
              </div>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9CA3AF', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => setActiveTenantFlags(null)}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 2rem' }}>
              Configure active system modules and access permissions for <strong>{activeTenantFlags.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 2rem' }}>
              {featureFlags.map(flag => (
                <div key={flag.id} style={{
                  padding: '1rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {flag.feature_key.replace('_enabled', '').replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                      {flag.is_enabled ? 'Module Access Active' : 'Module Access Restricted'}
                    </div>
                  </div>
                  <div
                    onClick={() => handleToggleFlag(flag.id)}
                    style={{
                      width: '48px',
                      height: '24px',
                      backgroundColor: flag.is_enabled ? 'var(--primary)' : '#D1D5DB',
                      borderRadius: '9999px',
                      padding: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: flag.is_enabled ? 'flex-end' : 'flex-start',
                      transition: 'background-color 0.2s, justify-content 0.2s',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      transition: 'transform 0.2s'
                    }} />
                  </div>
                </div>
              ))}
              {featureFlags.length === 0 && (
                <div style={{ color: '#6B7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                  No feature flags configured for this tenant.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', position: 'sticky', bottom: 0, zIndex: 2 }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ flex: 1, justifyContent: 'center', height: '2.75rem' }} 
                onClick={() => setActiveTenantFlags(null)}
              >
                Close & Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Institute Modal */}
      {editingInst && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              padding: '2rem 2rem 1rem 2rem',
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                <Pencil size={20} color="var(--primary)" />
                <span>Edit Institute Details</span>
              </div>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9CA3AF', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => setEditingInst(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateInstitute} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '0 2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Institute Name</label>
                  <input
                    type="text"
                    value={editingInst.name}
                    onChange={(e) => setEditingInst({ ...editingInst, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. Apex High School"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Institute Code</label>
                  <input
                    type="text"
                    value={editingInst.code || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, code: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. APEX01"
                    required
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '0 2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Subdomain Prefix</label>
                  <input
                    type="text"
                    value={editingInst.subdomain}
                    onChange={(e) => setEditingInst({ ...editingInst, subdomain: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. apex"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Custom Domain</label>
                  <input
                    type="text"
                    value={editingInst.custom_domain || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, custom_domain: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. school.apex.org"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '0 2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Admin Name</label>
                  <input
                    type="text"
                    value={editingInst.adminName || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, adminName: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Admin Email</label>
                  <input
                    type="email"
                    value={editingInst.adminEmail || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, adminEmail: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="admin@school.com"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '0 2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Admin Mobile</label>
                  <input
                    type="tel"
                    value={editingInst.adminMobile || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, adminMobile: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Subscription Plan</label>
                  <select
                    value={editingInst.plan || ''}
                    onChange={(e) => setEditingInst({ ...editingInst, plan: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    required
                  >
                    <option value="">Select Plan...</option>
                    {subscriptions.map(plan => (
                      <option key={plan.id} value={plan.name}>{plan.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '0 2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={editingInst.expiry_date ? editingInst.expiry_date.split('T')[0] : (editingInst.subscription_end_date ? editingInst.subscription_end_date.split('T')[0] : '')}
                    onChange={(e) => setEditingInst({ ...editingInst, expiry_date: e.target.value, subscription_end_date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Status</label>
                  <select
                    value={editingInst.status}
                    onChange={(e) => setEditingInst({ ...editingInst, status: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', position: 'sticky', bottom: 0, zIndex: 2 }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, height: '2.75rem', justifyContent: 'center' }} 
                  disabled={loading}
                >
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, height: '2.75rem', justifyContent: 'center', backgroundColor: '#F3F4F6' }} 
                  onClick={() => setEditingInst(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1010,
          padding: '1rem'
        }}>
          <form onSubmit={(e) => { e.preventDefault(); deleteConfirm.onConfirm(); }} className="card" style={{
            width: '100%',
            maxWidth: '450px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            borderTop: '4px solid #EF4444'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: '#DC2626' }}>
              <ShieldAlert size={22} />
              <span>{deleteConfirm.title}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {deleteConfirm.message}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: '#EF4444', color: 'white', border: 'none', justifyContent: 'center', height: '2.75rem' }}
              >
                Confirm Delete
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', height: '2.75rem' }}
                onClick={() => setDeleteConfirm({ show: false, title: '', message: '', onConfirm: null })}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Details Modal */}
      {viewingInst && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1005,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '550px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            borderTop: '4px solid #0284C7'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              padding: '2rem 2rem 1rem 2rem',
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: '#0369A1' }}>
                <Building size={22} />
                <span>Institute Profile & SaaS Governance</span>
              </div>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9CA3AF', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => setViewingInst(null)}
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem 2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Institute Name</strong>
                  <span style={{ fontWeight: 600 }}>{viewingInst.name}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Institute Code</strong>
                  <span style={{ fontWeight: 600 }}>{viewingInst.code || 'N/A'}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Subdomain Prefix</strong>
                  <span>{viewingInst.subdomain}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</strong>
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: viewingInst.status === 'active' ? '#ECFDF5' : '#FEF2F2',
                    color: viewingInst.status === 'active' ? '#047857' : '#B91C1C'
                  }}>{viewingInst.status}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Institute URL</strong>
                  <code style={{ color: '#0369A1' }}>{getPortalUrl(viewingInst)}</code>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Subscription Plan</strong>
                  <span>{viewingInst.plan || viewingInst.Subscription?.name || 'Trial Plan'}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Expiry Date</strong>
                  <span>{viewingInst.expiry_date ? new Date(viewingInst.expiry_date).toLocaleDateString() : (viewingInst.subscription_end_date ? new Date(viewingInst.subscription_end_date).toLocaleDateString() : 'N/A')}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Administrator Credentials</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Admin Name</strong>
                    <span>{viewingInst.adminName || 'N/A'}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Admin Email</strong>
                    <span>{viewingInst.adminEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Admin Mobile</strong>
                    <span>{viewingInst.adminMobile || 'N/A'}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Admin Username</strong>
                    <code>{viewingInst.adminUsername || `admin_${viewingInst.subdomain}`}</code>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', position: 'sticky', bottom: 0, zIndex: 2 }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: '#0284C7', border: 'none', justifyContent: 'center', height: '2.75rem' }}
                onClick={() => setViewingInst(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Admin Password Modal */}
      {resetPasswordInst && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1006,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '450px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            borderTop: '4px solid #8B5CF6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              padding: '2rem 2rem 1rem 2rem',
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: '#6B21A8' }}>
                <KeyRound size={20} />
                <span>Reset Admin Password</span>
              </div>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9CA3AF', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => { setResetPasswordInst(null); setNewAdminPassword(''); }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 2rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Enter the new password for the administrator account of <strong>{resetPasswordInst.name}</strong>.
                </p>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>New Password</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', backgroundColor: '#FFFFFF' }}
                    placeholder="e.g. SecretPassword123"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', position: 'sticky', bottom: 0, zIndex: 2 }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, backgroundColor: '#8B5CF6', color: 'white', border: 'none', justifyContent: 'center', height: '2.75rem' }}
                  disabled={loading}
                >
                  Save Password
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', height: '2.75rem' }}
                  onClick={() => { setResetPasswordInst(null); setNewAdminPassword(''); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clone Settings Modal */}
      {cloningSettingsInst && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1007,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '450px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            borderTop: '4px solid #EA580C'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              padding: '2rem 2rem 1rem 2rem',
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', color: '#C2410C' }}>
                <RefreshCw size={20} />
                <span>Clone Settings Configuration</span>
              </div>
              <button 
                type="button" 
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#9CA3AF', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => { setCloningSettingsInst(null); setSourceTenantId(''); }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCloneSettings} style={{ display: 'flex', flexDirection: 'column', margin: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 2rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Clone settings from a source institute to <strong>{cloningSettingsInst.name}</strong>. This will delete any current settings on the target and copy the source configuration.
                </p>
                
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Source Institute</label>
                  <select
                    value={sourceTenantId}
                    onChange={(e) => setSourceTenantId(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', backgroundColor: '#FFFFFF' }}
                    required
                  >
                    <option value="">Select source tenant...</option>
                    {institutes.filter(inst => inst.id !== cloningSettingsInst.id).map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name} ({inst.subdomain})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#FFFFFF', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', position: 'sticky', bottom: 0, zIndex: 2 }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, backgroundColor: '#EA580C', color: 'white', border: 'none', justifyContent: 'center', height: '2.75rem' }}
                  disabled={loading || !sourceTenantId}
                >
                  Clone Now
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', height: '2.75rem' }}
                  onClick={() => { setCloningSettingsInst(null); setSourceTenantId(''); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;