import React, { useState, useEffect } from 'react';
import { TrendingDown, Plus, Download, BarChart2, DollarSign, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Expense } from '../types';

export const ExpensesFinancialReports: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Expense Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<number>(500);
  const [category, setCategory] = useState<string>('UTILITIES');
  const [paidTo, setPaidTo] = useState<string>('');
  const [refNum, setRefNum] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get('/finance/expenses'),
        api.get('/finance/summary')
      ]);
      setExpenses(expRes.data.expenses || []);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/expenses', {
        title,
        amount,
        category,
        paid_to: paidTo,
        receipt_reference: refNum,
        notes
      });
      alert('School expense logged successfully!');
      setShowModal(false);
      setTitle('');
      setPaidTo('');
      fetchFinancialData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record expense');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/finance/export-financial-csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span>School Expenses & Financial Statement</span>
          </h1>
          <p className="text-xs text-slate-500">Track operating expenditures, terminal net balances, and class recovery analysis in GH₵</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Invoiced</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            GH₵ {(summary?.total_invoiced || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Fees Collected</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            GH₵ {(summary?.total_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Operating Expenses</span>
          <p className="text-xl font-black text-red-600 mt-1">
            GH₵ {(summary?.total_expenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Net Operating Balance</span>
          <p className="text-xl font-black text-teal-700 mt-1">
            GH₵ {(summary?.net_operating_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Class Fee Recovery Rates Table */}
      {summary?.class_recovery && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Class-by-Class Fee Collection & Recovery Rates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Class Level</th>
                  <th className="py-2.5 px-3">Billed (GH₵)</th>
                  <th className="py-2.5 px-3">Collected (GH₵)</th>
                  <th className="py-2.5 px-3">Outstanding Arrears (GH₵)</th>
                  <th className="py-2.5 px-3">Recovery %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.class_recovery.map((cr: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{cr.class_name}</td>
                    <td className="py-2.5 px-3 font-medium">GH₵ {cr.invoiced?.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">GH₵ {cr.collected?.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-bold text-red-600">GH₵ {cr.outstanding?.toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, cr.recovery_rate)}%` }}></div>
                        </div>
                        <span className="font-bold text-teal-800">{cr.recovery_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recorded School Expenditures</h2>
          <span className="text-xs text-slate-500">{expenses.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Title / Purpose</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Receipt Ref</th>
                <th className="py-3 px-4">Amount (GH₵)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-600">{exp.expense_date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{exp.title}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{exp.paid_to}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{exp.receipt_reference || '-'}</td>
                  <td className="py-3 px-4 font-black text-red-600">GH₵ {exp.amount?.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {exp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Record School Expense</h3>
            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECG Power Prepaid Credit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="UTILITIES">Utilities (ECG / Water)</option>
                    <option value="MAINTENANCE">Facility Maintenance</option>
                    <option value="SUPPLIES">Teaching Supplies</option>
                    <option value="FEEDING">Kitchen & Feeding</option>
                    <option value="SALARIES">Staff Salaries</option>
                    <option value="OTHER">Other Expenses</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Amount (GH₵) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Paid To (Vendor / Entity) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECG Achimota District"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Receipt / Invoice Reference</label>
                <input
                  type="text"
                  placeholder="e.g. REC-99214"
                  value={refNum}
                  onChange={(e) => setRefNum(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-bold">Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
