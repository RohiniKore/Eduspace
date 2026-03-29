import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const navItems = [
  { path: '/student', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V7zM13 7a1 1 0 011-1h6a1 1 0 011 1v10a1 1 0 01-1 1h-6a1 1 0 01-1-1V7z" /></svg> },
];

const CLASS_COLORS = ['#4F46E5','#7C3AED','#DB2777','#059669','#D97706','#DC2626','#2563EB','#0891B2'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    API.get('/classes/my').then(r => setClasses(r.data)).catch(() => toast.error('Failed to load classes')).finally(() => setLoading(false));
  }, []);

  const joinClass = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await API.post('/classes/join', { classCode: joinCode.trim().toUpperCase() });
      setClasses(p => [...p, res.data]);
      toast.success(`Joined "${res.data.name}"!`);
      setJoinCode(''); setShowJoin(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join class');
    } finally { setJoining(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SidebarLayout navItems={navItems} title="Student Dashboard">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-slate-600 mt-1">You're enrolled in {classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={() => setShowJoin(p => !p)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Join a Class
          </button>
        </div>

        {/* Join form */}
        {showJoin && (
          <div className="card p-6 mb-6 animate-slide-up border-primary-500/30">
            <h3 className="section-title mb-4">Join a class</h3>
            <form onSubmit={joinClass} className="flex gap-3">
              <input
                className="input-field flex-1 uppercase tracking-widest font-mono"
                placeholder="Enter class code (e.g. AB12C34)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={7}
              />
              <button type="submit" disabled={joining} className="btn-primary px-6">
                {joining ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" /> : 'Join'}
              </button>
            </form>
          </div>
        )}

        {/* Classes grid */}
        {classes.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No classes yet</h3>
            <p className="text-slate-500 mb-6">Ask your teacher for a class code to get started</p>
            <button onClick={() => setShowJoin(true)} className="btn-primary mx-auto">Join your first class</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls, i) => (
              <div
                key={cls._id}
                onClick={() => navigate(`/student/class/${cls._id}`)}
                className="card overflow-hidden cursor-pointer hover:border-slate-400/60 hover:scale-[1.02] transition-all duration-200 group"
              >
                <div className="h-24 flex items-end p-4" style={{ background: `linear-gradient(135deg, ${cls.coverColor || CLASS_COLORS[i % CLASS_COLORS.length]}dd, ${cls.coverColor || CLASS_COLORS[i % CLASS_COLORS.length]}88)` }}>
                  <h3 className="font-display font-bold text-white text-lg leading-tight">{cls.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-slate-600 text-sm mb-1">{cls.subject}{cls.section && ` • Section ${cls.section}`}</p>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                      {cls.teacher?.name?.[0]}
                    </span>
                    {cls.teacher?.name}
                  </p>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200/60">
                    <span className="text-xs text-slate-500">{cls.students?.length || 0} students</span>
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
