import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminRegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', adminSecret: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await register({ 
        name: form.name, 
        email: form.email, 
        password: form.password, 
        role: 'admin',
        adminSecret: form.adminSecret
      });
      toast.success(res.message || 'Admin Registration successful!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center font-display font-bold text-white text-2xl mx-auto mb-4 shadow-lg">
            🛡️
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Admin Registration</h1>
          <p className="text-slate-500">Create a new administrator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input type="text" required className="input-field bg-slate-50 focus:bg-white" placeholder="Admin Name" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input type="email" required className="input-field bg-slate-50 focus:bg-white" placeholder="admin@eduspace.com" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" required className="input-field bg-slate-50 focus:bg-white" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
            <input type="password" required className="input-field bg-slate-50 focus:bg-white" placeholder="Repeat your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key (Required)</label>
            <input type="password" required className="input-field bg-slate-50 focus:bg-white border-indigo-200 focus:border-indigo-400" placeholder="Enter admin secret key" value={form.adminSecret} onChange={set('adminSecret')} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering...
              </>
            ) : 'Register as Admin →'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">

          <p className="text-center text-slate-500 mt-2">
            Already an admin?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Portal Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
