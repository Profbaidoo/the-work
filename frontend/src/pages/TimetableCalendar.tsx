import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Clock, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import api from '../services/api';
import { TimetableSlot, SchoolCalendarEvent, ClassLevel, Subject } from '../types';

export const TimetableCalendar: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [events, setEvents] = useState<SchoolCalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'timetable' | 'calendar'>('timetable');

  // New Slot Modal
  const [showSlotModal, setShowSlotModal] = useState<boolean>(false);
  const [slotDay, setSlotDay] = useState<string>('Monday');
  const [slotPeriod, setSlotPeriod] = useState<number>(1);
  const [slotSubjectId, setSlotSubjectId] = useState<number | ''>('');
  const [slotTeacherId, setSlotTeacherId] = useState<number | ''>('');
  const [slotRoom, setSlotRoom] = useState<string>('Main Classroom');
  const [conflictError, setConflictError] = useState<string>('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    fetchTimetableData();
  }, []);

  const fetchTimetableData = async () => {
    try {
      const [cRes, sRes, tRes, evRes] = await Promise.all([
        api.get('/academics/classes'),
        api.get('/academics/subjects'),
        api.get('/staff/teachers'),
        api.get('/timetable/calendar-events')
      ]);
      setClasses(cRes.data.classes || []);
      setSubjects(sRes.data.subjects || []);
      setTeachers(tRes.data.teachers || []);
      setEvents(evRes.data.events || []);

      if (cRes.data.classes && cRes.data.classes.length > 0) {
        const p5 = cRes.data.classes.find((c: any) => c.code === 'P5') || cRes.data.classes[0];
        setSelectedClassId(p5.id);
        loadSlots(p5.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSlots = async (classId: number) => {
    try {
      const res = await api.get(`/timetable/slots?class_id=${classId}`);
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');
    try {
      await api.post('/timetable/slots', {
        class_level_id: selectedClassId,
        subject_id: slotSubjectId,
        teacher_id: slotTeacherId,
        day_of_week: slotDay,
        period_number: slotPeriod,
        room_number: slotRoom
      });
      setShowSlotModal(false);
      if (selectedClassId) loadSlots(Number(selectedClassId));
    } catch (err: any) {
      setConflictError(err.response?.data?.error || 'Failed to create slot');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Class Timetable & Academic Calendar</span>
          </h1>
          <p className="text-xs text-slate-500">Weekly scheduling matrix, teacher conflict detection, and school term events</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'timetable' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Weekly Timetable
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'calendar' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Term Events ({events.length})
            </button>
          </div>

          {activeTab === 'timetable' && (
            <button
              onClick={() => { setConflictError(''); setShowSlotModal(true); }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Period</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3 text-xs">
            <label className="font-semibold text-slate-700">Select Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const cid = Number(e.target.value);
                setSelectedClassId(cid);
                loadSlots(cid);
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
            >
              {classes.map(cl => <option key={cl.id} value={cl.id}>{cl.name} ({cl.code})</option>)}
            </select>
          </div>

          {/* Matrix Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                    <th className="py-3 px-3 w-28 text-left">Period / Day</th>
                    {days.map(d => (
                      <th key={d} className="py-3 px-3">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periods.map(p => (
                    <tr key={p} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-left font-bold text-slate-700 bg-slate-50/50 border-r border-slate-100">
                        Period {p}
                      </td>
                      {days.map(d => {
                        const slot = slots.find(s => s.day_of_week === d && s.period_number === p);
                        return (
                          <td key={d} className="py-2.5 px-2 border-r border-slate-100 last:border-0">
                            {slot ? (
                              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-left space-y-0.5">
                                <p className="font-bold text-blue-900 leading-tight">{slot.subject_name}</p>
                                <p className="text-[10px] text-blue-700 font-medium">{slot.teacher_name}</p>
                                <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{slot.room_number}</span>
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">&mdash;</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(ev => (
            <div key={ev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-bold uppercase">{ev.start_date.slice(5, 7)}</span>
                <span className="text-sm font-black leading-none">{ev.start_date.slice(8, 10)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{ev.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.is_holiday ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ev.event_type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{ev.description}</p>
                <p className="text-[11px] font-semibold text-teal-700 mt-2">
                  Dates: {ev.start_date} &bull; {ev.end_date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Slot Modal with Conflict Detection */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Schedule Class Subject Period</h3>

            {conflictError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSlot} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Day of the Week</label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Period Number</label>
                  <select
                    value={slotPeriod}
                    onChange={(e) => setSlotPeriod(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {periods.map(p => <option key={p} value={p}>Period {p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Subject *</label>
                <select
                  required
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Assigned Teacher *</label>
                <select
                  required
                  value={slotTeacherId}
                  onChange={(e) => setSlotTeacherId(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.specialization || 'Teacher'})</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Room / Location</label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  placeholder="e.g. Science Lab or Room P5-A"
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowSlotModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold">Assign Period</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
