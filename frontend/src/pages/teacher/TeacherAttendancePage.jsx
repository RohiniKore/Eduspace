import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/teacher', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];
const statusColor = { present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-amber-500', excused: 'bg-blue-500' };

export default function TeacherAttendancePage() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    API.get(`/classes/${id}`)
      .then(r => {
        setCls(r.data);
        setStudents(r.data.students || []);
        const initial = {};
        r.data.students?.forEach(s => { initial[s._id] = 'present'; });
        setRecords(initial);
      })
      .catch(() => toast.error('Failed to load class'))
      .finally(() => setLoading(false));
    API.get(`/attendance/class/${id}`).then(r => setHistory(r.data)).catch(() => {});
  }, [id]);

  const loadDateAttendance = async () => {
    try {
      const res = await API.get(`/attendance/class/${id}/date/${date}`);
      if (res.data) {
        const r = {};
        res.data.records?.forEach(rec => { r[rec.student?._id || rec.student] = rec.status; });
        setRecords(r);
        setTopic(res.data.topic || '');
        toast.success('Loaded existing attendance');
      } else {
        const fresh = {};
        students.forEach(s => { fresh[s._id] = 'present'; });
        setRecords(fresh);
        setTopic('');
      }
    } catch { toast.error('Failed to load attendance for this date'); }
  };

  const markAll = (status) => {
    const r = {};
    students.forEach(s => { r[s._id] = status; });
    setRecords(r);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const recordsList = students.map(s => ({ student: s._id, status: records[s._id] || 'absent' }));
      await API.post('/attendance', { classId: id, date, records: recordsList, topic });
      toast.success('Attendance saved!');
      const res = await API.get(`/attendance/class/${id}`);
      setHistory(res.data);
    } catch { toast.error('Failed to save attendance'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  const presentCount = Object.values(records).filter(s => s === 'present').length;
  const absentCount = Object.values(records).filter(s => s === 'absent').length;

  return (
    <SidebarLayout navItems={navItems} title="Attendance">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to={`/teacher/class/${id}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm mb-6 transition-colors">← {cls?.name}</Link>

        <h1 className="page-title mb-6">Attendance</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Date picker */}
            <div className="card p-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Topic / Session</label>
                  <input className="input-field" placeholder="e.g. Chapter 3 Intro" value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <button onClick={loadDateAttendance} className="btn-secondary whitespace-nowrap">Load date</button>
                </div>
              </div>

              {students.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {['present', 'absent', 'late', 'excused'].map(s => (
                    <button key={s} onClick={() => markAll(s)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 capitalize transition-all">
                      Mark all {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Students */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="section-title">Students ({students.length})</h3>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="text-green-400">{presentCount} present</span>
                  <span className="text-red-400">{absentCount} absent</span>
                </div>
              </div>
              {students.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No students enrolled yet.</div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {students.map(s => (
                    <div key={s._id} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 flex-shrink-0">{s.name?.[0]}</div>
                      <span className="flex-1 text-slate-700 font-medium">{s.name}</span>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map(status => (
                          <button key={status} onClick={() => setRecords(p => ({ ...p, [s._id]: status }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${records[s._id] === status ? `${statusColor[status]} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {students.length > 0 && (
                <div className="p-4 border-t border-slate-200">
                  <button onClick={saveAttendance} disabled={saving} className="btn-primary w-full">
                    {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span> : '💾 Save Attendance'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div>
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="section-title">Recent Sessions</h3>
              </div>
              {history.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No sessions recorded yet</div>
              ) : (
                <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
                  {history.slice(0, 10).map((h, i) => {
                    const p = h.records?.filter(r => r.status === 'present').length;
                    const t = h.records?.length;
                    return (
                      <div key={i} className="p-3 hover:bg-slate-100/30 cursor-pointer" onClick={() => setDate(h.date.split('T')[0])}>
                        <p className="text-slate-700 text-sm font-medium">{format(new Date(h.date), 'MMM d, yyyy')}</p>
                        {h.topic && <p className="text-slate-500 text-xs">{h.topic}</p>}
                        <p className="text-slate-500 text-xs mt-0.5">{p}/{t} present</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
