import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const navItems = [
  { path: '/teacher', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V7zM13 7a1 1 0 011-1h6a1 1 0 011 1v10a1 1 0 01-1 1h-6a1 1 0 01-1-1V7z" /></svg> },
];

const COLORS = ['#4F46E5','#7C3AED','#DB2777','#059669','#D97706','#DC2626','#2563EB','#0891B2'];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', section: '', description: '', coverColor: '#4F46E5' });

  useEffect(() => {
    if (!user?.isApproved) { setLoading(false); return; }
    API.get('/classes/my').then(r => setClasses(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [user]);

  const createClass = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await API.post('/classes', form);
      setClasses(p => [res.data, ...p]);
      toast.success(`Class "${res.data.name}" created! Code: ${res.data.classCode}`);
      setShowCreate(false);
      setForm({ name: '', subject: '', section: '', description: '', coverColor: '#4F46E5' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    } finally { setCreating(false); }
  };

  if (loading) return <LoadingSpinner />;

  if (!user?.isApproved) {
    return (
      <SidebarLayout navItems={navItems} title="Teacher Dashboard">
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="card p-12 text-center max-w-lg">
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-3">Awaiting Approval</h2>
            <p className="text-slate-600 leading-relaxed">Your teacher account is pending admin approval. You'll be able to create classes once an administrator approves your account.</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} title="Teacher Dashboard">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title">My Classes</h1>
            <p className="text-slate-600 mt-1">Managing {classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={() => setShowCreate(p => !p)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Class
          </button>
        </div>

        {/* Create class form */}
        {showCreate && (
          <div className="card p-6 mb-6 animate-slide-up border-primary-500/30">
            <h3 className="section-title mb-5">Create New Class</h3>
            <form onSubmit={createClass} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Class name *</label>
                  <input className="input-field" placeholder="e.g. Mathematics" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                  <input className="input-field" placeholder="e.g. Algebra, Physics" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Section</label>
                  <input className="input-field" placeholder="e.g. A, B, Morning" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cover color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(p => ({ ...p, coverColor: c }))}
                        className={`w-8 h-8 rounded-lg transition-all ${form.coverColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea className="input-field" rows={2} placeholder="Brief description of the class..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span> : 'Create Class'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {classes.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No classes yet</h3>
            <p className="text-slate-500 mb-6">Create your first class to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">Create your first class</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls, i) => (
              <div key={cls._id} onClick={() => navigate(`/teacher/class/${cls._id}`)}
                className="card overflow-hidden cursor-pointer hover:border-slate-400/60 hover:scale-[1.02] transition-all duration-200 group">
                <div className="h-24 flex items-end justify-between p-4" style={{ background: `linear-gradient(135deg, ${cls.coverColor || COLORS[i % COLORS.length]}dd, ${cls.coverColor || COLORS[i % COLORS.length]}88)` }}>
                  <h3 className="font-display font-bold text-white text-lg leading-tight">{cls.name}</h3>
                  <span className="text-white/80 font-mono text-xs bg-black/20 px-2 py-1 rounded">{cls.classCode}</span>
                </div>
                <div className="p-4">
                  <p className="text-slate-600 text-sm mb-3">{cls.subject}{cls.section && ` · ${cls.section}`}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>👥 {cls.students?.length || 0} students</span>
                    <span className="text-primary-400 font-medium group-hover:text-primary-300">Manage →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
