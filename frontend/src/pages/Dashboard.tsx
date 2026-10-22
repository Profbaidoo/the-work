import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  BookOpen,
  UserCheck,
  UserX,
  CreditCard,
  AlertCircle,
  Calendar,
  UserPlus,
  ClipboardCheck,
  Award,
  Receipt,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, chartsRes, actRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/recent-activities')
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setActivities(actRes.data.activities || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0D9488', '#EF4444', '#3B82F6', '#D97706', '#8B5CF6'];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Gathering School Analytics...</p>
        </div>
      </div>
    );
  }

  const role = user?.role_name || 'student';

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {user?.role_display_name || 'Welcome'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Welcome, {user?.full_name}!
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Achimota Royal Basic Academy &bull; Term 2 Dashboard & Academic Overview
          </p>
        </div>

        {/* Quick Action Buttons */}
        {['super_admin', 'headteacher', 'teacher', 'accountant'].includes(role) && (
          <div className="flex flex-wrap items-center gap-2">
            {['super_admin', 'headteacher'].includes(role) && (
              <button
                onClick={() => navigate('/students/new')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Student</span>
              </button>
            )}
            {['super_admin', 'headteacher', 'teacher'].includes(role) && (
              <>
                <button
                  onClick={() => navigate('/attendance')}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 shadow-sm transition"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Mark Attendance</span>
                </button>
                <button
                  onClick={() => navigate('/assessments')}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Enter Marks</span>
                </button>
              </>
            )}
            {['super_admin', 'headteacher', 'accountant'].includes(role) && (
              <button
                onClick={() => navigate('/payments')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Record Fee</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 8 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.total_students || 0}
          subtext="Enrolled in Nursery, KG, Primary & JHS"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Teachers & Staff"
          value={stats?.total_teachers_and_staff || 0}
          subtext={`${stats?.total_teachers || 0} Teachers, ${stats?.total_staff || 0} Non-Teaching`}
          icon={Briefcase}
          colorScheme="purple"
        />
        <StatCard
          title="Active Classes"
          value={stats?.active_classes || 13}
          subtext="Nursery 1 to JHS 3 with Streams"
          icon={BookOpen}
          colorScheme="amber"
        />
        <StatCard
          title="Today's Attendance"
          value={`${stats?.students_present_today || 0} Present`}
          subtext={`${stats?.students_absent_today || 0} Absent today`}
          icon={UserCheck}
          colorScheme="teal"
        />

        <StatCard
          title="Fees Collected"
          value={`GH₵ ${(stats?.total_fees_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext="Term 2 Verified Collections"
          icon={CreditCard}
          colorScheme="emerald"
        />
        <StatCard
          title="Outstanding Fees"
          value={`GH₵ ${(stats?.outstanding_school_fees || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext="Pending student balance & arrears"
          icon={AlertCircle}
          colorScheme="red"
        />
        <StatCard
          title="Students Absent"
          value={stats?.students_absent_today || 0}
          subtext="Unexcused / Reported absences"
          icon={UserX}
          colorScheme="red"
        />
        <StatCard
          title="Academic Term"
          value="Term 2"
          subtext="2025/2026 Academic Year"
          icon={Calendar}
          colorScheme="amber"
        />
      </div>

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Enrollment by Class */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-800">Student Enrollment by Class</h2>
              <p className="text-xs text-slate-500">Distribution across Nursery, KG, Primary and JHS</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">Real Database Stats</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.enrollment_by_class || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Learners" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Attendance Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-800">Attendance Trends (Recent Days)</h2>
              <p className="text-xs text-slate-500">Daily presence percentage calculated automatically</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">Daily Register</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.attendance_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Line type="monotone" dataKey="percentage" stroke="#0D9488" strokeWidth={3} dot={{ fill: '#0D9488', r: 4 }} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fees Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-sm text-slate-800">Fees Collected vs Outstanding</h2>
              <p className="text-xs text-slate-500">Ghana Cedis (GH₵)</p>
            </div>
          </div>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.fees_comparison || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  <Cell fill="#0D9488" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip formatter={(value: any) => `GH₵ ${Number(value).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Academic Performance by Subject */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-slate-800">Academic Performance by Subject</h2>
              <p className="text-xs text-slate-500">Average terminal test marks (%) across core subjects</p>
            </div>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.subject_performance || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="average" fill="#D97706" radius={[4, 4, 0, 0]} name="Subject Average %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming Events & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming School Events */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-800">Upcoming Events & Examinations</h2>
            <button
              onClick={() => navigate('/timetable')}
              className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center space-x-1"
            >
              <span>Full Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {(stats?.upcoming_events || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No upcoming events scheduled</p>
            ) : (
              (stats?.upcoming_events || []).map((ev: any, idx: number) => (
                <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase">{ev.start_date?.slice(5, 7)}</span>
                    <span className="text-xs font-black leading-none">{ev.start_date?.slice(8, 10)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{ev.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ev.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.is_holiday ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ev.event_type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent System Activities & Audit Trail */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-800">Recent System Activity</h2>
            <span className="text-xs text-slate-500">Live Audit Trail</span>
          </div>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent activities logged</p>
            ) : (
              activities.slice(0, 5).map((act: any, idx: number) => (
                <div key={idx} className="flex items-start space-x-3 text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium truncate">{act.details || act.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By {act.user_name} &bull; {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
