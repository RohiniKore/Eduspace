import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a1 1 0 011-1h6v5H3V7zM13 7h7a1 1 0 011 1v10a1 1 0 01-1 1h-7V7z" /></svg> },
  { path: '/admin/users', label: 'Users', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { path: '/admin/classes', label: 'Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg> },
];

const COLORS = ['#4F46E5','#7C3AED','#DB2777','#059669','#D97706','#DC2626','#2563EB','#0891B2'];

export default function AdminClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/classes').then(r => setClasses(r.data)).catch(() => toast.error('Failed to load classes')).finally(() => setLoading(false));
  }, []);

  const deleteClass = async (classId) => {
    if (!confirm('Delete this class? This action cannot be undone.')) return;
    try {
      await API.delete(`/admin/classes/${classId}`);
      setClasses(p => p.filter(c => c._id !== classId));
      toast.success('Class deleted');
    } catch { toast.error('Failed to delete class'); }
  };

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SidebarLayout navItems={navItems} title="All Classes">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="page-title">All Classes</h1>
          <p className="text-slate-600 mt-1">{classes.length} classes on platform</p>
        </div>

        <input className="input-field max-w-sm mb-6" placeholder="Search classes, subjects, teachers..." value={search} onChange={e => setSearch(e.target.value)} />

        {loading ? <LoadingSpinner fullScreen={false} /> : (
          filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-4xl mb-3">🏫</p>
              <p className="text-slate-600">No classes found.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((cls, i) => (
                <div key={cls._id} className="card overflow-hidden hover:border-slate-400/60 transition-all">
                  <div className="h-20 flex items-end justify-between p-4" style={{ background: `linear-gradient(135deg, ${cls.coverColor || COLORS[i % COLORS.length]}dd, ${cls.coverColor || COLORS[i % COLORS.length]}88)` }}>
                    <h3 className="font-display font-bold text-white leading-tight">{cls.name}</h3>
                    <span className="font-mono text-xs text-white/70 bg-black/20 px-2 py-0.5 rounded">{cls.classCode}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-slate-600 text-sm mb-1">{cls.subject}{cls.section && ` · ${cls.section}`}</p>
                    <p className="text-slate-500 text-sm">👩‍🏫 {cls.teacher?.name}</p>
                    <p className="text-slate-500 text-sm">👥 {cls.students?.length || 0} students</p>
                    <p className="text-slate-600 text-xs mt-2">{format(new Date(cls.createdAt), 'MMM d, yyyy')}</p>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                      <button onClick={() => deleteClass(cls._id)} className="btn-danger text-xs py-1.5 px-3">Delete Class</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </SidebarLayout>
  );
}
