import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientHistoryPage } from './pages/PatientHistoryPage';
import { DocumentProcessingPage } from './pages/DocumentProcessingPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { DoctorReviewPage } from './pages/DoctorReviewPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

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
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar onDemoLoaded={refreshCounts} />
        <div className="flex flex-1">
          <Sidebar
            unresolvedIssuesCount={unresolvedCount}
            summariesAwaitingCount={awaitingCount}
          />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/history" element={<PatientHistoryPage />} />
              <Route path="/documents" element={<DocumentProcessingPage />} />
              <Route path="/analysis" element={<AIAnalysisPage />} />
              <Route path="/doctor-review" element={<DoctorReviewPage />} />
              <Route path="/evaluation" element={<EvaluationPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
