import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/teacher', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

export default function TeacherAssignmentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', totalMarks: 100, instructions: '', allowLateSubmission: false });

  useEffect(() => {
    Promise.all([API.get(`/classes/${id}`), API.get(`/assignments/class/${id}`)])
      .then(([c, a]) => { setCls(c.data); setAssignments(a.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const createAssignment = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, classId: id, allowLateSubmission: String(form.allowLateSubmission) }).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f));
      const res = await API.post('/assignments', fd);
      setAssignments(p => [...p, res.data]);
      toast.success('Assignment created!');
      setShowCreate(false);
      setForm({ title: '', description: '', dueDate: '', totalMarks: 100, instructions: '', allowLateSubmission: false });
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setCreating(false); }
  };

  const deleteAssignment = async (aId) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await API.delete(`/assignments/${aId}`);
      setAssignments(p => p.filter(a => a._id !== aId));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SidebarLayout navItems={navItems} title="Assignments">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/teacher/class/${id}`} className="text-slate-600 hover:text-slate-800 text-sm transition-colors">← {cls?.name}</Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Assignments</h1>
          <button onClick={() => setShowCreate(p => !p)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Assignment
          </button>
        </div>

        {showCreate && (
          <div className="card p-6 mb-6 animate-slide-up border-primary-500/30">
            <h3 className="section-title mb-5">Create Assignment</h3>
            <form onSubmit={createAssignment} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                  <input className="input-field" placeholder="Assignment title" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Due Date *</label>
                  <input type="datetime-local" className="input-field" required value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Marks</label>
                  <input type="number" className="input-field" value={form.totalMarks} onChange={e => setForm(p => ({ ...p, totalMarks: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Instructions</label>
                  <textarea className="input-field" rows={3} value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Detailed instructions for students..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Attachments</label>
                  <input type="file" multiple className="input-field text-sm" onChange={e => setFiles([...e.target.files])} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="late" className="w-4 h-4 accent-primary-500" checked={form.allowLateSubmission} onChange={e => setForm(p => ({ ...p, allowLateSubmission: e.target.checked }))} />
                  <label htmlFor="late" className="text-slate-700 text-sm">Allow late submissions</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span> : 'Create Assignment'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No assignments yet</h3>
            <p className="text-slate-500 mb-6">Create your first assignment for this class</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(a => {
              const isOverdue = new Date(a.dueDate) < new Date();
              return (
                <div key={a._id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-800 text-lg">{a.title}</h3>
                        <span className={`badge flex-shrink-0 ${isOverdue ? 'bg-slate-200 text-slate-600 border border-slate-400' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                          {isOverdue ? 'Closed' : 'Open'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm">{a.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>📅 Due: {format(new Date(a.dueDate), 'MMM d, yyyy · h:mm a')}</span>
                        <span>⭐ {a.totalMarks} marks</span>
                        {a.allowLateSubmission && <span>⏰ Late submissions allowed</span>}
                      </div>
                      {a.attachments?.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                          {a.attachments.map((f, i) => {
                            const fileUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${f.url}`;
                            const isVideo = f.name.match(/\.(mp4|webm|ogg|mov)$/i);
                            if (isVideo) {
                              return (
                                <div key={i} className="mt-1 text-sm text-slate-600">
                                  <p className="mb-2 font-medium">📎 {f.name}</p>
                                  <div className="rounded-xl overflow-hidden bg-slate-950 shadow-md max-w-sm w-full aspect-video">
                                    <video src={fileUrl} controls playsInline className="w-full h-full object-contain" />
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <a key={i} href={fileUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors border border-slate-300 w-max">
                                📎 {f.name}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => navigate(`/teacher/class/${id}/assignment/${a._id}/submissions`)} className="btn-secondary text-sm py-2 px-3">View Submissions</button>
                      <button onClick={() => deleteAssignment(a._id)} className="btn-danger text-sm py-2 px-3">🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
