import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { PatientProvider } from './contexts/PatientContext';
import DashboardPage from './pages/DashboardPage';
import ReceptionPage from './pages/ReceptionPage';
import TriagePage from './pages/TriagePage';
import PatientDetailPage from './pages/PatientDetailPage';
import DischargeSummaryPage from './pages/DischargeSummaryPage';
import VitalsPage from './pages/VitalsPage';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';

const ProtectedLayout: React.FC = () => {
    const { currentUser } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background-secondary font-sans transition-colors duration-200">
            <Header onToggleChat={() => setIsChatOpen(!isChatOpen)} />
            <main className="p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
            <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/reception" element={<ReceptionPage />} />
                <Route path="/triage" element={<TriagePage />} />
                <Route path="/patient/:id" element={<PatientDetailPage />} />
                <Route path="/patient/:id/vitals" element={<VitalsPage />} />
                <Route path="/discharge/:id" element={<DischargeSummaryPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    useEffect(() => {
        console.log("MedFlow AI v1.0.2 - Vitals Page Added - " + new Date().toISOString());
    }, []);
    return (
        <Router>
            {/* Version: 1.0.1 - Force Update */}
            <ErrorBoundary>
                <ToastProvider>
                    <UIProvider>
                        <AuthProvider>
                            <PatientProvider>
                                <AppRoutes />
                            </PatientProvider>
                        </AuthProvider>
                    </UIProvider>
                </ToastProvider>
            </ErrorBoundary>
        </Router>
    );
};

export default App;