import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    { icon: '🎓', title: 'Smart Classrooms', desc: 'Create and manage virtual classrooms with ease. Share materials, assignments, and announcements in one place.' },
    { icon: '📝', title: 'Assignments & Grading', desc: 'Create assignments with deadlines, collect submissions, give marks and personalized feedback to students.' },
    { icon: '📊', title: 'Attendance Tracking', desc: 'Mark and monitor attendance for every class session. Students can view their own attendance records.' },
    { icon: '📂', title: 'Material Management', desc: 'Upload and organize study materials — documents, videos, and links — organized by topic.' },
    { icon: '🎥', title: 'Live Video Classes', desc: 'Host a seamless live, synchronous HD video meeting with students right inside the app.' },
    { icon: '🔒', title: 'Role-Based Access', desc: 'Three-tier role system: Admin, Teacher, and Student — each with appropriate permissions and dashboards.' },
    { icon: '⚡', title: 'Real-Time Updates', desc: 'Teachers post announcements, students get updates instantly. Stay connected with your classroom community.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between bg-slate-50/80 backdrop-blur-md border-b border-slate-200/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">E</div>
          <span className="font-display font-bold text-xl text-slate-900">EduSpace</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary text-sm">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">Login</Link>
              <Link to="/select-role" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-slow" />
          Modern E-Learning Platform
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-6">
          Learning{' '}
          <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            reimagined
          </span>
          {' '}for everyone
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          EduSpace brings teachers and students together in a seamless digital classroom. Manage classes, assignments, attendance, and materials — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/select-role" className="btn-primary text-base px-8 py-4">Start for free →</Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-4">Sign in to your account</Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl font-bold text-slate-900 mb-4">Everything you need to teach and learn</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">From classroom management to grading, EduSpace has all the tools educators and students need.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card p-6 hover:border-primary-500/30 transition-all duration-300 group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display font-semibold text-slate-800 text-lg mb-2 group-hover:text-primary-400 transition-colors">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { role: 'Student', color: 'from-blue-500 to-cyan-500', icon: '👨‍🎓', perks: ['Join classes with code', 'Submit assignments', 'View attendance', 'Access materials'] },
              { role: 'Teacher', color: 'from-primary-500 to-violet-500', icon: '👩‍🏫', perks: ['Create & manage classes', 'Upload study materials', 'Grade submissions', 'Track attendance'] },
              { role: 'Admin', color: 'from-accent-500 to-rose-500', icon: '👨‍💼', perks: ['Approve teachers', 'Manage all users', 'View all classes', 'Generate reports'] },
            ].map(({ role, color, icon, perks }) => (
              <div key={role} className="card p-6 text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mx-auto mb-4`}>{icon}</div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-4">{role}</h3>
                <ul className="space-y-2 text-left">
                  {perks.map(p => (
                    <li key={p} className="flex items-center gap-2 text-slate-600 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto card p-12">
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-4">Ready to transform your classroom?</h2>
          <p className="text-slate-600 mb-8">Join thousands of teachers and students already using EduSpace.</p>
          <Link to="/select-role" className="btn-primary text-base px-10 py-4">Get started today →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-8 px-6 text-center text-slate-500 text-sm">
        <p>© 2025 EduSpace. Built with React, Node.js, Express & MongoDB.</p>
        <div className="mt-4">
          <Link to="/admin/login" className="text-primary-500 hover:text-primary-600 transition-colors">Admin Portal</Link>
        </div>
      </footer>
    </div>
  );
}
