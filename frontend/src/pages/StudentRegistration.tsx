import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { ClassLevel, Stream } from '../types';

export const StudentRegistration: React.FC = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [availableStreams, setAvailableStreams] = useState<Stream[]>([]);

  const [formData, setFormData] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    other_names: '',
    gender: 'Female',
    date_of_birth: '2016-04-15',
    admission_date: new Date().toISOString().split('T')[0],
    current_class_id: '',
    current_stream_id: '',
    residential_address: '',
    previous_school: '',
    medical_info: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_alt_phone: '',
    guardian_email: '',
    guardian_occupation: '',
    guardian_relationship: 'Parent'
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academics/classes');
      setClasses(res.data.classes || []);
      if (res.data.classes.length > 0) {
        const first = res.data.classes[4] || res.data.classes[0]; // Primary 1 or first
        setSelectedClassId(first.id);
        setFormData(prev => ({
          ...prev,
          current_class_id: String(first.id),
          current_stream_id: first.streams && first.streams.length > 0 ? String(first.streams[0].id) : ''
        }));
        setAvailableStreams(first.streams || []);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const handleClassChange = (classIdStr: string) => {
    const cId = Number(classIdStr);
    setSelectedClassId(cId);
    const found = classes.find(c => c.id === cId);
    const streams = found?.streams || [];
    setAvailableStreams(streams);
    setFormData(prev => ({
      ...prev,
      current_class_id: classIdStr,
      current_stream_id: streams.length > 0 ? String(streams[0].id) : ''
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        current_class_id: Number(formData.current_class_id),
        current_stream_id: formData.current_stream_id ? Number(formData.current_stream_id) : null
      };
      const res = await api.post('/students', payload);
      setMessage({ type: 'success', text: `Student registered successfully! Admission No: ${res.data.student.admission_number}` });
      setTimeout(() => {
        navigate(`/students/${res.data.student.id}`);
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Registration failed. Check required fields.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/students')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Admission & Registration</h1>
            <p className="text-xs text-slate-500">Register new basic school learner with full biodata and guardian details</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-sm font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Biodata */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>1. Learner Personal Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">First Name *</label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="e.g. Kwame"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Last Name *</label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                placeholder="e.g. Boateng"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Other Names</label>
              <input
                type="text"
                name="other_names"
                value={formData.other_names}
                onChange={handleChange}
                placeholder="e.g. Nana"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Date of Birth *</label>
              <input
                type="date"
                name="date_of_birth"
                required
                value={formData.date_of_birth}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Admission Date *</label>
              <input
                type="date"
                name="admission_date"
                required
                value={formData.admission_date}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Residential Address in Ghana *</label>
              <input
                type="text"
                name="residential_address"
                required
                value={formData.residential_address}
                onChange={handleChange}
                placeholder="e.g. House No. 24, Dome Pillar 2, Accra"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Previous School Attended (If any)</label>
              <input
                type="text"
                name="previous_school"
                value={formData.previous_school}
                onChange={handleChange}
                placeholder="e.g. Ridge Preparatory School"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Class & Stream Placement */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>2. Academic Level & Stream Placement</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Class / Grade *</label>
              <select
                name="current_class_id"
                value={formData.current_class_id}
                onChange={(e) => handleClassChange(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {classes.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.name} ({cl.level_group})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Stream / Section</label>
              <select
                name="current_stream_id"
                value={formData.current_stream_id}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">No Stream Assigned</option>
                {availableStreams.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Admission No. (Auto or Custom)</label>
              <input
                type="text"
                name="admission_number"
                value={formData.admission_number}
                onChange={handleChange}
                placeholder="Leave blank for auto-generation"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Guardian Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>3. Parent / Guardian Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Guardian Full Name *</label>
              <input
                type="text"
                name="guardian_name"
                required
                value={formData.guardian_name}
                onChange={handleChange}
                placeholder="e.g. Mr. Emmanuel Ofori"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Primary Phone Number *</label>
              <input
                type="tel"
                name="guardian_phone"
                required
                value={formData.guardian_phone}
                onChange={handleChange}
                placeholder="+233 24 123 4567"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Relationship *</label>
              <select
                name="guardian_relationship"
                value={formData.guardian_relationship}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                name="guardian_email"
                value={formData.guardian_email}
                onChange={handleChange}
                placeholder="guardian@example.com"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Occupation</label>
              <input
                type="text"
                name="guardian_occupation"
                value={formData.guardian_occupation}
                onChange={handleChange}
                placeholder="e.g. Accountant / Trader"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Emergency Contact Name *</label>
              <input
                type="text"
                name="emergency_contact_name"
                required
                value={formData.emergency_contact_name}
                onChange={handleChange}
                placeholder="e.g. Mrs. Mary Ofori"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Emergency Contact Phone *</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                required
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                placeholder="+233 20 987 6543"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Confidential Medical & Accessibility */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>4. Medical & Dietary Notes (Restricted Access)</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Strictly Confidential</span>
          </div>

          <div>
            <textarea
              name="medical_info"
              rows={2}
              value={formData.medical_info}
              onChange={handleChange}
              placeholder="e.g. Asthmatic (inhaler with class teacher); peanut allergy; wear glasses for board work."
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
