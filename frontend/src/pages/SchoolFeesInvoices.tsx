import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, RefreshCw, Filter, Search, FileText } from 'lucide-react';
import api from '../services/api';
import { FeeStructure, Invoice, ClassLevel, Term } from '../types';

export const SchoolFeesInvoices: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'structures'>('invoices');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [showFeeModal, setShowFeeModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAmount, setNewAmount] = useState<number>(850);
  const [newClassId, setNewClassId] = useState<string>('');
  const [isMandatory, setIsMandatory] = useState<boolean>(true);

  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const [fRes, invRes, cRes, tRes] = await Promise.all([
        api.get('/finance/fee-structures'),
        api.get('/finance/invoices'),
        api.get('/academics/classes'),
        api.get('/academics/terms')
      ]);
      setFeeStructures(fRes.data.fee_structures || []);
      setInvoices(invRes.data.invoices || []);
      setClasses(cRes.data.classes || []);
      setTerms(tRes.data.terms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/fee-structures', {
        title: newTitle,
        amount: newAmount,
        academic_year_id: 1,
        term_id: 2,
        class_level_id: newClassId ? Number(newClassId) : null,
        is_mandatory: isMandatory
      });
      setShowFeeModal(false);
      setNewTitle('');
      fetchFinanceData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create fee structure');
    }
  };

  const handleBatchGenerate = async () => {
    setIsBatchGenerating(true);
    try {
      const res = await api.post('/finance/invoices/batch-generate', {
        academic_year_id: 1,
        term_id: 2
      });
      alert(res.data.message);
      fetchFinanceData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate invoices');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchSearch = inv.student_name.toLowerCase().includes(search.toLowerCase()) ||
                        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                        inv.admission_number.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>School Fees & Billing Management</span>
          </h1>
          <p className="text-xs text-slate-500">Configure class fee components in Ghana Cedis (GH₵) and manage student billing</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'invoices' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Student Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('structures')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'structures' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Fee Structures ({feeStructures.length})
            </button>
          </div>

          {activeTab === 'invoices' ? (
            <button
              onClick={handleBatchGenerate}
              disabled={isBatchGenerating}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBatchGenerating ? 'animate-spin' : ''}`} />
              <span>Generate Term Invoices</span>
            </button>
          ) : (
            <button
              onClick={() => setShowFeeModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee Structure</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice by student name or invoice number..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid in Full</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid (Arrears)</option>
            </select>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice No.</th>
                    <th className="py-3 px-4">Learner Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Term Total (GH₵)</th>
                    <th className="py-3 px-4">Amount Paid (GH₵)</th>
                    <th className="py-3 px-4">Balance Due (GH₵)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{inv.student_name}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.class_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">GH₵ {inv.total_amount?.toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">GH₵ {inv.paid_amount?.toFixed(2)}</td>
                      <td className={`py-3 px-4 font-bold ${inv.balance_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        GH₵ {inv.balance_due?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeStructures.map(fs => (
            <div key={fs.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{fs.title}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fs.is_mandatory ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                  {fs.is_mandatory ? 'Mandatory' : 'Optional'}
                </span>
              </div>
              <p className="text-2xl font-black text-amber-600">GH₵ {fs.amount?.toFixed(2)}</p>
              <div className="text-xs space-y-1 text-slate-500 pt-2 border-t border-slate-100">
                <p><b>Applies To:</b> {fs.class_name || 'All Basic School Classes'}</p>
                <p><b>Term:</b> {fs.term_name || 'Term 2'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Fee Structure Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add Approved School Charge</h3>
            <form onSubmit={handleCreateFeeStructure} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Fee Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Maintenance"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Amount in Ghana Cedis (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Class Scope</label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">All Classes (School-wide)</option>
                  {classes.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  id="mandatoryCheck"
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="mandatoryCheck" className="text-slate-700 font-semibold">Mandatory fee for all students</label>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowFeeModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white rounded-lg font-bold">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
