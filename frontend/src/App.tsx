import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { defaultHomePathForRole, rolesAllowedForPath } from './config/roleAccess';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MastersPage } from './pages/MastersPage';
import { IntakesPage } from './pages/IntakesPage';
import { ApplicantsPage } from './pages/ApplicantsPage';
import { AllocationPage } from './pages/AllocationPage';
import { AdmissionConfirmationPage } from './pages/AdmissionConfirmationPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

/** Blocks the page unless `user.role` (from JWT / `/auth/me`) is allowed for this path. */
function RoleRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const allowed = rolesAllowedForPath(path);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) {
    return <Navigate to={defaultHomePathForRole(user.role)} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app/dashboard"
        element={
          <PrivateRoute>
            <RoleRoute path="/app/dashboard">
              <DashboardPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/masters"
        element={
          <PrivateRoute>
            <RoleRoute path="/app/masters">
              <MastersPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/intakes"
        element={
          <PrivateRoute>
            <RoleRoute path="/app/intakes">
              <IntakesPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/applicants"
        element={
          <PrivateRoute>
            <RoleRoute path="/app/applicants">
              <ApplicantsPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/allocation"
        element={
          <PrivateRoute>
            <RoleRoute path="/app/allocation">
              <AllocationPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/app/admission-confirmed/:applicantId"
        element={
          <PrivateRoute>
            <RoleRoute path="/app/admission-confirmed">
              <AdmissionConfirmationPage />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}
