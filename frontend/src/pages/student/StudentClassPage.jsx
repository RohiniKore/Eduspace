import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/student', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

export default function StudentClassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [comment, setComment] = useState('');
  const [activeAnn, setActiveAnn] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stream');

  useEffect(() => {
    Promise.all([
      API.get(`/classes/${id}`),
      API.get(`/announcements/class/${id}`),
      API.get(`/assignments/class/${id}`),
      API.get(`/live-classes/class/${id}`)
    ]).then(([c, a, asn, l]) => {
      setCls(c.data); setAnnouncements(a.data); setAssignments(asn.data); setLiveClasses(l.data);
    }).catch(() => toast.error('Failed to load class')).finally(() => setLoading(false));
  }, [id]);

  const addComment = async (annId) => {
    if (!comment.trim()) return;
    try {
      const res = await API.post(`/announcements/${annId}/comment`, { content: comment });
      setAnnouncements(p => p.map(a => a._id === annId ? res.data : a));
      setComment(''); setActiveAnn(null);
    } catch { toast.error('Failed to add comment'); }
  };

  if (loading) return <LoadingSpinner />;
  if (!cls) return <div className="p-8 text-slate-600">Class not found</div>;

  const upcoming = assignments.filter(a => new Date(a.dueDate) > new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <SidebarLayout navItems={navItems} title={cls.name}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero banner */}
        <div className="rounded-2xl overflow-hidden mb-6 relative h-40" style={{ background: `linear-gradient(135deg, ${cls.coverColor || '#4F46E5'}ee, ${cls.coverColor || '#4F46E5'}88)` }}>
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <h1 className="font-display text-3xl font-bold text-white">{cls.name}</h1>
            <p className="text-white/70">{cls.subject}{cls.section && ` · Section ${cls.section}`} · {cls.teacher?.name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200 mb-6 overflow-x-auto">
          {[
            { key: 'stream', label: '📢 Stream' },
            { key: 'assignments', label: '📝 Assignments' },
            { key: 'materials', label: '📂 Materials', path: `/student/class/${id}/materials` },
            { key: 'attendance', label: '📊 Attendance', path: `/student/class/${id}/attendance` },
          ].map(t => (
            t.path ? (
              <Link key={t.key} to={t.path} className="nav-link text-sm whitespace-nowrap">{t.label}</Link>
            ) : (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-primary-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}>
                {t.label}
              </button>
            )
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {/* Live Classes banner */}
            {liveClasses.length > 0 && (
              <div className="card p-5 border-l-4 border-l-red-500 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <h3 className="font-display text-lg font-bold text-slate-800">Live Sessions</h3>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {liveClasses.map(lc => (
                    <div key={lc._id} className={`flex items-center justify-between p-3 rounded-xl border ${lc.isActive ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <p className="font-semibold text-slate-800">{lc.title}</p>
                        <p className="text-xs text-slate-500">{format(new Date(lc.startedAt), 'MMM d, h:mm a')} {lc.isActive ? '· Active now' : '· Ended'}</p>
                      </div>
                      {lc.isActive ? (
                        <Link to={`/student/class/${id}/live/${lc.roomName}`} className="px-5 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm shadow-red-500/30 transition-all flex items-center gap-2">Join Now 🎥</Link>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">Ended</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'stream' && (
              announcements.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">📢</p>
                  <p className="text-slate-600">No announcements yet. Check back later!</p>
                </div>
              ) : announcements.map(ann => (
                <div key={ann._id} className="card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {ann.author?.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{ann.author?.name}</p>
                      <p className="text-slate-500 text-xs">{format(new Date(ann.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{ann.content}</p>

                  {ann.comments?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      {ann.comments.map((c, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0">{c.author?.name?.[0]}</div>
                          <div className="bg-slate-100/60 rounded-xl px-3 py-2 flex-1">
                            <span className="font-medium text-slate-700">{c.author?.name}</span>
                            <span className="text-slate-600 ml-2">{c.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-200/60">
                    {activeAnn === ann._id ? (
                      <div className="flex gap-2">
                        <input className="input-field text-sm py-2 flex-1" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment(ann._id)} autoFocus />
                        <button onClick={() => addComment(ann._id)} className="btn-primary py-2 px-4 text-sm">Post</button>
                        <button onClick={() => setActiveAnn(null)} className="btn-secondary py-2 px-3 text-sm">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveAnn(ann._id)} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1">
                        💬 Add comment
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {tab === 'assignments' && (
              assignments.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-slate-600">No assignments yet.</p>
                </div>
              ) : assignments.map(a => {
                const isOverdue = new Date(a.dueDate) < new Date();
                return (
                  <div key={a._id} className="card p-5 hover:border-slate-400/60 transition-all cursor-pointer group"
                    onClick={() => navigate(`/student/class/${id}/assignment/${a._id}`)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">📝</span>
                          <h3 className="font-semibold text-slate-800 group-hover:text-primary-400 transition-colors">{a.title}</h3>
                        </div>
                        <p className="text-slate-500 text-sm ml-7">{a.description?.slice(0, 100)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`badge ${isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                          {isOverdue ? 'Overdue' : 'Open'}
                        </span>
                        <p className="text-slate-500 text-xs mt-1">Due: {format(new Date(a.dueDate), 'MMM d')}</p>
                        <p className="text-slate-500 text-xs">{a.totalMarks} marks</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="section-title mb-3">Class Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600"><span>Teacher</span><span className="text-slate-700">{cls.teacher?.name}</span></div>
                <div className="flex justify-between text-slate-600"><span>Subject</span><span className="text-slate-700">{cls.subject}</span></div>
                <div className="flex justify-between text-slate-600"><span>Students</span><span className="text-slate-700">{cls.students?.length}</span></div>
              </div>
            </div>

            {upcoming.length > 0 && (
              <div className="card p-4">
                <h3 className="section-title mb-3">Upcoming</h3>
                <div className="space-y-2">
                  {upcoming.slice(0, 3).map(a => (
                    <div key={a._id} className="text-sm p-3 bg-slate-100/50 rounded-xl">
                      <p className="text-slate-700 font-medium">{a.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Due: {format(new Date(a.dueDate), 'MMM d, yyyy')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
