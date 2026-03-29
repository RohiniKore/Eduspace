import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') {
         toast.success(`Welcome back, Admin!`);
         navigate('/admin');
      } else {
         toast.error(`Access Denied: You are not an admin`);
         // Optional: logout if not admin? The context doesn't export logout directly here but we can assume redirect is enough or they can just leave.
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center font-display font-bold text-white text-2xl mx-auto mb-4 shadow-lg">
            👑
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Admin Portal</h1>
          <p className="text-slate-500">Secure access for administrators</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Admin Email</label>
            <input
              type="email" required
              className="input-field bg-slate-50 focus:bg-white"
              placeholder="admin@eduspace.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} required
                className="input-field bg-slate-50 focus:bg-white pr-12"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm font-medium">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : 'Access Portal →'}
          </button>
        </form>
        
        <div className="mt-6 flex flex-col gap-3">
          
          <p className="text-center text-slate-500 mt-2">
            Need an admin account?{' '}
            <Link to="/admin/register" className="text-indigo-600 hover:text-indigo-500 font-medium">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
