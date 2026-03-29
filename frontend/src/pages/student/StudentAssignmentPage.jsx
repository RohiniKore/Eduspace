import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/student', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

export default function StudentAssignmentPage() {
  const { classId, id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([API.get(`/assignments/${id}`), API.get(`/submissions/my/${id}`)])
      .then(([a, s]) => { setAssignment(a.data); setSubmission(s.data); if (s.data) setContent(s.data.content || ''); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('assignmentId', id);
      fd.append('classId', classId);
      fd.append('content', content);
      files.forEach(f => fd.append('files', f));
      const res = await API.post('/submissions', fd);
      setSubmission(res.data);
      toast.success('Assignment submitted successfully!');
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!assignment) return <div className="p-8 text-slate-600">Assignment not found</div>;

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <SidebarLayout navItems={navItems} title={assignment.title}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to={`/student/class/${classId}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm mb-6 transition-colors">
          ← Back to class
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Assignment details */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="font-display text-2xl font-bold text-slate-900">{assignment.title}</h1>
                <span className={`badge flex-shrink-0 ${isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                  {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Due', value: format(new Date(assignment.dueDate), 'MMM d, yyyy · h:mm a') },
                  { label: 'Points', value: `${assignment.totalMarks} marks` },
                  { label: 'Posted by', value: assignment.teacher?.name },
                  { label: 'Late submission', value: assignment.allowLateSubmission ? 'Allowed' : 'Not allowed' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-100/50 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                    <p className="text-slate-800 text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
              {assignment.description && (
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-2">Description</h3>
                  <p className="text-slate-700 leading-relaxed">{assignment.description}</p>
                </div>
              )}
              {assignment.instructions && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-slate-600 text-sm font-medium mb-2">Instructions</h3>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{assignment.instructions}</p>
                </div>
              )}
              {assignment.attachments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-slate-600 text-sm font-medium mb-3">Attachments</h3>
                  <div className="flex flex-col gap-3">
                    {assignment.attachments.map((f, i) => {
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
                           className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors border border-slate-300 w-max">
                          📎 {f.name}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submission form */}
            {submission?.status === 'graded' ? (
              <div className="card p-6">
                <h2 className="section-title mb-4">📊 Your Grade</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl font-display font-bold text-primary-400">{submission.marks}</div>
                  <div>
                    <p className="text-slate-600 text-sm">out of {assignment.totalMarks} marks</p>
                    <p className="text-2xl font-bold text-slate-800">{Math.round((submission.marks / assignment.totalMarks) * 100)}%</p>
                  </div>
                </div>
                {submission.feedback && (
                  <div className="bg-slate-100/50 rounded-xl p-4">
                    <p className="text-slate-600 text-sm mb-2 font-medium">Teacher feedback:</p>
                    <p className="text-slate-700">{submission.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="section-title mb-4">
                  {submission ? '✏️ Edit Submission' : '📤 Your Submission'}
                </h2>
                {submission && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-4 text-sm text-green-400">
                    <span>✓</span>
                    <span>Submitted {format(new Date(submission.submittedAt), 'MMM d, yyyy · h:mm a')}</span>
                    {submission.isLate && <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-auto">Late</span>}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your answer / notes</label>
                    <textarea className="input-field min-h-[150px] resize-y" placeholder="Write your answer or describe what you've attached..."
                      value={content} onChange={e => setContent(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Attach files (optional)</label>
                    <input type="file" multiple className="input-field text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:text-sm file:cursor-pointer"
                      onChange={e => setFiles([...e.target.files])} />
                    {files.length > 0 && <p className="text-slate-500 text-xs mt-1">{files.length} file(s) selected</p>}
                  </div>
                  <button type="submit" disabled={submitting || (isOverdue && !assignment.allowLateSubmission)} className="btn-primary w-full py-3">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</span>
                    ) : submission ? 'Update submission' : 'Submit assignment'}
                  </button>
                  {isOverdue && !assignment.allowLateSubmission && <p className="text-red-400 text-sm text-center">Deadline has passed and late submissions are not allowed.</p>}
                </form>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="section-title mb-3">Status</h3>
              {submission ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-400"><span>✓</span> Submitted</div>
                  <div className="text-slate-500 text-xs">{format(new Date(submission.submittedAt), 'MMM d, h:mm a')}</div>
                  {submission.status === 'graded' && <div className="flex items-center gap-2 text-primary-400"><span>⭐</span> Graded: {submission.marks}/{assignment.totalMarks}</div>}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Not submitted yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
