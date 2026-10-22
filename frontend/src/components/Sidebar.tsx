import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  HeartHandshake,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Award,
  FileText,
  CreditCard,
  Receipt,
  TrendingDown,
  Briefcase,
  Library,
  Box,
  Megaphone,
  BarChart3,
  ShieldCheck,
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.role_name || 'student';

  const isAllowed = (allowedRoles: string[]) => {
    if (role === 'super_admin') return true;
    return allowedRoles.includes(role);
  };

  const menuSections = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['super_admin', 'headteacher', 'teacher', 'accountant', 'parent', 'student'] },
      ]
    },
    {
      title: 'Students & Enrollment',
      roles: ['super_admin', 'headteacher', 'teacher', 'accountant', 'parent'],
      items: [
        { label: 'Student Directory', path: '/students', icon: Users, roles: ['super_admin', 'headteacher', 'teacher', 'accountant', 'parent'] },
        { label: 'Register Student', path: '/students/new', icon: UserPlus, roles: ['super_admin', 'headteacher'] },
        { label: 'Parents & Guardians', path: '/guardians', icon: HeartHandshake, roles: ['super_admin', 'headteacher', 'teacher'] },
      ]
    },
    {
      title: 'Academics & Attendance',
      roles: ['super_admin', 'headteacher', 'teacher', 'student', 'parent'],
      items: [
        { label: 'Classes & Subjects', path: '/classes-subjects', icon: BookOpen, roles: ['super_admin', 'headteacher', 'teacher'] },
        { label: 'Attendance Register', path: '/attendance', icon: ClipboardCheck, roles: ['super_admin', 'headteacher', 'teacher', 'parent', 'student'] },
        { label: 'Timetable & Calendar', path: '/timetable', icon: CalendarDays, roles: ['super_admin', 'headteacher', 'teacher', 'parent', 'student'] },
      ]
    },
    {
      title: 'Examinations & Reports',
      roles: ['super_admin', 'headteacher', 'teacher', 'student', 'parent'],
      items: [
        { label: 'Marks & Assessment', path: '/assessments', icon: Award, roles: ['super_admin', 'headteacher', 'teacher'] },
        { label: 'Terminal Report Cards', path: '/report-cards', icon: FileText, roles: ['super_admin', 'headteacher', 'teacher', 'parent', 'student'] },
      ]
    },
    {
      title: 'Fees & Accounting',
      roles: ['super_admin', 'headteacher', 'accountant', 'parent'],
      items: [
        { label: 'Fees & Invoices', path: '/fees-invoices', icon: CreditCard, roles: ['super_admin', 'headteacher', 'accountant', 'parent'] },
        { label: 'Payments & Receipts', path: '/payments', icon: Receipt, roles: ['super_admin', 'headteacher', 'accountant', 'parent'] },
        { label: 'Expenses & Statements', path: '/expenses', icon: TrendingDown, roles: ['super_admin', 'headteacher', 'accountant'] },
      ]
    },
    {
      title: 'Staff & Resources',
      roles: ['super_admin', 'headteacher', 'teacher'],
      items: [
        { label: 'Teachers & Staff', path: '/staff', icon: Briefcase, roles: ['super_admin', 'headteacher'] },
        { label: 'Library Catalog', path: '/library', icon: Library, roles: ['super_admin', 'headteacher', 'teacher', 'student'] },
        { label: 'School Assets Inventory', path: '/inventory', icon: Box, roles: ['super_admin', 'headteacher', 'accountant'] },
      ]
    },
    {
      title: 'Communication & Analytics',
      roles: ['super_admin', 'headteacher', 'teacher', 'parent', 'student', 'accountant'],
      items: [
        { label: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['super_admin', 'headteacher', 'teacher', 'parent', 'student', 'accountant'] },
        { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['super_admin', 'headteacher', 'accountant'] },
      ]
    },
    {
      title: 'System & Admin',
      roles: ['super_admin', 'headteacher'],
      items: [
        { label: 'User Accounts & Roles', path: '/users', icon: ShieldCheck, roles: ['super_admin'] },
        { label: 'School Settings', path: '/settings', icon: Settings, roles: ['super_admin', 'headteacher'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-18 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-teal-400 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight">CHARITY PREPARATORY</h1>
              <p className="text-[11px] font-medium text-teal-400 uppercase tracking-wider">Basic School System</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuSections.map((section, sIdx) => {
            if (section.roles && !isAllowed(section.roles)) return null;

            const visibleItems = section.items.filter(item => isAllowed(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
                <div className="space-y-0.5 pt-1">
                  {visibleItems.map((item, iIdx) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <NavLink
                        key={iIdx}
                        to={item.path}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`
                          flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                          ${isActive 
                            ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Academic Year Footer Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Academic Year 2025/2026</p>
            <p className="text-[11px] text-teal-400">Term 2 Active</p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            GH₵ (GHS)
          </span>
        </div>
      </aside>
    </>
  );
};
