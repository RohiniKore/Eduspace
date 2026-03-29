import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/student', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

const statusStyle = { present: 'bg-green-500/10 text-green-400 border-green-500/20', absent: 'bg-red-500/10 text-red-400 border-red-500/20', late: 'bg-amber-500/10 text-amber-400 border-amber-500/20', excused: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };

export default function StudentAttendancePage() {
  const { id } = useParams();
  const [attendance, setAttendance] = useState([]);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get(`/classes/${id}`), API.get(`/attendance/my/${id}`)])
      .then(([c, a]) => { setCls(c.data); setAttendance(a.data); })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const late = attendance.filter(a => a.status === 'late').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <SidebarLayout navItems={navItems} title="Attendance">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link to={`/student/class/${id}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm mb-6 transition-colors">← Back to class</Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">My Attendance</h1>
            <p className="text-slate-600 text-sm mt-1">{cls?.name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Attendance %', value: `${pct}%`, color: pct >= 75 ? 'text-green-400' : 'text-red-400' },
            { label: 'Present', value: present, color: 'text-green-400' },
            { label: 'Late', value: late, color: 'text-amber-400' },
            { label: 'Absent', value: absent, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card text-center">
              <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="card p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Overall attendance</span>
            <span className={`font-semibold ${pct >= 75 ? 'text-green-400' : 'text-red-400'}`}>{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
          </div>
          {pct < 75 && <p className="text-red-400 text-xs mt-2">⚠️ Below 75% minimum attendance threshold</p>}
        </div>

        {/* Records */}
        {attendance.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-slate-600">No attendance records yet.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="section-title">Attendance History</h3>
            </div>
            <div className="divide-y divide-slate-800/60">
              {attendance.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-slate-700 text-sm font-medium">{format(new Date(a.date), 'EEEE, MMMM d, yyyy')}</p>
                    {a.topic && <p className="text-slate-500 text-xs mt-0.5">{a.topic}</p>}
                  </div>
                  <span className={`badge border ${statusStyle[a.status] || statusStyle.absent} capitalize`}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
