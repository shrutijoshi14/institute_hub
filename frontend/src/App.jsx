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

// New Role Dashboards
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import TransportDashboard from './pages/TransportDashboard';

// Authentication
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/enquiry" element={<PublicEnquiry />} />
          
          {/* Secured Application Shell */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardRouter />} />
            
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
            
            {/* Global Features (Data naturally isolated inside views) */}
            <Route path="notices" element={<Notices />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="settings" element={<Settings />} />

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
