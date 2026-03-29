import { useNavigate } from 'react-router-dom';

export default function RoleSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center font-display font-bold text-white">E</div>
            <span className="font-display font-bold text-2xl text-slate-900">EduSpace</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-3">Join as...</h1>
          <p className="text-slate-600 text-lg">Choose your role to get started</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              role: 'student',
              icon: '👨‍🎓',
              title: 'Student',
              desc: 'Join classes, submit assignments, track your attendance and access study materials.',
              gradient: 'from-blue-500/20 to-cyan-500/10',
              border: 'hover:border-blue-500/40',
              badge: 'Instant access',
              badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            },
            {
              role: 'teacher',
              icon: '👩‍🏫',
              title: 'Teacher',
              desc: 'Create classes, upload materials, manage assignments, grade students and track attendance.',
              gradient: 'from-primary-500/20 to-violet-500/10',
              border: 'hover:border-primary-500/40',
              badge: 'Requires approval',
              badgeColor: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
            },
            {
              role: 'admin',
              icon: '🛡️',
              title: 'Admin',
              desc: 'Manage users, approve teachers, and oversee the entire educational platform safely.',
              gradient: 'from-amber-500/20 to-orange-500/10',
              border: 'hover:border-amber-500/40',
              badge: 'Requires secret',
              badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            },
          ].map(({ role, icon, title, desc, gradient, border, badge, badgeColor }) => (
            <button
              key={role}
              onClick={() => {
                if (role === 'admin') navigate('/admin/register');
                else navigate(`/register?role=${role}`);
              }}
              className={`card p-8 text-left transition-all duration-300 cursor-pointer group ${border} bg-gradient-to-br ${gradient} hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className="text-5xl mb-5">{icon}</div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-display font-bold text-2xl text-slate-900">{title}</h2>
                <span className={`badge border ${badgeColor}`}>{badge}</span>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">{desc}</p>
              <div className="flex items-center gap-2 text-primary-500 font-semibold group-hover:gap-3 transition-all">
                <span>Register as {title}</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-slate-500 mt-8">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-primary-400 hover:text-primary-300 font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
