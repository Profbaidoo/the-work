import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Users, Award, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { ClassLevel, Subject } from '../types';

export const ClassesAndSubjects: React.FC = () => {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  // Modals
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassCode, setNewClassCode] = useState<string>('');
  const [newClassLevel, setNewClassLevel] = useState<string>('PRIMARY');
  const [newClassCapacity, setNewClassCapacity] = useState<number>(40);

  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectCode, setNewSubjectCode] = useState<string>('');
  const [newSubjectCategory, setNewSubjectCategory] = useState<string>('CORE');

  useEffect(() => {
    fetchAcademicStructure();
  }, []);

  const fetchAcademicStructure = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/academics/subjects')
      ]);
      setClasses(cRes.data.classes || []);
      setSubjects(sRes.data.subjects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academics/classes', {
        name: newClassName,
        code: newClassCode,
        level_group: newClassLevel,
        capacity: newClassCapacity
      });
      setShowClassModal(false);
      setNewClassName('');
      setNewClassCode('');
      fetchAcademicStructure();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create class');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academics/subjects', {
        name: newSubjectName,
        code: newSubjectCode,
        category: newSubjectCategory
      });
      setShowSubjectModal(false);
      setNewSubjectName('');
      setNewSubjectCode('');
      fetchAcademicStructure();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create subject');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <span>Classes & Subjects Management</span>
          </h1>
          <p className="text-xs text-slate-500">Nursery, KG, Primary 1–6, and JHS 1–3 structure, streams, and curriculum</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'classes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Classes ({classes.length})
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'subjects' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Subjects ({subjects.length})
            </button>
          </div>

          {activeTab === 'classes' ? (
            <button
              onClick={() => setShowClassModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSubjectModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cl => (
            <div key={cl.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{cl.name}</h3>
                  <span className="font-mono text-xs font-semibold text-amber-700">{cl.code}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  cl.level_group === 'NURSERY' ? 'bg-pink-100 text-pink-700' :
                  cl.level_group === 'KG' ? 'bg-purple-100 text-purple-700' :
                  cl.level_group === 'PRIMARY' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {cl.level_group}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                <p><b>Capacity:</b> {cl.capacity} students</p>
                <p><b>Streams:</b> {cl.streams && cl.streams.length > 0 ? cl.streams.map(s => s.name).join(', ') : 'None'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(sub => (
            <div key={sub.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{sub.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  {sub.category}
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                <p><b>Subject Code:</b> <span className="font-mono font-bold text-slate-800">{sub.code}</span></p>
                <p><b>Applicable Level:</b> {sub.level_group}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add New Basic School Class</h3>
            <form onSubmit={handleCreateClass} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Class Name (e.g. Primary 7)</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Code (e.g. P7)</label>
                <input
                  type="text"
                  required
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Level Group</label>
                <select
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="NURSERY">NURSERY</option>
                  <option value="KG">KG</option>
                  <option value="PRIMARY">PRIMARY</option>
                  <option value="JHS">JHS</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowClassModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white rounded-lg font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add New Curriculum Subject</h3>
            <form onSubmit={handleCreateSubject} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Subject Code</label>
                <input
                  type="text"
                  required
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
