import React, { useState, useEffect } from 'react';
import { Award, Plus, Lock, Unlock, Save, CheckCircle2, Sliders, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { Assessment, ClassLevel, Subject, Term } from '../types';

export const AssessmentMarksEntry: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | ''>('');
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);

  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  // New assessment modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<string>('CLASS_SCORE');
  const [newClassId, setNewClassId] = useState<number | ''>('');
  const [newSubjectId, setNewSubjectId] = useState<number | ''>('');
  const [newMaxMarks, setNewMaxMarks] = useState<number>(100);
  const [newWeight, setNewWeight] = useState<number>(30);

  // Grading scale modal
  const [showScaleModal, setShowScaleModal] = useState<boolean>(false);
  const [gradingScale, setGradingScale] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [cRes, sRes, tRes, aRes, scaleRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/academics/subjects'),
        api.get('/academics/terms'),
        api.get('/assessments'),
        api.get('/assessments/grading-scale')
      ]);
      setClasses(cRes.data.classes || []);
      setSubjects(sRes.data.subjects || []);
      setTerms(tRes.data.terms || []);
      setAssessments(aRes.data.assessments || []);
      setGradingScale(scaleRes.data.grading_scale || []);

      if (aRes.data.assessments && aRes.data.assessments.length > 0) {
        const first = aRes.data.assessments[0];
        setSelectedAssessmentId(first.id);
        loadScores(first.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadScores = async (assessmentId: number) => {
    setIsLoading(true);
    setSuccessMsg('');
    try {
      const res = await api.get(`/assessments/${assessmentId}/scores`);
      setSelectedAssessment(res.data.assessment);
      setScores(res.data.scores || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (studentId: number, rawVal: string) => {
    setScores(prev => prev.map(item => {
      if (item.student_id === studentId) {
        const val = rawVal === '' ? '' : Number(rawVal);
        return { ...item, raw_score: val };
      }
      return item;
    }));
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setScores(prev => prev.map(item =>
      item.student_id === studentId ? { ...item, remarks } : item
    ));
  };

  const handleSaveScores = async () => {
    if (!selectedAssessmentId) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await api.post(`/assessments/${selectedAssessmentId}/scores`, {
        scores: scores.map(s => ({
          student_id: s.student_id,
          raw_score: s.raw_score,
          remarks: s.remarks
        }))
      });
      setSuccessMsg('Student marks and weighted scores recorded successfully!');
      loadScores(Number(selectedAssessmentId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save scores');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedAssessmentId) return;
    try {
      const res = await api.post(`/assessments/${selectedAssessmentId}/toggle-lock`);
      setSelectedAssessment((prev: any) => ({ ...prev, is_locked: res.data.is_locked }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle lock');
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/assessments', {
        name: newName,
        assessment_type: newType,
        term_id: terms.find(t => t.is_current)?.id || terms[0]?.id || 2,
        class_level_id: newClassId,
        subject_id: newSubjectId,
        max_marks: newMaxMarks,
        weight_percentage: newWeight
      });
      setShowCreateModal(false);
      fetchMetadata();
      setSelectedAssessmentId(res.data.assessment.id);
      loadScores(res.data.assessment.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create assessment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Continuous Assessment & Marks Entry</span>
          </h1>
          <p className="text-xs text-slate-500">Record class scores (30-50%) and terminal exam marks (50-70%) with automatic grading</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowScaleModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Grading Boundaries</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Assessment Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <label className="font-bold text-slate-700">Select Assessment:</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => {
              const aid = Number(e.target.value);
              setSelectedAssessmentId(aid);
              loadScores(aid);
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
          >
            {assessments.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.class_name} &bull; {a.subject_name})
              </option>
            ))}
          </select>
        </div>

        {selectedAssessment && (
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
              Max: <b>{selectedAssessment.max_marks}</b> | Weight: <b>{selectedAssessment.weight_percentage}%</b>
            </span>

            <button
              onClick={handleToggleLock}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold border transition ${
                selectedAssessment.is_locked
                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {selectedAssessment.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{selectedAssessment.is_locked ? 'Marks Locked' : 'Lock Marks'}</span>
            </button>

            <button
              onClick={handleSaveScores}
              disabled={isSaving || selectedAssessment.is_locked}
              className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Marks'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Marks Entry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Adm. No.</th>
                <th className="py-3 px-4">Learner Name</th>
                <th className="py-3 px-4">Raw Score (/{selectedAssessment?.max_marks || 100})</th>
                <th className="py-3 px-4">Weighted Score ({selectedAssessment?.weight_percentage || 30}%)</th>
                <th className="py-3 px-4">Calculated Grade</th>
                <th className="py-3 px-4">Teacher Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading student score sheet...
                  </td>
                </tr>
              ) : scores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No learners assigned to this assessment.
                  </td>
                </tr>
              ) : (
                scores.map((sc) => {
                  const rawNum = sc.raw_score !== '' && sc.raw_score !== null ? Number(sc.raw_score) : null;
                  const calculatedWeighted = rawNum !== null && selectedAssessment
                    ? ((rawNum / selectedAssessment.max_marks) * selectedAssessment.weight_percentage).toFixed(1)
                    : '-';

                  return (
                    <tr key={sc.student_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {sc.admission_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {sc.student_name}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={selectedAssessment?.max_marks || 100}
                          disabled={selectedAssessment?.is_locked}
                          value={sc.raw_score ?? ''}
                          onChange={(e) => handleScoreChange(sc.student_id, e.target.value)}
                          placeholder="0.0"
                          className="w-24 px-2.5 py-1 border border-slate-300 rounded font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100"
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-700">
                        {calculatedWeighted}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {sc.grade || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          disabled={selectedAssessment?.is_locked}
                          value={sc.remarks || ''}
                          onChange={(e) => handleRemarksChange(sc.student_id, e.target.value)}
                          placeholder="Commendable progress..."
                          className="w-full px-2.5 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Create New Academic Assessment</h3>
            <form onSubmit={handleCreateAssessment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Assessment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Practical Test 1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      setNewType(e.target.value);
                      setNewWeight(e.target.value === 'CLASS_SCORE' ? 30 : 70);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="CLASS_SCORE">Class Continuous Assessment</option>
                    <option value="EXAM">Terminal Examination</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Weight (%)</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Class</label>
                  <select
                    required
                    value={newClassId}
                    onChange={(e) => setNewClassId(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Class...</option>
                    {classes.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Subject</label>
                  <select
                    required
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Scale Modal */}
      {showScaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Ghanaian Basic Education Grading Scale</h3>
            <p className="text-xs text-slate-500 mt-0.5">Approved 9-point Basic Education scale boundaries</p>
            <div className="mt-4 max-h-72 overflow-y-auto space-y-2">
              {gradingScale.map((scale, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-base text-amber-700 w-8">Grade {scale.grade}</span>
                  <span className="font-semibold text-slate-700">{scale.min_score}% - {scale.max_score}%</span>
                  <span className="font-bold text-teal-800">{scale.remark}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setShowScaleModal(false)} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
