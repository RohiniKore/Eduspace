import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RoleSelectPage from './pages/auth/RoleSelectPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import AdminRegisterPage from './pages/auth/AdminRegisterPage';
import LiveClassPage from './pages/LiveClassPage';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentClassPage from './pages/student/StudentClassPage';
import StudentAssignmentPage from './pages/student/StudentAssignmentPage';
import StudentMaterialsPage from './pages/student/StudentMaterialsPage';
import StudentAttendancePage from './pages/student/StudentAttendancePage';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClassPage from './pages/teacher/TeacherClassPage';
import TeacherAssignmentsPage from './pages/teacher/TeacherAssignmentsPage';
import TeacherMaterialsPage from './pages/teacher/TeacherMaterialsPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import TeacherSubmissionsPage from './pages/teacher/TeacherSubmissionsPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminClassesPage from './pages/admin/AdminClassesPage';

import LoadingSpinner from './components/common/LoadingSpinner';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } }
        }} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/select-role" element={<RoleSelectPage />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/class/:id" element={<ProtectedRoute roles={['student']}><StudentClassPage /></ProtectedRoute>} />
          <Route path="/student/class/:id/live/:roomName" element={<ProtectedRoute roles={['student']}><LiveClassPage /></ProtectedRoute>} />
          <Route path="/student/class/:classId/assignment/:id" element={<ProtectedRoute roles={['student']}><StudentAssignmentPage /></ProtectedRoute>} />
          <Route path="/student/class/:id/materials" element={<ProtectedRoute roles={['student']}><StudentMaterialsPage /></ProtectedRoute>} />
          <Route path="/student/class/:id/attendance" element={<ProtectedRoute roles={['student']}><StudentAttendancePage /></ProtectedRoute>} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/class/:id" element={<ProtectedRoute roles={['teacher']}><TeacherClassPage /></ProtectedRoute>} />
          <Route path="/teacher/class/:id/live/:roomName" element={<ProtectedRoute roles={['teacher']}><LiveClassPage /></ProtectedRoute>} />
          <Route path="/teacher/class/:id/assignments" element={<ProtectedRoute roles={['teacher']}><TeacherAssignmentsPage /></ProtectedRoute>} />
          <Route path="/teacher/class/:id/materials" element={<ProtectedRoute roles={['teacher']}><TeacherMaterialsPage /></ProtectedRoute>} />
          <Route path="/teacher/class/:id/attendance" element={<ProtectedRoute roles={['teacher']}><TeacherAttendancePage /></ProtectedRoute>} />
          <Route path="/teacher/class/:classId/assignment/:id/submissions" element={<ProtectedRoute roles={['teacher']}><TeacherSubmissionsPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute roles={['admin']}><AdminClassesPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
