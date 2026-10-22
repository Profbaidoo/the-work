import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, Building, Sliders, Calendar } from 'lucide-react';
import api from '../services/api';
import { SchoolProfile, AcademicYear, Term } from '../types';

export const SchoolSettings: React.FC = () => {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [pRes, yRes, tRes] = await Promise.all([
        api.get('/settings/school-profile'),
        api.get('/academics/academic-years'),
        api.get('/academics/terms')
      ]);
      setProfile(pRes.data.school);
      setYears(yRes.data.academic_years || []);
      setTerms(tRes.data.terms || []);
    } catch (err) {
      console.error(err);
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
      </form>
    </div>
  );
};
