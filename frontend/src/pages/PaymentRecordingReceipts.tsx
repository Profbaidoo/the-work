import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Download, Search, CheckCircle2, DollarSign, CreditCard } from 'lucide-react';
import api from '../services/api';
import { Payment, Invoice } from '../types';

export const PaymentRecordingReceipts: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Payment Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('');
  const [payAmount, setPayAmount] = useState<number>(500);
  const [payMethod, setPayMethod] = useState<string>('MTN_MOMO');
  const [txId, setTxId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const fetchPaymentsData = async () => {
    setIsLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        api.get('/finance/payments'),
        api.get('/finance/invoices')
      ]);
      setPayments(payRes.data.payments || []);
      const pending = (invRes.data.invoices || []).filter((inv: Invoice) => inv.balance_due > 0);
      setUnpaidInvoices(pending);
      if (pending.length > 0) {
        setSelectedInvoiceId(pending[0].id);
        setPayAmount(pending[0].balance_due);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvoiceSelect = (invId: number) => {
    setSelectedInvoiceId(invId);
    const found = unpaidInvoices.find(i => i.id === invId);
    if (found) {
      setPayAmount(found.balance_due);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || payAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/finance/payments', {
        invoice_id: selectedInvoiceId,
        amount: payAmount,
        payment_method: payMethod,
        external_transaction_id: txId,
        notes: notes
      });
      alert(`Payment recorded! Official Receipt No: ${res.data.payment.reference_number}`);
      setShowModal(false);
      setNotes('');
      setTxId('');
      fetchPaymentsData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(p =>
    p.student_name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number.toLowerCase().includes(search.toLowerCase()) ||
    p.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            <span>Payment Recording & Official Receipts</span>
          </h1>
          <p className="text-xs text-slate-500">Record cash, bank transfer, and mobile money collections with automatic receipt generation in GH₵</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments by student name, admission number, or receipt reference..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Receipt Ref.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">Adm. No.</th>
                <th className="py-3 px-4">Amount Paid (GH₵)</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading payment ledger...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No payment records found.</td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">{p.reference_number}</td>
                    <td className="py-3 px-4 text-slate-600">{p.payment_date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.student_name}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">{p.admission_number}</td>
                    <td className="py-3 px-4 font-black text-emerald-700">GH₵ {p.amount?.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.payment_method?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => window.open(`/api/finance/payments/${p.id}/receipt-pdf`, '_blank')}
                        className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition inline-flex items-center space-x-1"
                        title="Download Receipt PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="font-bold">PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Record Fee Payment (GH₵)</h3>
            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Student Invoice With Outstanding Balance</label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceSelect(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                >
                  {unpaidInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.student_name} ({inv.class_name}) &bull; Due: GH₵ {inv.balance_due?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Payment Amount in Ghana Cedis (GH₵) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-800 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Payment Channel / Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="MTN_MOMO">MTN Mobile Money (MoMo)</option>
                  <option value="TELECEL_CASH">Telecel Cash (Vodafone)</option>
                  <option value="AIRTELTIGO_MONEY">AirtelTigo Money</option>
                  <option value="CASH">Cash at Bursar Office</option>
                  <option value="BANK_TRANSFER">Direct Bank Deposit / Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Transaction ID / Bank Slip Ref</label>
                <input
                  type="text"
                  placeholder="e.g. MTN-GH-99882312 or Slip #00421"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Part payment deposited by father"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold">
                  {isSubmitting ? 'Recording...' : 'Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
