import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/teacher', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

export default function TeacherSubmissionsPage() {
  const { classId, id: assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({});
  const [grades, setGrades] = useState({});

  useEffect(() => {
    Promise.all([API.get(`/assignments/${assignmentId}`), API.get(`/submissions/assignment/${assignmentId}`)])
      .then(([a, s]) => {
        setAssignment(a.data); setSubmissions(s.data);
        const initial = {};
        s.data.forEach(sub => { initial[sub._id] = { marks: sub.marks || '', feedback: sub.feedback || '' }; });
        setGrades(initial);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const gradeSubmission = async (subId) => {
    setGrading(p => ({ ...p, [subId]: true }));
    try {
      const res = await API.put(`/submissions/${subId}/grade`, grades[subId]);
      setSubmissions(p => p.map(s => s._id === subId ? { ...s, ...res.data } : s));
      toast.success('Grade saved!');
    } catch { toast.error('Failed to save grade'); }
    finally { setGrading(p => ({ ...p, [subId]: false })); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SidebarLayout navItems={navItems} title="Submissions">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link to={`/teacher/class/${classId}/assignments`} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm mb-6 transition-colors">← Assignments</Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">{assignment?.title}</h1>
            <p className="text-slate-600 text-sm mt-1">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} · {assignment?.totalMarks} total marks</p>
          </div>
          <div className="text-right">
            <p className="text-slate-600 text-sm">Graded: <span className="text-primary-400 font-semibold">{submissions.filter(s => s.status === 'graded').length}/{submissions.length}</span></p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No submissions yet</h3>
            <p className="text-slate-500">Students haven't submitted this assignment yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {submissions.map(sub => (
              <div key={sub._id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">{sub.student?.name?.[0]}</div>
                    <div>
                      <p className="font-semibold text-slate-800">{sub.student?.name}</p>
                      <p className="text-slate-500 text-xs">{sub.student?.email} · Submitted {format(new Date(sub.submittedAt), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.isLate && <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">Late</span>}
                    <span className={`badge ${sub.status === 'graded' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-200 text-slate-600 border border-slate-400'}`}>
                      {sub.status === 'graded' ? `Graded: ${sub.marks}/${assignment?.totalMarks}` : 'Ungraded'}
                    </span>
                  </div>
                </div>

                {sub.content && (
                  <div className="bg-slate-100/50 rounded-xl p-4 mb-4">
                    <p className="text-slate-700 text-sm leading-relaxed">{sub.content}</p>
                  </div>
                )}

                {sub.attachments?.length > 0 && (
                  <div className="flex flex-col gap-3 mb-4">
                    {sub.attachments.map((f, i) => {
                      const fileUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${f.url}`;
                      const isVideo = f.name.match(/\.(mp4|webm|ogg|mov)$/i);
                      
                      if (isVideo) {
                        return (
                          <div key={i} className="mt-2 text-sm text-slate-600">
                            <p className="mb-2 font-medium">📎 {f.name}</p>
                            <div className="rounded-xl overflow-hidden bg-slate-950 shadow-md max-w-2xl w-full aspect-video">
                              <video src={fileUrl} controls playsInline className="w-full h-full object-contain" />
                            </div>
                          </div>
                        );
                      }
                      return (
                        <a key={i} href={fileUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition-colors w-max">
                          📎 {f.name}
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Grading */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Marks (out of {assignment?.totalMarks})</label>
                      <input type="number" min="0" max={assignment?.totalMarks} className="input-field py-2 text-sm"
                        placeholder="0"
                        value={grades[sub._id]?.marks ?? ''}
                        onChange={e => setGrades(p => ({ ...p, [sub._id]: { ...p[sub._id], marks: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Feedback</label>
                      <input className="input-field py-2 text-sm" placeholder="Optional feedback for student..."
                        value={grades[sub._id]?.feedback ?? ''}
                        onChange={e => setGrades(p => ({ ...p, [sub._id]: { ...p[sub._id], feedback: e.target.value } }))} />
                    </div>
                  </div>
                  <button onClick={() => gradeSubmission(sub._id)} disabled={grading[sub._id]} className="btn-primary text-sm py-2 px-4">
                    {grading[sub._id] ? 'Saving...' : sub.status === 'graded' ? '✓ Update Grade' : 'Save Grade'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
