import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, HelpCircle, Smartphone, QrCode, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const Login: React.FC = () => {
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState<string>('admin@school.edu.gh');
  const [password, setPassword] = useState<string>('Admin@123');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // 2FA / QR Modal States
  const [show2FAModal, setShow2FAModal] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(identifier, password);
      if (result && result.two_factor_required) {
        setTempToken(result.temp_token);
        // Setup QR code preview for user
        const otpauthUri = encodeURIComponent(`otpauth://totp/Charity%20Preparatory%20School:${identifier}?secret=JBSWY3DPEHPK3PXP&issuer=Charity%20Preparatory%20School`);
        setQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${otpauthUri}`);
        setShow2FAModal(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setIsVerifyingOtp(true);
    try {
      await verify2FA(tempToken, otpCode);
      setShow2FAModal(false);
      navigate('/');
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Invalid 6-digit code or backup code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const demoPresets = [
    { label: 'Super Admin', email: 'admin@school.edu.gh', pass: 'Admin@123', color: 'border-red-300 bg-red-50 text-red-800' },
    { label: 'Headteacher', email: 'headteacher@school.edu.gh', pass: 'Head@123', color: 'border-purple-300 bg-purple-50 text-purple-800' },
    { label: 'Teacher', email: 'kwame.mensah@school.edu.gh', pass: 'Teacher@123', color: 'border-blue-300 bg-blue-50 text-blue-800' },
    { label: 'Accountant / Bursar', email: 'accountant@school.edu.gh', pass: 'Bursar@123', color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { label: 'Parent Portal', email: 'parent.kofi@gmail.com', pass: 'Parent@123', color: 'border-teal-300 bg-teal-50 text-teal-800' },
    { label: 'Student Portal', email: 'student.ama@school.edu.gh', pass: 'Student@123', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  ];

  const applyPreset = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-400 p-1 shadow-xl mb-4">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
            <GraduationCap className="w-9 h-9 text-amber-400" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Charity Preparatory School
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Ghanaian Basic School Information & Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Username or Email Address
              </label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  placeholder="e.g. admin@school.edu.gh"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-amber-600 hover:text-amber-500"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* New User Registration Link */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/register"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New user, parent, or student? Register / Sign Up</span>
            </Link>
          </div>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>1-Click Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-400">Ghanaian Roles</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p.email, p.pass)}
                  className={`text-left px-2.5 py-1.5 rounded-lg border text-xs font-medium transition hover:shadow-xs ${p.color}`}
                >
                  <p className="font-bold truncate">{p.label}</p>
                  <p className="text-[10px] opacity-75 truncate">{p.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Charity Preparatory School &bull; Accra, Ghana &bull; Academic Year 2025/2026
        </p>
      </div>

      {/* 2FA Mobile QR Code & OTP Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Phone Authentication (2FA)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Scan this QR code with <b>Google Authenticator</b> or your phone camera to get your 6-digit code:
            </p>

            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block">
              <img
                src={qrImageUrl}
                alt="2FA QR Code"
                className="w-40 h-40 mx-auto rounded-lg shadow-sm"
              />
            </div>

            {otpError && (
              <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit Code from Phone:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-2xl font-mono font-bold py-2 border-2 border-amber-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-lg text-xs hover:from-amber-600 hover:to-amber-700 transition disabled:opacity-50"
              >
                {isVerifyingOtp ? 'Verifying...' : 'Verify & Log In'}
              </button>
            </form>

            <button
              onClick={() => setShow2FAModal(false)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Password Recovery</h3>
            <p className="text-xs text-slate-600 mt-2">
              For security reasons, password resets in the Basic School Management System are authorized by the school IT administrator or Headteacher.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200">
              <p><b>ICT Office:</b> Administration Block, Room 102</p>
              <p><b>Support Hotline:</b> +233 256331492</p>
              <p><b>Email:</b> support@charitypreparatory.edu.gh</p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="mt-5 w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
