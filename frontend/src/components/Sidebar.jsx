import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, BookOpen, GraduationCap, DollarSign, MessageSquare, ClipboardList, Send, FileText, BarChart, Settings, Shield, Archive } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, settings, onNavItemClick }) => {
  const { role } = useAuth();
  
  const schoolName = settings?.schoolName || 'Institute Hub';
  const logoUrl = settings?.logoUrl || null;
  const iconName = settings?.iconName || 'GraduationCap';
  const BrandIcon = LucideIcons[iconName] || LucideIcons.GraduationCap;

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        {logoUrl && logoUrl.startsWith('http') ? (
          <img src={logoUrl} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }} />
        ) : (
          <BrandIcon size={28} className="text-primary" style={{ flexShrink: 0 }} />
        )}
        <span className="sidebar-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{schoolName}</span>
      </div>
      <nav className="sidebar-nav" onClick={(e) => {
        if (e.target.closest('a') && window.innerWidth <= 768) {
          if (onNavItemClick) onNavItemClick();
        }
      }}>
        
        {/* Common Dashboard Link */}
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} style={{ flexShrink: 0 }} />
          <span className="sidebar-text">
            {role === 'admin' ? 'Admin Dashboard' : 
             role === 'super-admin' ? 'Super Admin Desk' : 
             role === 'parent' ? 'Parent Panel' : 
             role === 'faculty' ? 'Teacher Dashboard' : 
             role === 'accountant' ? 'Accountant Desk' : 
             role === 'receptionist' ? 'Reception Desk' : 
             role === 'librarian' ? 'Library Desk' : 
             role === 'transport-manager' ? 'Transport Desk' : 
             'My Dashboard'}
          </span>
        </NavLink>

        {/* Administrative and Staff Links */}
        {['admin', 'super-admin', 'receptionist'].includes(role) && (
          <NavLink to="/enquiries" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <MessageSquare size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Enquiries</span>
          </NavLink>
        )}
        {['admin', 'super-admin', 'receptionist'].includes(role) && (
          <NavLink to="/registrations" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <UserPlus size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Registrations</span>
          </NavLink>
        )}
        {['admin', 'super-admin', 'receptionist', 'accountant', 'librarian', 'transport-manager'].includes(role) && (
          <NavLink to="/students" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Student Directory</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/faculty" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <GraduationCap size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Faculty</span>
          </NavLink>
        )}
        {['admin', 'super-admin', 'receptionist'].includes(role) && (
          <NavLink to="/batches" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Batches</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/syllabus" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Syllabus Master</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/admin/syllabus-tracker" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Syllabus Progress</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/admin/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Analytics & Reports</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/admin/promotions" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <GraduationCap size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Academic & Promotion</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/admin/archive" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Archive size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Archive System</span>
          </NavLink>
        )}
        {['admin', 'super-admin', 'accountant'].includes(role) && (
          <NavLink to="/admin/fees" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <DollarSign size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Fee Management</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/admin/attendance" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Attendance</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/daily-tracker" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Daily Tracker</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/admin/results" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Results</span>
          </NavLink>
        )}
        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/users" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Shield size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Portal Access</span>
          </NavLink>
        )}

        {['admin', 'super-admin'].includes(role) && (
          <NavLink to="/admin/storage" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LucideIcons.HardDrive size={20} style={{ flexShrink: 0 }} />
            <span className="sidebar-text">Storage Manager</span>
          </NavLink>
        )}

        <NavLink to="/support" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <LucideIcons.LifeBuoy size={20} style={{ flexShrink: 0 }} />
          <span className="sidebar-text">Support Center</span>
        </NavLink>

        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} style={{ flexShrink: 0 }} />
          <span className="sidebar-text">Settings</span>
        </NavLink>

        {/* Faculty Links */}
        {role === 'faculty' && (
          <>
            <NavLink to="/students" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">Students</span>
            </NavLink>
            <NavLink to="/admin/attendance" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">Mark Attendance</span>
            </NavLink>
            <NavLink to="/daily-tracker" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">Daily Tracker</span>
            </NavLink>
            <NavLink to="/admin/results" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">Manage Results</span>
            </NavLink>
            <NavLink to="/admin/syllabus-tracker" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">Update Syllabus</span>
            </NavLink>
          </>
        )}

        {/* Student/Parent Shared View Links */}
        {(role === 'student' || role === 'parent') && (
          <>
            <NavLink to="/student/profile" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">{role === 'parent' ? 'Child Profile' : 'My Profile'}</span>
            </NavLink>
            <NavLink to="/student/fees" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <DollarSign size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">{role === 'parent' ? 'Child Fees' : 'My Fees'}</span>
            </NavLink>
            <NavLink to="/student/results" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">{role === 'parent' ? 'Child Marks' : 'My Marks'}</span>
            </NavLink>
            <NavLink to="/student/attendance" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">{role === 'parent' ? 'Child Attendance' : 'My Attendance'}</span>
            </NavLink>
            <NavLink to="/student/syllabus-tracker" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-text">Syllabus Progress</span>
            </NavLink>
          </>
        )}

        {/* Assignments (Everyone) */}
        <NavLink to="/assignments" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} style={{ flexShrink: 0 }} />
          <span className="sidebar-text">{role === 'student' ? 'My Assignments' : role === 'parent' ? 'Child Homework' : 'Assignments'}</span>
        </NavLink>

        {/* Notice Board (Everyone) */}
        <NavLink to="/notices" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Send size={20} style={{ flexShrink: 0 }} />
          <span className="sidebar-text">Notice Board</span>
        </NavLink>

      </nav>
    </div>
  );
};

export default Sidebar;
