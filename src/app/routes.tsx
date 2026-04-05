import { createBrowserRouter, Navigate } from 'react-router';
import { authService } from './services/AuthService';
import { LoginForm } from './components/LoginForm';
import { DashboardLayout } from './components/DashboardLayout';
import { Locations } from './pages/Locations';
import { FloorView } from './pages/FloorView';
import { FloorEditor } from './pages/FloorEditor';
import { Systems } from './pages/Systems';
import { UserManagement } from './pages/UserManagement';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function LoginRoute({ children }: { children: React.ReactNode }) {
  if (authService.isAuthenticated()) {
    return <Navigate to="/locations" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <LoginRoute>
        <LoginForm />
      </LoginRoute>
    ),
  },
  {
    path: '/locations',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Locations />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/floor/:id',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <FloorView />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/floor/:id/edit',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <FloorEditor />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/systems',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Systems />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <UserManagement />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);