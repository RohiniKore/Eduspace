import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/teacher', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

export default function TeacherClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [liveClasses, setLiveClasses] = useState([]);
  const [startingLive, setStartingLive] = useState(false);
  const [cls, setCls] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codeVisible, setCodeVisible] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get(`/classes/${id}`), 
      API.get(`/announcements/class/${id}`),
      API.get(`/live-classes/class/${id}`)
    ])
      .then(([c, a, l]) => { setCls(c.data); setAnnouncements(a.data); setLiveClasses(l.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const startLiveClass = async () => {
    const title = prompt("Enter a topic for the Live Class:", "Live Session");
    if (!title) return;
    setStartingLive(true);
    try {
      const res = await API.post('/live-classes', { title, classId: id });
      navigate(`/teacher/class/${id}/live/${res.data.roomName}`);
    } catch {
      toast.error('Failed to start Live Class');
      setStartingLive(false);
    }
  };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnn.trim()) return;
    setPosting(true);
    try {
      const res = await API.post('/announcements', { classId: id, content: newAnn });
      setAnnouncements(p => [res.data, ...p]);
      setNewAnn('');
      toast.success('Announcement posted!');
    } catch { toast.error('Failed to post'); } finally { setPosting(false); }
  };

  const deleteAnnouncement = async (annId) => {
    try {
      await API.delete(`/announcements/${annId}`);
      setAnnouncements(p => p.filter(a => a._id !== annId));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(cls.classCode);
    toast.success('Class code copied!');
  };

  const regenerateCode = async () => {
    try {
      const res = await API.post(`/classes/${id}/regenerate-code`);
      setCls(p => ({ ...p, classCode: res.data.classCode }));
      toast.success('Class code regenerated!');
    } catch { toast.error('Failed to regenerate'); }
  };

  if (loading) return <LoadingSpinner />;
  if (!cls) return <div className="p-8 text-slate-600">Class not found</div>;

  const quickLinks = [
    { label: '📝 Assignments', path: `/teacher/class/${id}/assignments`, desc: 'Create & grade' },
    { label: '📂 Materials', path: `/teacher/class/${id}/materials`, desc: 'Upload resources' },
    { label: '📊 Attendance', path: `/teacher/class/${id}/attendance`, desc: 'Mark & track' },
  ];

  return (
    <SidebarLayout navItems={navItems} title={cls.name}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Banner */}
        <div className="rounded-2xl overflow-hidden mb-6 relative h-40" style={{ background: `linear-gradient(135deg, ${cls.coverColor || '#4F46E5'}ee, ${cls.coverColor || '#4F46E5'}88)` }}>
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <h1 className="font-display text-3xl font-bold text-white">{cls.name}</h1>
            <p className="text-white/70">{cls.subject}{cls.section && ` · Section ${cls.section}`}</p>
          </div>
          <div className="absolute top-4 right-4">
            <button onClick={() => setCodeVisible(p => !p)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-mono backdrop-blur-sm transition-all">
              {codeVisible ? cls.classCode : '••••••• '}
              <span className="ml-1 text-white/60">{codeVisible ? '🙈' : '👁'}</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Quick links */}
            <div className="grid grid-cols-3 gap-3">
              {quickLinks.map(({ label, path, desc }) => (
                <Link key={path} to={path} className="card p-4 text-center hover:border-primary-500/30 hover:bg-primary-600/5 transition-all group">
                  <p className="font-semibold text-slate-800 text-sm group-hover:text-primary-400 transition-colors">{label}</p>
                  <p className="text-slate-500 text-xs mt-1">{desc}</p>
                </Link>
              ))}
            </div>

            {/* Live Classes */}
            <div className="card p-5 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-800">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Live Sessions
                </h3>
                <button onClick={startLiveClass} disabled={startingLive} className="btn-primary flexitems-center justify-center gap-1 py-2 text-sm bg-red-500 hover:bg-red-600 shadow-red-500/30">
                  {startingLive ? 'Starting...' : 'Start class 🎥'}
                </button>
              </div>
              
              {liveClasses.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {liveClasses.map(lc => (
                    <div key={lc._id} className={`flex items-center justify-between p-3 rounded-xl border ${lc.isActive ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <p className="font-semibold text-slate-800">{lc.title}</p>
                        <p className="text-xs text-slate-500">{format(new Date(lc.startedAt), 'MMM d, h:mm a')} {lc.isActive ? '· Active now' : '· Ended'}</p>
                      </div>
                      {lc.isActive ? (
                        <div className="flex items-center gap-2">
                          <Link to={`/teacher/class/${id}/live/${lc.roomName}`} className="px-4 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm shadow-red-500/30 transition-all">Join</Link>
                          <button onClick={async () => {
                            if (!confirm('Are you sure you want to end this live session?')) return;
                            try {
                              await API.put(`/live-classes/${lc._id}/end`);
                              setLiveClasses(p => p.map(l => l._id === lc._id ? {...l, isActive: false} : l));
                              toast.success('Session ended');
                            } catch { toast.error('Failed to end session'); }
                          }} className="px-4 py-1.5 text-xs font-semibold text-red-500 bg-red-100 hover:bg-red-200 rounded-lg transition-all">End</button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">Ended</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent live sessions.</p>
              )}
            </div>

            {/* Post announcement */}
            <div className="card p-5">
              <h3 className="section-title mb-4">Post Announcement</h3>
              <form onSubmit={postAnnouncement} className="space-y-3">
                <textarea className="input-field resize-none" rows={3} placeholder="Share something with your class..."
                  value={newAnn} onChange={e => setNewAnn(e.target.value)} />
                <div className="flex justify-end">
                  <button type="submit" disabled={posting || !newAnn.trim()} className="btn-primary px-6">
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>

            {/* Announcements */}
            {announcements.map(ann => (
              <div key={ann._id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                      {ann.author?.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{ann.author?.name}</p>
                      <p className="text-slate-500 text-xs">{format(new Date(ann.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteAnnouncement(ann._id)} className="text-slate-600 hover:text-red-400 transition-colors text-sm">🗑</button>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{ann.content}</p>
                {ann.comments?.length > 0 && (
                  <p className="text-slate-500 text-xs mt-3 pt-3 border-t border-slate-200">{ann.comments.length} comment{ann.comments.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="section-title mb-3">Class Code</h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-primary-400 tracking-widest">{cls.classCode}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={copyCode} className="btn-secondary text-xs py-1.5 px-3 flex-1">📋 Copy</button>
                <button onClick={regenerateCode} className="btn-secondary text-xs py-1.5 px-3 flex-1">🔄 New</button>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="section-title mb-3">Students ({cls.students?.length || 0})</h3>
              {cls.students?.length === 0 ? (
                <p className="text-slate-500 text-sm">No students yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cls.students?.map(s => (
                    <div key={s._id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">{s.name?.[0]}</div>
                      <span className="text-slate-700 text-sm truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
