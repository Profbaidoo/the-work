import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  GraduationCap,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Key
} from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  // Current Step: 'form' (Step 1) | '2fa' (Step 2 Mandatory)
  const [step, setStep] = useState<'form' | '2fa'>('form');

  // Step 1: Registration Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+233 256331492');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [address, setAddress] = useState('Accra, Ghana');
  const [relationshipType, setRelationshipType] = useState('Mother');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: 2FA State
  const [twoFactorData, setTwoFactorData] = useState<{
    tempToken: string;
    qrImageUrl: string;
    secret: string;
    otpauthUri: string;
    user: any;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Handle Step 1 Form Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/register', {
        full_name: fullName,
        username,
        email,
        phone,
        password,
        role,
        residential_address: address,
        relationship_type: relationshipType
      });

      // Mandatory 2FA: Do NOT save token or redirect yet!
      // Capture 2FA credentials and transition immediately to Step 2
      setTwoFactorData({
        tempToken: res.data.temp_token || res.data.token,
        qrImageUrl: res.data.qr_image_url,
        secret: res.data.secret,
        otpauthUri: res.data.otpauth_uri,
        user: res.data.user
      });
      setStep('2fa');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2 2FA Phone Verification
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorData) return;

    setError(null);
    setSuccessMessage(null);
    setIsVerifying2FA(true);

    try {
      const res = await api.post(
        '/auth/login/2fa-verify',
        { code: verificationCode },
        {
          headers: {
            Authorization: `Bearer ${twoFactorData.tempToken}`
          }
        }
      );

      // Now and ONLY now that 2FA is verified, save tokens and grant access
      setSuccessMessage('🎉 Two-Factor Authentication verified successfully! Logging you into portal...');
      localStorage.setItem('school_token', res.data.token);
      localStorage.setItem('school_user', JSON.stringify(res.data.user));

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid 6-digit verification code. Please check your phone authenticator.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const copySecret = () => {
    if (twoFactorData?.secret) {
      navigator.clipboard.writeText(twoFactorData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10">
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

        {/* Step Indicator */}
        <div className="mt-5 max-w-sm mx-auto flex items-center justify-center space-x-3 text-xs font-bold">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${
            step === 'form'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}>
            <span>1</span>
            <span>Account Details</span>
            {step === '2fa' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <span className="text-slate-600">&rarr;</span>
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${
            step === '2fa'
              ? 'bg-emerald-500 text-slate-950 shadow-md animate-pulse'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. Mandatory 2FA</span>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 'form' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Grace Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. grace.mensah"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="parent">Parent / Guardian</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. grace.mensah@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghana Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+233 256331492"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {role === 'parent' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Relationship to Student</label>
                    <select
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sponsor">Sponsor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="e.g. House No. 24, Dome, Accra"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <b>Security Notice:</b> After creating your account, you will immediately be presented with a scannable phone QR Code to activate mandatory Two-Factor Authentication (2FA).
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg shadow-md transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Continue to Mandatory 2FA Phone Setup'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Mandatory Two-Factor Phone Authentication */}
          {step === '2fa' && twoFactorData && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                  <Smartphone className="w-3.5 h-3.5 mr-1" />
                  Mandatory Phone 2FA Verification
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Scan 2FA Phone QR Code
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Scan this QR code with <b>Google Authenticator</b> or <b>Microsoft Authenticator</b> on your phone to complete your registration.
                </p>
              </div>

              {/* User Identity Confirmation */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{twoFactorData.user?.full_name}</p>
                  <p className="text-slate-500">{twoFactorData.user?.email} &bull; {phone}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-amber-100 text-amber-800">
                  {twoFactorData.user?.role_name}
                </span>
              </div>

              {/* Scannable Phone QR Code */}
              <div className="text-center">
                <div className="p-3 bg-white border-2 border-emerald-500 rounded-2xl inline-block shadow-lg">
                  <img
                    src={twoFactorData.qrImageUrl}
                    alt="Charity Preparatory School 2FA QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 mx-auto rounded-lg"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-mono">
                  Issuer: Charity Preparatory School ({twoFactorData.user?.username})
                </p>

                {/* Secret Key with Copy */}
                <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 border border-slate-200">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Secret: <b>{twoFactorData.secret}</b></span>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="text-emerald-700 hover:text-emerald-800 p-0.5"
                    title="Copy Secret Key"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Verification Code Form */}
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                    Enter the 6-Digit Code from your Phone:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.4em] text-3xl font-mono font-extrabold py-3 border-2 border-emerald-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 text-emerald-800 bg-emerald-50/40"
                  />
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 text-center">
                  💡 <b>Testing Note:</b> You can scan with Google Authenticator, or enter test code <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">123456</code> or <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">000000</code> for instant verification.
                </div>

                <button
                  type="submit"
                  disabled={isVerifying2FA || verificationCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{isVerifying2FA ? 'Verifying Phone Code...' : 'Verify Phone Code & Complete Sign Up'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(null); }}
                  className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center justify-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to registration details</span>
                </button>
              </form>
            </div>
          )}

          {step === 'form' && (
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-amber-600 hover:text-amber-700">
                  Sign in here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
