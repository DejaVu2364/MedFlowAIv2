import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { PatientProvider } from './contexts/PatientContext';
import { ToastProvider } from './contexts/ToastContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CommandPalette } from './components/ui/command-palette';
import { UnifiedAICopilot } from './components/ai/UnifiedAICopilot';

// Helper to handle chunk load errors (e.g., after deployment)
const lazyLoad = (importFunc: () => Promise<any>) => {
    return React.lazy(() => {
        return importFunc().catch(error => {
            console.error("Chunk load failed", error);
            // Check if we already tried to reload to avoid infinite loop
            const hasReloaded = sessionStorage.getItem('chunk_reload');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk_reload', 'true');
                window.location.reload();
            }
            throw error;
        });
    });
};

// Lazy load pages for performance
const DashboardPage = lazyLoad(() => import('./pages/DashboardPage'));
const DashboardV2 = lazyLoad(() => import('./pages/DashboardV2'));
const DashboardV3 = lazyLoad(() => import('./pages/DashboardV3'));
const TPADesk = lazyLoad(() => import('./pages/TPADesk'));
const PatientWorkspaceV2 = lazyLoad(() => import('./pages/PatientWorkspaceV2'));
const RevenueDashboard = lazyLoad(() => import('./pages/RevenueDashboard'));
const BedManager = lazyLoad(() => import('./pages/BedManager'));
const ConsultantViewPage = lazyLoad(() => import('./pages/ConsultantViewPage'));
const ReceptionPage = lazyLoad(() => import('./pages/ReceptionPage'));
const TriagePage = lazyLoad(() => import('./pages/TriagePage'));
const PatientDetailPage = lazyLoad(() => import('./pages/PatientDetailPage'));
const DischargeSummaryPage = React.lazy(() => import('./pages/DischargeSummaryPage'));
const DischargePrintView = lazyLoad(() => import('./pages/DischargePrintView'));
const LoginPage = lazyLoad(() => import('./pages/LoginPage'));
const NotFoundPage = lazyLoad(() => import('./pages/NotFoundPage'));
const AdminRevenueDashboard = lazyLoad(() => import('./pages/AdminRevenueDashboard'));
const OpsCommandCenter = lazyLoad(() => import('./pages/OpsCommandCenter'));

import Header from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';

import { VitalsMonitorProvider } from './components/VitalsMonitorProvider';
import { LabAlertProvider } from './components/LabAlertProvider';
import ErrorBoundary from './components/ErrorBoundary';

import { MedicalLayout } from './components/layout/MedicalLayout';

const ProtectedLayout: React.FC = () => {
    const { currentUser, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <>
            <MedicalLayout>
                <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
                    <Outlet />
                </div>
            </MedicalLayout>
            <UnifiedAICopilot />
        </>
    );
};

const AppRoutes: React.FC = () => {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Loading MedFlow OS...</p>
                </div>
            </div>
        }>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<DashboardV3 />} />
                    <Route path="/dashboard-old" element={<DashboardV2 />} />
                    <Route path="/beds" element={<BedManager />} />
                    <Route path="/revenue" element={<RevenueDashboard />} />
                    <Route path="/tpa" element={<TPADesk />} />
                    <Route path="/ops" element={<OpsCommandCenter />} />
                    <Route path="/patients" element={<ReceptionPage />} />

                    {/* Primary Patient Workspace */}
                    <Route path="/patient-v2/:id" element={<PatientWorkspaceV2 />} />

                    {/* Other Routes */}
                    <Route path="/consultant" element={<ConsultantViewPage />} />
                    <Route path="/reception" element={<ReceptionPage />} />
                    <Route path="/triage" element={<TriagePage />} />
                    <Route path="/patient/:id/discharge" element={<DischargeSummaryPage />} />
                    <Route path="/patient/:id/discharge/print" element={<DischargePrintView />} />
                    <Route path="/admin/revenue" element={<AdminRevenueDashboard />} />

                    {/* Legacy patient route - keep for backward compatibility */}
                    <Route path="/patient/:id/:tab?" element={<PatientDetailPage />} />
                </Route>

                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<DashboardV3 />} />
            </Routes>
        </React.Suspense>
    );
};

const App: React.FC = () => {
    useEffect(() => {
        console.log("MedFlow AI v1.0.5 - Auto Seed Added - " + new Date().toISOString());

        const firebaseKey = import.meta.env.VITE_FIREBASE_API_KEY;
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

        console.log("DEBUG: Firebase Key present:", !!firebaseKey);
        console.log("DEBUG: Gemini Key present:", !!geminiKey);

        if (!firebaseKey || firebaseKey.includes("YOUR_API_KEY")) {
            console.error("CRITICAL: Firebase API Key is missing or default!");
        }
        if (!geminiKey || geminiKey.includes("YOUR_API_KEY")) {
            console.warn("WARNING: Gemini API Key is missing or default! AI features will fail.");
        }

        // Clear the reload flag on successful load
        sessionStorage.removeItem('chunk_reload');
    }, []);
    return (
        <Router>
            {/* Version: 1.0.2 - Vitals Monitor + Simulation Badge */}
            <ErrorBoundary>
                <OfflineBanner />

                <ToastProvider>
                    <UIProvider>
                        <AuthProvider>
                            <PatientProvider>
                                <VitalsMonitorProvider>
                                    <LabAlertProvider>
                                        <AppRoutes />
                                    </LabAlertProvider>
                                </VitalsMonitorProvider>
                            </PatientProvider>
                        </AuthProvider>
                    </UIProvider>
                </ToastProvider>
            </ErrorBoundary>
        </Router>
    );
};

export default App;