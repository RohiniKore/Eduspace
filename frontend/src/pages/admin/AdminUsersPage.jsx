import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a1 1 0 011-1h6v5H3V7zM13 7h7a1 1 0 011 1v10a1 1 0 01-1 1h-7V7z" /></svg> },
  { path: '/admin/users', label: 'Users', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { path: '/admin/classes', label: 'Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const loadUsers = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (roleFilter) params.append('role', roleFilter);
    API.get(`/admin/users?${params}`).then(r => setUsers(r.data.users)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [search, roleFilter]);

  const action = async (userId, type) => {
    setActionLoading(p => ({ ...p, [userId]: type }));
    try {
      if (type === 'approve') await API.put(`/admin/users/${userId}/approve`);
      else if (type === 'deactivate') await API.put(`/admin/users/${userId}/deactivate`);
      else if (type === 'activate') await API.put(`/admin/users/${userId}/activate`);
      else if (type === 'delete') { if (!confirm('Permanently delete this user?')) return; await API.delete(`/admin/users/${userId}`); }
      toast.success('Action completed');
      loadUsers();
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(p => ({ ...p, [userId]: null })); }
  };

  return (
    <SidebarLayout navItems={navItems} title="User Management">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="page-title">User Management</h1>
          <p className="text-slate-600 mt-1">{users.length} users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field sm:w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {loading ? <LoadingSpinner fullScreen={false} /> : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-slate-600 font-medium text-sm">User</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium text-sm">Role</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium text-sm">Status</th>
                    <th className="text-left px-4 py-3 text-slate-600 font-medium text-sm">Joined</th>
                    <th className="text-right px-4 py-3 text-slate-600 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-100/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name?.[0]}</div>
                          <div className="min-w-0">
                            <p className="text-slate-800 font-medium text-sm truncate">{u.name}</p>
                            <p className="text-slate-500 text-xs truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${u.role === 'teacher' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : u.role === 'student' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`badge w-fit ${u.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {u.role === 'teacher' && (
                            <span className={`badge w-fit ${u.isApproved ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {u.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm">{format(new Date(u.createdAt || u.joinedAt || Date.now()), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === 'teacher' && !u.isApproved && u.isActive && (
                            <button onClick={() => action(u._id, 'approve')} disabled={actionLoading[u._id]} className="btn-primary text-xs py-1.5 px-3">Approve</button>
                          )}
                          {u.isActive ? (
                            <button onClick={() => action(u._id, 'deactivate')} disabled={actionLoading[u._id]} className="btn-secondary text-xs py-1.5 px-3">Deactivate</button>
                          ) : (
                            <button onClick={() => action(u._id, 'activate')} disabled={actionLoading[u._id]} className="btn-secondary text-xs py-1.5 px-3">Activate</button>
                          )}
                          {u.role !== 'admin' && (
                            <button onClick={() => action(u._id, 'delete')} disabled={actionLoading[u._id]} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-12 text-center text-slate-500">No users found matching your filters.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
