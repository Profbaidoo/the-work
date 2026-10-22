import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import api from '../services/api';

export const ReportsAnalytics: React.FC = () => {
  const [enrollmentSummary, setEnrollmentSummary] = useState<any>(null);
  const [feeSummary, setFeeSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [enrRes, feeRes] = await Promise.all([
        api.get('/reports/enrollment-summary'),
        api.get('/reports/fee-collection-summary')
      ]);
      setEnrollmentSummary(enrRes.data);
      setFeeSummary(feeRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportStudents = () => {
    window.open('/api/students/export', '_blank');
  };

  const handleExportFinance = () => {
    window.open('/api/finance/export-financial-csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <span>School Reports & Administrative Analytics</span>
          </h1>
          <p className="text-xs text-slate-500">Comprehensive enrollment statistics, financial recovery audits, and exportable reports</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportStudents}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Students CSV</span>
          </button>
          <button
            onClick={handleExportFinance}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Financial Audit</span>
          </button>
        </div>
      </div>

      {/* Enrollment Demographics Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Student Enrollment by Class & Gender</h2>
            <p className="text-xs text-slate-500">Gender breakdown across Nursery, KG, Primary, and JHS</p>
          </div>
          <span className="font-black text-slate-900 text-sm">
            Total Learners: {enrollmentSummary?.grand_total || 0}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Class Level</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Male</th>
                <th className="py-3 px-4">Female</th>
                <th className="py-3 px-4">Total Enrolled</th>
                <th className="py-3 px-4">Class Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(enrollmentSummary?.classes || []).map((cl: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-800">{cl.class_name}</td>
                  <td className="py-3 px-4 text-slate-500">{cl.level_group}</td>
                  <td className="py-3 px-4 text-blue-700 font-semibold">{cl.male}</td>
                  <td className="py-3 px-4 text-pink-700 font-semibold">{cl.female}</td>
                  <td className="py-3 px-4 font-black text-slate-900">{cl.total}</td>
                  <td className="py-3 px-4 text-slate-500">{cl.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terminal Fee Collection Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Terminal Fee Collection Audit</h2>
            <p className="text-xs text-slate-500">Billed amount vs actual payments in Ghana Cedis (GH₵)</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
            Overall Recovery Rate: {feeSummary?.overall_recovery_rate}%
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Billed Amount</th>
                <th className="py-3 px-4">Collected</th>
                <th className="py-3 px-4">Outstanding Arrears</th>
                <th className="py-3 px-4">Collection Rate (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(feeSummary?.classes || []).map((c: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-800">{c.class_name}</td>
                  <td className="py-3 px-4">GH₵ {c.billed?.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">GH₵ {c.received?.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold text-red-600">GH₵ {c.balance?.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className="font-black text-slate-800">{c.recovery_rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
