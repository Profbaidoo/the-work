import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Eye,
  FileText,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { Student, ClassLevel } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const StudentDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Promotion Dialog State
  const [selectedStudentForPromotion, setSelectedStudentForPromotion] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, classFilter, statusFilter]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academics/classes');
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (classFilter) params.append('class_id', classFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/students/export', '_blank');
  };

  const handleDownloadBiodata = (studentId: number) => {
    window.open(`/api/students/${studentId}/biodata-pdf`, '_blank');
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPromotion || !targetClassId) return;

    setIsPromoting(true);
    try {
      await api.post(`/students/${selectedStudentForPromotion.id}/promote`, {
        target_class_id: Number(targetClassId),
        academic_year_id: 1
      });
      alert(`Student successfully promoted!`);
      setSelectedStudentForPromotion(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Promotion failed');
    } finally {
      setIsPromoting(false);
    }
  };

  const canManage = ['super_admin', 'headteacher'].includes(user?.role_name || '');

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Student Directory & Records</span>
          </h1>
          <p className="text-xs text-slate-500">
            Official basic school enrollment list with filters, biodata printing, and promotions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {canManage && (
            <button
              onClick={() => navigate('/students/new')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learner by name or admission number..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-slate-500 text-xs">
            <Filter className="w-3.5 h-3.5" />
            <span>Class:</span>
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Classes</option>
            {classes.map(cl => (
              <option key={cl.id} value={cl.id}>{cl.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="GRADUATED">Graduated</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          <button
            onClick={fetchStudents}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Admission No.</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class & Stream</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Primary Guardian</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No students found matching current search criteria.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {st.admission_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {st.full_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{st.class_name || 'Unassigned'}</span>
                      {st.stream_name && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {st.stream_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.gender}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.guardians && st.guardians.length > 0 ? (
                        <div>
                          <p className="font-medium text-slate-800">{st.guardians[0].full_name}</p>
                          <p className="text-[10px] text-slate-400">{st.guardians[0].phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None recorded</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        st.status === 'TRANSFERRED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => navigate(`/students/${st.id}`)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition inline-flex items-center"
                        title="View Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadBiodata(st.id)}
                        className="p-1.5 rounded-lg text-teal-600 hover:text-teal-900 hover:bg-teal-50 transition inline-flex items-center"
                        title="Download Biodata PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => {
                            setSelectedStudentForPromotion(st);
                            setTargetClassId('');
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition inline-flex items-center"
                          title="Promote Student"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {students.length} students</span>
          <span>Charity Preparatory School Database</span>
        </div>
      </div>

      {/* Promotion Modal Dialog */}
      {selectedStudentForPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Promote Student to Next Class</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select target class level for <b>{selectedStudentForPromotion.full_name}</b> ({selectedStudentForPromotion.admission_number}).
            </p>

            <form onSubmit={handlePromoteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Current Placement</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedStudentForPromotion.class_name || ''} ${selectedStudentForPromotion.stream_name || ''}`}
                  className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Target Promoted Class *</label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Target Class...</option>
                  {classes.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name} ({cl.level_group})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForPromotion(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPromoting || !targetClassId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isPromoting ? 'Processing...' : 'Confirm Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
