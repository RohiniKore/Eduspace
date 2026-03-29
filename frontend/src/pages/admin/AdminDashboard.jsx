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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([API.get('/admin/stats'), API.get('/admin/pending-teachers')])
      .then(([s, p]) => { setStats(s.data); setPending(p.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const approveTeacher = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/approve`);
      toast.success('Teacher approved!');
      loadData();
    } catch { toast.error('Failed to approve'); }
  };

  const rejectTeacher = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/deactivate`);
      toast.success('Teacher rejected');
      loadData();
    } catch { toast.error('Failed to reject'); }
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'text-blue-400' },
    { label: 'Teachers', value: stats?.totalTeachers || 0, icon: '👩‍🏫', color: 'text-violet-400' },
    { label: 'Students', value: stats?.totalStudents || 0, icon: '👨‍🎓', color: 'text-cyan-400' },
    { label: 'Pending Approval', value: stats?.pendingTeachers || 0, icon: '⏳', color: 'text-amber-400' },
    { label: 'Total Classes', value: stats?.totalClasses || 0, icon: '🏫', color: 'text-green-400' },
    { label: 'Assignments', value: stats?.totalAssignments || 0, icon: '📝', color: 'text-primary-400' },
  ];

  return (
    <SidebarLayout navItems={navItems} title="Admin Dashboard">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Platform overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon, color }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{icon}</span>
              </div>
              <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending teachers */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="section-title">Pending Teacher Approvals</h3>
              {pending.length > 0 && <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">{pending.length}</span>}
            </div>
            {pending.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">✅ No pending approvals</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {pending.map(t => (
                  <div key={t._id} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{t.name?.[0]}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{t.name}</p>
                        <p className="text-slate-500 text-xs truncate">{t.email}</p>
                        <p className="text-slate-600 text-xs">{format(new Date(t.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approveTeacher(t._id)} className="btn-primary text-xs py-1.5 px-3">Approve</button>
                      <button onClick={() => rejectTeacher(t._id)} className="btn-danger text-xs py-1.5 px-3">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent users */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="section-title">Recent Users</h3>
              <Link to="/admin/users" className="text-primary-400 hover:text-primary-300 text-sm">View all →</Link>
            </div>
            <div className="divide-y divide-slate-800/60">
              {stats?.recentUsers?.map(u => (
                <div key={u._id} className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-sm font-bold flex-shrink-0">{u.name?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm font-medium truncate">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge capitalize ${u.role === 'teacher' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : u.role === 'student' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'}`}>{u.role}</span>
                    {u.role === 'teacher' && !u.isApproved && <p className="text-amber-400 text-xs mt-0.5">Pending</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
