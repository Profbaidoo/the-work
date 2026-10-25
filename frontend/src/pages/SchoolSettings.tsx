import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, Building, Sliders, Calendar, Database, Download, RotateCcw, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { SchoolProfile, AcademicYear, Term } from '../types';

export const SchoolSettings: React.FC = () => {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Backup states
  const [backups, setBackups] = useState<any[]>([]);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupMsg, setBackupMsg] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [pRes, yRes, tRes, bRes] = await Promise.all([
        api.get('/settings/school-profile'),
        api.get('/academics/academic-years'),
        api.get('/academics/terms'),
        api.get('/settings/backups')
      ]);
      setProfile(pRes.data.school);
      setYears(yRes.data.academic_years || []);
      setTerms(tRes.data.terms || []);
      setBackups(bRes.data.backups || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupMsg('');
    try {
      const res = await api.post('/settings/backups/create');
      setBackupMsg(`Backup created successfully: ${res.data.backup?.filename}`);
      const bRes = await api.get('/settings/backups');
      setBackups(bRes.data.backups || []);
    } catch (err: any) {
      setBackupMsg(err.response?.data?.error || 'Failed to create backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to restore database snapshot ${filename}? This will revert recent data to this snapshot.`)) {
      return;
    }
    try {
      await api.post(`/settings/backups/${filename}/restore`);
      alert(`Database successfully restored from ${filename}. The page will now refresh.`);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to restore database.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfile((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setProfile((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await api.put('/settings/school-profile', {
        ...profile,
        ca_weight_percentage: Number(profile.ca_weight_percentage),
        exam_weight_percentage: Number(profile.exam_weight_percentage)
      });
      setSuccessMsg('School settings & academic policies saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetActiveTerm = async (termId: number) => {
    try {
      await api.post(`/academics/terms/${termId}/set-current`);
      alert('Active term updated!');
      fetchSettings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to set active term');
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-600" />
            <span>School Settings & Academic Configuration</span>
          </h1>
          <p className="text-xs text-slate-500">School identity, Ghanaian currency, calendar configuration, and assessment weights</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Institution Branding */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <Building className="w-4 h-4 text-teal-600" />
            <span>1. School Identity & Contact Info</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">School Legal Name *</label>
              <input
                type="text"
                name="school_name"
                required
                value={profile.school_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Motto / Slogan</label>
              <input
                type="text"
                name="school_motto"
                value={profile.school_motto}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg italic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Telephone Number</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Official Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Website</label>
              <input
                type="text"
                name="website"
                value={profile.website || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-semibold text-slate-700">Postal & Physical Address in Ghana</label>
            <input
              type="text"
              name="address"
              value={profile.address}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Section 2: Currency & Grading Weights */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>2. Assessment Weights & Currency Policies</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Continuous Assessment (CA) Weight (%)</label>
              <input
                type="number"
                name="ca_weight_percentage"
                value={profile.ca_weight_percentage}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
              <span className="text-[10px] text-slate-400">Standard GES basic curriculum recommends 30% or 50%</span>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Terminal Examination Weight (%)</label>
              <input
                type="number"
                name="exam_weight_percentage"
                value={profile.exam_weight_percentage}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
              <span className="text-[10px] text-slate-400">Standard GES basic curriculum recommends 70% or 50%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="font-semibold text-slate-700">National Currency Code</label>
              <input
                type="text"
                disabled
                value="GHS (Ghana Cedi)"
                className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Currency Symbol</label>
              <input
                type="text"
                disabled
                value="GH₵"
                className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Academic Calendar Switcher */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>3. Active Academic Term Switcher</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {terms.map(t => (
              <div key={t.id} className={`p-4 rounded-xl border text-xs space-y-2 ${
                t.is_current ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.name}</span>
                  {t.is_current && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                      Active Term
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{t.academic_year_name}</p>
                {!t.is_current && (
                  <button
                    type="button"
                    onClick={() => handleSetActiveTerm(t.id)}
                    className="w-full mt-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition text-[11px]"
                  >
                    Set as Current Term
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Database Backup & Recovery Snapshots */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>4. Database Backups & Cryptographic Snapshots</span>
            </h2>
            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={isBackingUp}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isBackingUp ? 'Creating Snapshot...' : 'Create New Backup Snapshot'}</span>
            </button>
          </div>

          {backupMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
              {backupMsg}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Backups are compressed with GZIP and validated using SHA-256 cryptographic checksums. You can download or restore snapshots at any time.
            </p>

            {backups.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No backup snapshots found. Click &quot;Create New Backup Snapshot&quot; to generate your first backup.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-slate-700">Backup Archive</th>
                      <th className="px-4 py-2 text-left font-bold text-slate-700">Compressed Size</th>
                      <th className="px-4 py-2 text-left font-bold text-slate-700">Created Date</th>
                      <th className="px-4 py-2 text-right font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {backups.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 font-mono text-slate-900 font-semibold">{b.filename}</td>
                        <td className="px-4 py-2.5 text-slate-600">{b.size_kb} KB</td>
                        <td className="px-4 py-2.5 text-slate-500">{b.modified_at}</td>
                        <td className="px-4 py-2.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(b.filename)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold text-[11px]"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
