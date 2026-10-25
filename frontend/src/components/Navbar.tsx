import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Calendar,
  QrCode,
  Smartphone,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { NotificationItem } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrData, setQrData] = useState<any>(null);

  const openQrModal = async () => {
    setShowQrModal(true);
    try {
      const res = await api.get('/auth/2fa/qr-setup');
      setQrData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/communication/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {
      // ignore
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.post(`/communication/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  const demoAccounts = [
    { label: 'Super Admin', name: 'Dr. Nana Osei Tutu', email: 'admin@school.edu.gh', pass: 'Admin@123', color: 'bg-red-500/10 text-red-600 border-red-200' },
    { label: 'Headteacher', name: 'Mrs. Gladys Boateng', email: 'headteacher@school.edu.gh', pass: 'Head@123', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
    { label: 'Teacher', name: 'Mr. Kwame Mensah', email: 'kwame.mensah@school.edu.gh', pass: 'Teacher@123', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    { label: 'Accountant', name: 'Mr. Emmanuel Amponsah', email: 'accountant@school.edu.gh', pass: 'Bursar@123', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
    { label: 'Parent', name: 'Mr. Kofi Annan Dankwa', email: 'parent.kofi@gmail.com', pass: 'Parent@123', color: 'bg-teal-500/10 text-teal-700 border-teal-200' },
    { label: 'Student', name: 'Ama Serwaa Dankwa (P5)', email: 'student.ama@school.edu.gh', pass: 'Student@123', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  ];

  const handleRoleSwitch = async (email: string, pass: string) => {
    setShowRoleMenu(false);
    try {
      await switchDemoRole(email, pass);
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Role switch failed');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-xs flex items-center justify-between px-4 lg:px-8">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-teal-600" />
          <span>2025/2026 Academic Year</span>
          <span className="text-slate-300">•</span>
          <span className="font-semibold text-slate-700">Term 2</span>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Notification Bell, User Menu */}
      <div className="flex items-center space-x-3">
        {/* 2FA Phone QR Code Scanner Button */}
        <button
          type="button"
          onClick={openQrModal}
          className="flex items-center space-x-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
          title="Scan QR Code with Google Authenticator on your phone"
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">📱 2FA Phone QR</span>
        </button>

        {/* Quick Role Switcher Pill (Great for Pair Programming & Testing all 6 portals) */}
        <div className="relative">
          <button
            onClick={() => { setShowRoleMenu(!showRoleMenu); setShowNotifMenu(false); setShowUserMenu(false); }}
            className="flex items-center space-x-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-2xs"
            title="Switch demo role to preview portal permissions"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden md:inline">Role:</span>
            <span className="capitalize font-bold text-amber-800">{user?.role_name?.replace('_', ' ') || 'Guest'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">Quick Role Switcher</p>
                <p className="text-[11px] text-slate-500">Test different Ghanaian school portal views</p>
              </div>
              <div className="py-1 space-y-1">
                {demoAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRoleSwitch(acc.email, acc.pass)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between transition group"
                  >
                    <div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mr-1.5 ${acc.color}`}>
                        {acc.label}
                      </span>
                      <p className="font-medium text-slate-800">{acc.name}</p>
                    </div>
                    {user?.email === acc.email && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowRoleMenu(false); setShowUserMenu(false); }}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[11px] font-semibold text-teal-600">{unreadCount} Unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-center text-slate-500">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition ${!n.is_read ? 'bg-amber-50/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{n.title}</span>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowRoleMenu(false); setShowNotifMenu(false); }}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role_name?.replace('_', ' ') || 'Role'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <span>Account Settings</span>
              </button>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Phone QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Phone Authentication (2FA)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Open <b>Google Authenticator</b> or your phone camera to scan your school QR code:
            </p>

            <div className="my-3.5 p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-inner">
              <img
                src={qrData?.qr_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `otpauth://totp/Charity%20Preparatory%20School:${user?.username || 'admin'}?secret=${qrData?.secret || 'JBSWY3DPEHPK3PXP'}&issuer=Charity%20Preparatory%20School`
                )}`}
                alt="2FA QR Code"
                className="w-44 h-44 mx-auto rounded-lg"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-left text-[11px] space-y-1">
              <p><b>Account:</b> {user?.username} ({user?.email})</p>
              <p><b>Secret Key:</b> <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 font-bold text-slate-700">{qrData?.secret || 'JBSWY3DPEHPK3PXP'}</span></p>
            </div>

            <p className="text-[11px] text-emerald-700 font-medium mt-3 bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200">
              ✓ Once scanned, your phone will generate 6-digit codes to log in anytime!
            </p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="mt-4 w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
