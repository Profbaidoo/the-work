import React, { useState, useEffect } from 'react';
import { Briefcase, UserCheck, Calendar, Phone, Mail, Award, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';

export const TeacherStaffManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'teachers' | 'staff' | 'attendance'>('teachers');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const [tRes, sRes, attRes] = await Promise.all([
        api.get('/staff/teachers'),
        api.get('/staff/non-teaching'),
        api.get(`/staff/attendance?date=${attendanceDate}`)
      ]);
      setTeachers(tRes.data.teachers || []);
      setStaff(sRes.data.staff || []);
      setAttendanceRecords(attRes.data.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllPresent = async () => {
    const entries: any[] = [];
    teachers.forEach(t => entries.push({ teacher_id: t.id, status: 'PRESENT' }));
    staff.forEach(s => entries.push({ staff_id: s.id, status: 'PRESENT' }));

    try {
      await api.post('/staff/attendance', {
        date: attendanceDate,
        entries
      });
      alert('Staff attendance recorded!');
      fetchStaffData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record attendance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Teachers & Staff Management</span>
          </h1>
          <p className="text-xs text-slate-500">Personnel records, qualifications, and staff daily check-in register</p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'teachers' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Teachers ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'staff' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Non-Teaching ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'attendance' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Daily Staff Attendance
          </button>
        </div>
      </div>

      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 font-bold text-base flex items-center justify-center">
                  {t.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.full_name}</h3>
                  <span className="font-mono text-[11px] font-semibold text-amber-700">{t.staff_id}</span>
                </div>
              </div>
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                <p><b>Specialization:</b> {t.specialization || 'General Subjects'}</p>
                <p><b>Qualification:</b> {t.qualification || 'B.Ed. Basic Education'}</p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.phone || '+233 24 000 0000'}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.email}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-800 font-bold text-base flex items-center justify-center">
                  {s.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{s.full_name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {s.role_title}
                  </span>
                </div>
              </div>
              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                <p><b>Department:</b> {s.department || 'Administration'}</p>
                <p><b>Staff ID:</b> {s.staff_id}</p>
                <p><b>Phone:</b> {s.phone}</p>
                <p><b>Status:</b> <span className="font-semibold text-emerald-700">{s.employment_status}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-700">Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => { setAttendanceDate(e.target.value); fetchStaffData(); }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={markAllPresent}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark All Staff Present</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">Staff Code</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Position</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No attendance recorded yet for {attendanceDate}. Click &ldquo;Mark All Staff Present&rdquo; to check in.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{r.staff_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.role}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
