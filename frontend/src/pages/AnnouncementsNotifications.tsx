import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Bell, Radio, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Announcement } from '../types';

export const AnnouncementsNotifications: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Announcement Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('NORMAL');

  // External SMS dispatch test
  const [smsRecipient, setSmsRecipient] = useState<string>('+233240000000');
  const [smsMessage, setSmsMessage] = useState<string>('Dear parent, this is an official notice from Charity Preparatory School.');
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  useEffect(() => {
    fetchCommData();
  }, []);

  const fetchCommData = async () => {
    setIsLoading(true);
    try {
      const [annRes, gwRes] = await Promise.all([
        api.get('/communication/announcements'),
        api.get('/communication/gateway-status')
      ]);
      setAnnouncements(annRes.data.announcements || []);
      setGatewayStatus(gwRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/communication/announcements', {
        title,
        content,
        target_role: targetRole,
        priority
      });
      setShowModal(false);
      setTitle('');
      setContent('');
      fetchCommData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create announcement');
    }
  };

  const handleSendExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setDispatchResult(null);
    try {
      const res = await api.post('/communication/send-external-message', {
        channel: 'SMS',
        recipient: smsRecipient,
        message: smsMessage
      });
      setDispatchResult({ success: true, message: res.data.message });
    } catch (err: any) {
      setDispatchResult({
        success: false,
        error: err.response?.data?.error || 'Integration unavailable. SMS gateway credentials missing in .env.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <span>School Announcements & Communication</span>
          </h1>
          <p className="text-xs text-slate-500">Publish notices to learners, parents, and teachers with live gateway statuses</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Gateway Status Cards (Section 11 Requirement) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">SMS Gateway</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              gatewayStatus?.sms?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {gatewayStatus?.sms?.status || 'UNCONFIGURED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{gatewayStatus?.sms?.message}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Email SMTP Gateway</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              gatewayStatus?.email?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {gatewayStatus?.email?.status || 'UNCONFIGURED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{gatewayStatus?.email?.message}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">WhatsApp Cloud Gateway</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              gatewayStatus?.whatsapp?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {gatewayStatus?.whatsapp?.status || 'UNCONFIGURED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{gatewayStatus?.whatsapp?.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Current Active Notices ({announcements.length})</h2>
          {announcements.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No active announcements found.
            </div>
          ) : (
            announcements.map(ann => (
              <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      Target: {ann.target_role}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ann.priority === 'HIGH' || ann.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ann.priority}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Published by: <b>{ann.publisher_name || 'Administration'}</b></span>
                  <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* External SMS Dispatcher Test Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Radio className="w-4 h-4 text-teal-600" />
            <span>Send External SMS Alert</span>
          </div>
          <p className="text-xs text-slate-500">
            Tests provider connectivity with real Ghanaian phone numbers.
          </p>

          {dispatchResult && (
            <div className={`p-3 rounded-xl border text-xs font-semibold ${
              dispatchResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              {dispatchResult.success ? dispatchResult.message : dispatchResult.error}
            </div>
          )}

          <form onSubmit={handleSendExternal} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Recipient Phone Number</label>
              <input
                type="tel"
                required
                value={smsRecipient}
                onChange={(e) => setSmsRecipient(e.target.value)}
                placeholder="+233 24 123 4567"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">SMS Message Content</label>
              <textarea
                rows={3}
                required
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Verifying Gateway...' : 'Dispatch Message'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Publish School Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Term Vacation Date"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Detailed Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write announcement body..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="ALL">Everyone (School-Wide)</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Notice</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-slate-950 rounded-lg font-bold">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
