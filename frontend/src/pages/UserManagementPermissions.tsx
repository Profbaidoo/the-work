import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Database, UserX, UserCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { User } from '../types';

export const UserManagementPermissions: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backupStatus, setBackupStatus] = useState<string>('');

  // New User Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('School@2026');
  const [roleId, setRoleId] = useState<number>(3); // Teacher by default

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    setIsLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        api.get('/settings/users'),
        api.get('/settings/roles')
      ]);
      setUsers(uRes.data.users || []);
      setRoles(rRes.data.roles || []);
      if (rRes.data.roles && rRes.data.roles.length > 0) {
        setRoleId(rRes.data.roles[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/users', {
        username,
        email,
        full_name: fullName,
        phone,
        password,
        role_id: roleId
      });
      setShowModal(false);
      setUsername('');
      setEmail('');
      setFullName('');
      fetchUsersData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create user account');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await api.post(`/settings/users/${userId}/toggle-status`);
      fetchUsersData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to change status');
    }
  };

  const handleTriggerBackup = async () => {
    setBackupStatus('Creating secure snapshot...');
    try {
      const res = await api.post('/settings/backup-database');
      setBackupStatus(`Database backup snapshot saved: ${res.data.filename || res.data.message}`);
    } catch (err: any) {
      setBackupStatus(`Backup failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span>User Accounts & Security Permissions</span>
          </h1>
          <p className="text-xs text-slate-500">Manage login credentials, role assignments, and database administrative backups</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerBackup}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Backup Database Snapshot</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create User Account</span>
          </button>
        </div>
      </div>

      {backupStatus && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center space-x-2">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">System Login Accounts ({users.length})</h2>
          <span className="text-xs text-slate-400">Argon2 / PBKDF2 Encrypted Passwords</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Assigned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.full_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.username}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {u.role_display_name || u.role_name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        u.is_active ? 'text-red-700 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Create New System Account</h3>
            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel K. Appiah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. samuel.appiah"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Assigned Role</label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {roles.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="samuel@school.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+233 24 000 0000"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Default Password</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white rounded-lg font-bold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
