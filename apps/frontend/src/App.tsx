import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminKPIsPage } from './pages/admin/AdminKPIsPage';
import { ManagerLayout } from './layouts/ManagerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerTeamPage } from './pages/manager/ManagerTeamPage';
import { ManagerEvaluationPage } from './pages/manager/ManagerEvaluationPage';
import { ManagerEvaluationsPage } from './pages/manager/ManagerEvaluationsPage';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { UserProfilePage } from './pages/UserProfilePage';

function App() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
            user ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} /> : <Navigate to="/login" />
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminLayout /> : <Navigate to="/login" />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="teams" element={<AdminTeamsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:userId" element={<UserProfilePage />} />
            <Route path="evaluate/:userId" element={<ManagerEvaluationPage />} />
            <Route path="kpis" element={<AdminKPIsPage />} />
        </Route>

        {/* Manager Routes */}
        <Route path="/manager" element={user?.role === 'MANAGER' ? <ManagerLayout /> : <Navigate to="/login" />}>
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="team" element={<ManagerTeamPage />} />
            <Route path="evaluate/:userId" element={<ManagerEvaluationPage />} />
            <Route path="evaluations" element={<ManagerEvaluationsPage />} />
            <Route path="users/:userId" element={<UserProfilePage />} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={user?.role === 'EMPLOYEE' ? <EmployeeLayout /> : <Navigate to="/login" />}>
             <Route path="dashboard" element={<EmployeeDashboard />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
