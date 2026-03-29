import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [params] = useSearchParams();
  const defaultRole = params.get('role') || 'student';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: defaultRole });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      toast.success(res.message || 'Registration successful!');
      if (form.role === 'teacher') {
        toast('Your account is pending admin approval.', { icon: '⏳' });
        navigate('/login');
      } else {
        navigate('/student');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">E</div>
          <span className="font-display font-bold text-xl text-slate-900">EduSpace</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Create account</h1>
        <p className="text-slate-600 mb-8">Join EduSpace as a <span className="text-primary-400 font-medium capitalize">{form.role}</span></p>

        {/* Role toggle */}
        <div className="flex gap-2 p-1 bg-slate-100/60 rounded-xl mb-6 border border-slate-300/50">
          {['student', 'teacher'].map(r => (
            <button
              key={r} type="button"
              onClick={() => setForm(p => ({ ...p, role: r }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.role === r ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-800'}`}
            >
              {r === 'student' ? '👨‍🎓' : '👩‍🏫'} {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {form.role === 'teacher' && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
            <span className="text-amber-400 text-lg">⚠️</span>
            <p className="text-amber-300/80 text-sm">Teacher accounts require admin approval before you can create classes. You'll be notified once approved.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
            <input type="text" required className="input-field" placeholder="John Doe" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
            <input type="email" required className="input-field" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input type="password" required className="input-field" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
            <input type="password" required className="input-field" placeholder="Repeat your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : `Create ${form.role} account →`}
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
