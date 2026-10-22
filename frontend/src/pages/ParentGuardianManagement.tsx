import React, { useState, useEffect } from 'react';
import { HeartHandshake, Search, Phone, Mail, MapPin, UserPlus } from 'lucide-react';
import api from '../services/api';

export const ParentGuardianManagement: React.FC = () => {
  const [guardians, setGuardians] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/students');
      const allStudents = res.data.students || [];
      const guardianMap = new Map();

      allStudents.forEach((st: any) => {
        if (st.guardians) {
          st.guardians.forEach((g: any) => {
            if (!guardianMap.has(g.guardian_id)) {
              guardianMap.set(g.guardian_id, {
                id: g.guardian_id,
                full_name: g.full_name,
                phone: g.phone,
                alt_phone: g.alt_phone,
                email: g.email,
                children: [{ name: st.full_name, class: st.class_name, rel: g.relationship_type }]
              });
            } else {
              const existing = guardianMap.get(g.guardian_id);
              existing.children.push({ name: st.full_name, class: st.class_name, rel: g.relationship_type });
            }
          });
        }
      });
      setGuardians(Array.from(guardianMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = guardians.filter(g =>
    g.full_name.toLowerCase().includes(search.toLowerCase()) ||
    g.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <HeartHandshake className="w-5 h-5 text-teal-600" />
          <span>Parent & Guardian Management</span>
        </h1>
        <p className="text-xs text-slate-500">Directory of parents, emergency contacts, and linked learners</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guardian by name or phone number..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full py-8 text-center text-xs text-slate-500">Loading parent directory...</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full py-8 text-center text-xs text-slate-500">No parent records found.</p>
        ) : (
          filtered.map(g => (
            <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold text-sm flex items-center justify-center">
                  {g.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{g.full_name}</h3>
                  <p className="text-xs text-slate-500">Parent / Guardian</p>
                </div>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                <p className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{g.phone}</span>
                </p>
                {g.email && (
                  <p className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{g.email}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Enrolled Children:</span>
                <div className="mt-1 space-y-1">
                  {g.children.map((ch: any, i: number) => (
                    <div key={i} className="text-xs flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg">
                      <span className="font-semibold text-slate-800">{ch.name}</span>
                      <span className="text-[10px] font-bold text-teal-700">{ch.class} ({ch.rel})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
