import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, Filter, Save, CheckCircle2, UserX, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { ClassLevel, RegisterEntry } from '../types';

export const AttendanceRegister: React.FC = () => {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [register, setRegister] = useState<RegisterEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/attendance/stats')
      ]);
      setClasses(cRes.data.classes || []);
      setStats(sRes.data);
      if (cRes.data.classes && cRes.data.classes.length > 0) {
        const p5 = cRes.data.classes.find((c: any) => c.code === 'P5') || cRes.data.classes[0];
        setSelectedClassId(p5.id);
        loadRegister(p5.id, selectedDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRegister = async (classId: number, dateStr: string) => {
    setIsLoading(true);
    setSuccessMsg('');
    try {
      const res = await api.get(`/attendance/register?class_id=${classId}&date=${dateStr}`);
      setRegister(res.data.register || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, newStatus: any) => {
    setRegister(prev => prev.map(item => {
      if (item.student_id === studentId) {
        return {
          ...item,
          status: newStatus,
          parent_notified: newStatus === 'ABSENT' ? true : item.parent_notified
        };
      }
      return item;
    }));
  };

  const handleReasonChange = (studentId: number, reason: string) => {
    setRegister(prev => prev.map(item =>
      item.student_id === studentId ? { ...item, reason } : item
    ));
  };

  const handleToggleNotify = (studentId: number) => {
    setRegister(prev => prev.map(item =>
      item.student_id === studentId ? { ...item, parent_notified: !item.parent_notified } : item
    ));
  };

  const handleMarkAll = (status: any) => {
    setRegister(prev => prev.map(item => ({ ...item, status })));
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      const entries = register.map(item => ({
        student_id: item.student_id,
        status: item.status === 'NOT_RECORDED' ? 'PRESENT' : item.status,
        reason: item.reason,
        parent_notified: item.parent_notified
      }));
      await api.post('/attendance/bulk', {
        class_id: selectedClassId,
        date: selectedDate,
        entries
      });
      setSuccessMsg('Attendance register recorded successfully!');
      // refresh stats
      const sRes = await api.get('/attendance/stats');
      setStats(sRes.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = register.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = register.filter(r => r.status === 'ABSENT').length;
  const totalCount = register.length;
  const currentRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
            <span>Daily Attendance Register</span>
          </h1>
          <p className="text-xs text-slate-500">Record and track present, absent, late, or excused learners by class and date</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="px-3 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || register.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Register'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Class & Date Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <label className="font-semibold text-slate-700">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const cId = Number(e.target.value);
                setSelectedClassId(cId);
                loadRegister(cId, selectedDate);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
            >
              {classes.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.name} ({cl.code})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="font-semibold text-slate-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (selectedClassId) loadRegister(Number(selectedClassId), e.target.value);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
            />
          </div>
        </div>

        {/* Real-time Rate Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            {presentCount} Present
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-bold border border-red-200">
            {absentCount} Absent
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
            {currentRate}% Rate
          </span>
        </div>
      </div>

      {/* Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Adm. No.</th>
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-center">Alert Parent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading class register...
                  </td>
                </tr>
              ) : register.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active students enrolled in this class.
                  </td>
                </tr>
              ) : (
                register.map((item) => (
                  <tr key={item.student_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {item.admission_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.student_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.gender}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(item.student_id, st)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                              item.status === st
                                ? (st === 'PRESENT' ? 'bg-emerald-600 text-white' :
                                   st === 'ABSENT' ? 'bg-red-600 text-white' :
                                   st === 'LATE' ? 'bg-amber-500 text-slate-950' : 'bg-blue-600 text-white')
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.reason || ''}
                        onChange={(e) => handleReasonChange(item.student_id, e.target.value)}
                        placeholder="Optional note / reason..."
                        className="w-full px-2.5 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.parent_notified}
                        onChange={() => handleToggleNotify(item.student_id)}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                        title="Flag for automated absence alert"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequent Absence Alert Section */}
      {stats?.frequent_absentees && stats.frequent_absentees.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Frequent Absences Flagged (Attendance Alert)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stats.frequent_absentees.map((st: any, i: number) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-slate-900">{st.name}</span>
                <p className="text-[11px] text-slate-500">{st.class_name} &bull; {st.admission_number}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                  {st.absent_days} recorded absences
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
