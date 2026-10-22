import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  MapPin,
  Heart,
  Phone,
  Mail,
  Award,
  CreditCard,
  Edit,
  Download,
  AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import { Student } from '../types';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      fetchStudentDetails(Number(id));
    }
  }, [id]);

  const fetchStudentDetails = async (studentId: number) => {
    setIsLoading(true);
    try {
      const [stRes, rcRes, invRes] = await Promise.all([
        api.get(`/students/${studentId}`),
        api.get(`/report-cards?student_id=${studentId}`),
        api.get(`/finance/invoices?student_id=${studentId}`)
      ]);
      setStudent(stRes.data.student);
      setReportCards(rcRes.data.report_cards || []);
      setInvoices(invRes.data.invoices || []);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBiodata = () => {
    if (id) {
      window.open(`/api/students/${id}/biodata-pdf`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <p className="text-sm font-semibold">Loading Learner Profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Student record not found.</p>
        <button onClick={() => navigate('/students')} className="mt-4 text-xs font-bold text-amber-600">Back to Directory</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/students')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{student.full_name}</h1>
            <p className="text-xs text-slate-500">Official Student Profile &bull; Admission No: {student.admission_number}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadBiodata}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print Biodata PDF</span>
          </button>
        </div>
      </div>

      {/* Main Student Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-400 p-1 shrink-0 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400 text-2xl font-black">
              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{student.full_name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {student.status}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Class & Stream</span>
                <span className="font-bold text-slate-800">{student.class_name} {student.stream_name || ''}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Admission Number</span>
                <span className="font-mono font-bold text-amber-700">{student.admission_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                <span className="font-medium text-slate-800">{student.date_of_birth}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Gender</span>
                <span className="font-medium text-slate-800">{student.gender}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biodata & Contact Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Residential & Emergency Info</span>
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Residential Address:</span>
                <p className="font-semibold text-slate-800">{student.residential_address}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Emergency Contact:</span>
                <p className="font-semibold text-slate-800">{student.emergency_contact_name} ({student.emergency_contact_phone})</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Previous School:</span>
                <p className="font-semibold text-slate-800">{student.previous_school || 'None'}</p>
              </div>
            </div>

            {student.medical_info && (
              <div className="bg-red-50/70 border border-red-200 p-4 rounded-xl text-xs space-y-1">
                <span className="font-bold text-red-800 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Confidential Medical & Accessibility Notes:</span>
                </span>
                <p className="text-red-900 font-medium">{student.medical_info}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>Guardians & Family Contacts</span>
            </h3>
            <div className="space-y-2">
              {student.guardians && student.guardians.length > 0 ? (
                student.guardians.map((g, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl text-xs space-y-1 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{g.full_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {g.relationship_type}
                      </span>
                    </div>
                    <p className="text-slate-600">Tel: <span className="font-semibold text-slate-800">{g.phone}</span></p>
                    {g.email && <p className="text-slate-600">Email: {g.email}</p>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No parent or guardian linked.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Academic Report Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Terminal Academic Progress Reports</span>
          </h3>
          <button
            onClick={() => navigate('/report-cards')}
            className="text-xs font-bold text-blue-600 hover:text-blue-500"
          >
            All Reports &rarr;
          </button>
        </div>

        {reportCards.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No terminal reports generated yet for this student.</p>
        ) : (
          <div className="space-y-3">
            {reportCards.map((rc) => (
              <div key={rc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 text-sm">{rc.term_name} ({rc.academic_year_name})</span>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-slate-600">
                    <span>Average: <b>{rc.average_score}%</b></span>
                    <span>Overall Grade: <b>{rc.overall_grade}</b></span>
                    <span>Position: <b>{rc.class_position || '-'} of {rc.total_students_in_class || '-'}</b></span>
                    <span>Attendance: <b>{rc.attendance_present} / {rc.attendance_total_days}</b> days</span>
                  </div>
                </div>
                <button
                  onClick={() => window.open(`/api/report-cards/${rc.id}/pdf`, '_blank')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report Card PDF</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fee Invoices & Payment Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>School Fees & Invoices (Ghana Cedis GH₵)</span>
          </h3>
          <button
            onClick={() => navigate('/payments')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-500"
          >
            Record Payment &rarr;
          </button>
        </div>

        {invoices.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No invoices billed for this student.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-800">{inv.invoice_number}</span>
                  <p className="text-[11px] text-slate-500">{inv.term_name} &bull; {inv.academic_year_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">Total: GH₵ {inv.total_amount?.toFixed(2)}</p>
                  <p className={`font-semibold ${inv.balance_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    Balance: GH₵ {inv.balance_due?.toFixed(2)}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                  inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
