import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, Lock, RefreshCw, Eye, Edit3 } from 'lucide-react';
import api from '../services/api';
import { ClassLevel, ReportCard, Term } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const ReportCardGeneration: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedTermId, setSelectedTermId] = useState<number | ''>('');
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Edit Remarks Modal
  const [editingCard, setEditingCard] = useState<ReportCard | null>(null);
  const [teacherRemarks, setTeacherRemarks] = useState<string>('');
  const [headRemarks, setHeadRemarks] = useState<string>('');
  const [promotionStatus, setPromotionStatus] = useState<string>('');

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const fetchPrerequisites = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/academics/terms')
      ]);
      setClasses(cRes.data.classes || []);
      setTerms(tRes.data.terms || []);

      const curTerm = tRes.data.terms.find((t: any) => t.is_current) || tRes.data.terms[0];
      if (curTerm) setSelectedTermId(curTerm.id);

      if (cRes.data.classes && cRes.data.classes.length > 0) {
        const p5 = cRes.data.classes.find((c: any) => c.code === 'P5') || cRes.data.classes[0];
        setSelectedClassId(p5.id);
        loadReportCards(p5.id, curTerm ? curTerm.id : 2);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadReportCards = async (classId: number, termId: number) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/report-cards?class_id=${classId}&term_id=${termId}`);
      setReportCards(res.data.report_cards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateClass = async () => {
    if (!selectedClassId || !selectedTermId) return;
    setIsGenerating(true);
    try {
      const res = await api.post('/report-cards/generate-class', {
        class_id: selectedClassId,
        term_id: selectedTermId
      });
      alert(res.data.message);
      loadReportCards(Number(selectedClassId), Number(selectedTermId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate report cards');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async (cardId: number) => {
    try {
      await api.post(`/report-cards/${cardId}/publish`);
      alert('Report card approved and published!');
      loadReportCards(Number(selectedClassId), Number(selectedTermId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish');
    }
  };

  const handleSaveRemarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    try {
      await api.put(`/report-cards/${editingCard.id}`, {
        class_teacher_remarks: teacherRemarks,
        headteacher_remarks: headRemarks,
        promotion_status: promotionStatus
      });
      setEditingCard(null);
      loadReportCards(Number(selectedClassId), Number(selectedTermId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update remarks');
    }
  };

  const openRemarksModal = (card: ReportCard) => {
    setEditingCard(card);
    setTeacherRemarks(card.class_teacher_remarks || '');
    setHeadRemarks(card.headteacher_remarks || '');
    setPromotionStatus(card.promotion_status || 'Promoted');
  };

  const canApprove = ['super_admin', 'headteacher'].includes(user?.role_name || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Terminal Report Cards Management</span>
          </h1>
          <p className="text-xs text-slate-500">Calculate terminal averages, rankings, remarks, and generate official downloadable PDF reports</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerateClass}
            disabled={isGenerating || !selectedClassId}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Computing Scores...' : 'Generate / Refresh Class Reports'}</span>
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="font-semibold text-slate-700">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const cid = Number(e.target.value);
                setSelectedClassId(cid);
                if (selectedTermId) loadReportCards(cid, Number(selectedTermId));
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
            >
              {classes.map(cl => <option key={cl.id} value={cl.id}>{cl.name} ({cl.code})</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="font-semibold text-slate-700">Term:</label>
            <select
              value={selectedTermId}
              onChange={(e) => {
                const tid = Number(e.target.value);
                setSelectedTermId(tid);
                if (selectedClassId) loadReportCards(Number(selectedClassId), tid);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
            >
              {terms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.academic_year_name})</option>)}
            </select>
          </div>
        </div>

        <span className="text-slate-500 font-semibold">{reportCards.length} Terminal Report Cards</span>
      </div>

      {/* Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">Adm. No.</th>
                <th className="py-3 px-4">Total Marks</th>
                <th className="py-3 px-4">Term Average</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading report cards...
                  </td>
                </tr>
              ) : reportCards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No report cards generated yet for this class and term. Click &ldquo;Generate / Refresh Class Reports&rdquo; above.
                  </td>
                </tr>
              ) : (
                reportCards.map((rc) => (
                  <tr key={rc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-black text-amber-700">
                      #{rc.class_position || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {rc.student_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {rc.admission_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {rc.total_marks}
                    </td>
                    <td className="py-3 px-4 font-bold text-teal-700">
                      {rc.average_score}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {rc.overall_grade || '1'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {rc.attendance_present} / {rc.attendance_total_days} days
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rc.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rc.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openRemarksModal(rc)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition inline-flex items-center"
                        title="Edit Remarks"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {canApprove && !rc.is_published && (
                        <button
                          onClick={() => handlePublish(rc.id)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 transition inline-flex items-center"
                          title="Approve & Publish Report Card"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`/api/report-cards/${rc.id}/pdf`, '_blank')}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition inline-flex items-center"
                        title="Download PDF Report Card"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Remarks Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Terminal Remarks for {editingCard.student_name}
            </h3>
            <form onSubmit={handleSaveRemarks} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Class Teacher's Remarks</label>
                <textarea
                  rows={2}
                  value={teacherRemarks}
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Headteacher's Comments</label>
                <textarea
                  rows={2}
                  value={headRemarks}
                  onChange={(e) => setHeadRemarks(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Promotion Status (e.g. Promoted to Primary 6)</label>
                <input
                  type="text"
                  value={promotionStatus}
                  onChange={(e) => setPromotionStatus(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setEditingCard(null)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Save Remarks</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
