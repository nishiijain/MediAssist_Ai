import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { WelcomePage } from './pages/WelcomePage';
import { DoctorLoginPage } from './pages/auth/DoctorLoginPage';
import { DoctorRegisterPage } from './pages/auth/DoctorRegisterPage';
import { PatientLoginPage } from './pages/auth/PatientLoginPage';
import { PatientRegisterPage } from './pages/auth/PatientRegisterPage';
import { PatientPortalPage } from './pages/patient/PatientPortalPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientHistoryPage } from './pages/PatientHistoryPage';
import { DocumentProcessingPage } from './pages/DocumentProcessingPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { DoctorReviewPage } from './pages/DoctorReviewPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

const DoctorLayout: React.FC<{
  unresolvedCount: number;
  awaitingCount: number;
  refreshCounts: () => void;
}> = ({ unresolvedCount, awaitingCount, refreshCounts }) => {
  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar onDemoLoaded={refreshCounts} />
        <div className="flex flex-1">
          <Sidebar
            unresolvedIssuesCount={unresolvedCount}
            summariesAwaitingCount={awaitingCount}
          />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export const App: React.FC = () => {
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [awaitingCount, setAwaitingCount] = useState(0);

  const refreshCounts = async () => {
    try {
      const stats = await api.getDashboardStats();
      setUnresolvedCount(stats.unresolved_issues_count || 0);
      setAwaitingCount(stats.summaries_awaiting_review || 0);
    } catch (_) {}
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Welcome Page */}
          <Route path="/" element={<WelcomePage />} />

          {/* Doctor Auth Routes */}
          <Route path="/doctor/login" element={<DoctorLoginPage />} />
          <Route path="/doctor/register" element={<DoctorRegisterPage />} />

          {/* Patient Auth Routes */}
          <Route path="/patient/login" element={<PatientLoginPage />} />
          <Route path="/patient/register" element={<PatientRegisterPage />} />

          {/* Dedicated Isolated Patient Portal */}
          <Route
            path="/patient/portal"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Doctor Clinical Workspace */}
          <Route
            element={
              <DoctorLayout
                unresolvedCount={unresolvedCount}
                awaitingCount={awaitingCount}
                refreshCounts={refreshCounts}
              />
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/history" element={<PatientHistoryPage />} />
            <Route path="/documents" element={<DocumentProcessingPage />} />
            <Route path="/analysis" element={<AIAnalysisPage />} />
            <Route path="/doctor-review" element={<DoctorReviewPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect to Welcome Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
