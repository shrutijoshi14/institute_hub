import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import Enquiries from './pages/Enquiries';
import AdminFees from './pages/AdminFees';
import StudentFees from './pages/StudentFees';
import StudentProfile from './pages/StudentProfile';
import Notices from './pages/Notices';

// Newly implemented dynamic pages
import Faculty from './pages/Faculty';
import Syllabus from './pages/Syllabus';
import AdminSyllabusTracker from './pages/AdminSyllabusTracker';
import StudentSyllabusTracker from './pages/StudentSyllabusTracker';
import Batches from './pages/Batches';
import Registrations from './pages/Registrations';
import Attendance from './pages/Attendance';
import Results from './pages/Results';
import Assignments from './pages/Assignments';
import AdminReports from './pages/AdminReports';
import ParentDashboard from './pages/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentManagement from './pages/StudentManagement';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import PublicEnquiry from './pages/PublicEnquiry';
import FacultyDailyTracker from './pages/FacultyDailyTracker';
import AcademicPromotion from './pages/AcademicPromotion';
import ArchiveSystem from './pages/ArchiveSystem';
import StorageManager from './pages/StorageManager';

// New Role Dashboards
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import TransportDashboard from './pages/TransportDashboard';

// Authentication
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import SuperAdminLogin from './pages/Auth/SuperAdminLogin';
import SupportCenter from './pages/SupportCenter';

import ForceChangePassword from './pages/Auth/ForceChangePassword';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    const search = window.location.search;
    return <Navigate to={`/login${search}`} replace />;
  }
  if (user.mustChangePassword) {
    return <ForceChangePassword />;
  }
  return children;
};

// We dynamically render the dashboard based on role
const DashboardRouter = () => {
  const { role } = useAuth();
  if (role === 'super-admin') return <SuperAdminDashboard />;
  if (role === 'student') return <StudentDashboard />;
  if (role === 'parent') return <ParentDashboard />;
  if (role === 'faculty') return <TeacherDashboard />;
  if (role === 'accountant') return <AccountantDashboard />;
  if (role === 'receptionist') return <ReceptionistDashboard />;
  if (role === 'librarian') return <LibrarianDashboard />;
  if (role === 'transport-manager') return <TransportDashboard />;
  return <Dashboard />; // Admin dashboard fallback
};

function App() {
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Find open modal overlay by checking standard overlay classes or fixed containers
      const modalOverlay = document.querySelector('.modal-overlay, .saas-modal-overlay, [style*="position: fixed"][style*="rgba(0, 0, 0"]');
      if (!modalOverlay) return;

      const modalContent = modalOverlay.querySelector('.modal-content, .card, [style*="backgroundColor: white"], [style*="background-color: white"]');
      if (!modalContent) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        // Find close/cancel/done buttons and trigger click
        const closeBtn = modalContent.querySelector('.modal-header button, .saas-modal-header button, button.close');
        const cancelBtn = Array.from(modalContent.querySelectorAll('button')).find(btn => {
          const text = btn.textContent.trim().toLowerCase();
          return text === '×' || text === 'x' || text.includes('close') || text.includes('cancel') || text.includes('done');
        });
        const finalCloseBtn = closeBtn || cancelBtn;
        if (finalCloseBtn) {
          finalCloseBtn.click();
        }
      } else if (e.key === 'Enter') {
        // Do not intercept Enter if typing inside textareas or editable layers
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
          return;
        }

        // Find primary action buttons (Save, Add, Create, Submit, Confirm, Access, Done, Run, Impersonate)
        const actionBtn = Array.from(modalContent.querySelectorAll('button, input[type="submit"]')).find(btn => {
          const text = btn.textContent.trim().toLowerCase();
          if (text.includes('cancel') || text.includes('close') || text === '×' || text === 'x') {
            return false;
          }
          return (
            text.includes('save') || 
            text.includes('add') || 
            text.includes('create') || 
            text.includes('submit') || 
            text.includes('confirm') || 
            text.includes('access') || 
            text.includes('done') || 
            text.includes('clone') || 
            text.includes('promote') || 
            text.includes('run') ||
            text.includes('impersonate') ||
            btn.type === 'submit'
          );
        });

        if (actionBtn) {
          e.preventDefault();
          actionBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/enquiry" element={<PublicEnquiry />} />
          
          {/* Dynamic subpath mapping for cleaner tenant URLs */}
          <Route path="/:tenantSubdomain" element={<Navigate to="/login" replace />} />
          <Route path="/:tenantSubdomain/login" element={<Login />} />
          <Route path="/:tenantSubdomain/enquiry" element={<PublicEnquiry />} />
          
          {/* Secured Application Shell */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardRouter />} />
            <Route path="register" element={<Register />} />
            
            {/* Admin Modules */}
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="registrations" element={<Registrations />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="faculty" element={<Faculty />} />
            <Route path="batches" element={<Batches />} />
            <Route path="syllabus" element={<Syllabus />} />
            <Route path="admin/fees" element={<AdminFees />} />
            <Route path="admin/reports" element={<AdminReports />} />
            <Route path="admin/promotions" element={<AcademicPromotion />} />
            <Route path="admin/archive" element={<ArchiveSystem />} />
            <Route path="admin/storage" element={<StorageManager />} />
            
            {/* Global Features (Data naturally isolated inside views) */}
            <Route path="notices" element={<Notices />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="settings" element={<Settings />} />
            <Route path="support" element={<SupportCenter />} />

            {/* Role Specific Views */}
            <Route path="student/fees" element={<StudentFees />} />
            <Route path="student/profile" element={<StudentProfile />} />
            
            <Route path="admin/attendance" element={<Attendance />} />
            <Route path="student/attendance" element={<Attendance />} />
            <Route path="daily-tracker" element={<FacultyDailyTracker />} />
            
            <Route path="admin/results" element={<Results />} />
            <Route path="student/results" element={<Results />} />

            <Route path="admin/syllabus-tracker" element={<AdminSyllabusTracker />} />
            <Route path="student/syllabus-tracker" element={<StudentSyllabusTracker />} />
          </Route>

          {/* Fallback route to prevent blank pages on unmatched URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
