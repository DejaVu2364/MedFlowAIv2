import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BedDouble,
    Landmark,
    FileCheck,
    Users,
    LogOut,
    UserCircle,
    Stethoscope,
    RefreshCw,
    Menu,
    X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { usePatientData } from '../../hooks/usePatientData';
import { useRBAC } from '../../hooks/useRBAC';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { TokenUsageWidget } from '../TokenUsageWidget';

interface MedicalLayoutProps {
    children: React.ReactNode;
}

type AppMode = 'doctor' | 'admin';

export const MedicalLayout: React.FC<MedicalLayoutProps> = ({ children }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<AppMode>('doctor');
    const [mobileOpen, setMobileOpen] = useState(false);
    const { resetSystem } = usePatientData(currentUser);
    const { can, isAdmin } = useRBAC();

    // Sync mode with URL on initial load if user lands deep
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/beds') || path.includes('/revenue') || path.includes('/tpa')) {
            setMode('admin');
        } else {
            setMode('doctor');
        }
    }, []); // Run once on mount

    const handleModeSwitch = (newMode: AppMode) => {
        setMode(newMode);
        if (newMode === 'admin') {
            navigate('/beds');
        } else {
            navigate('/');
        }
    };

    const doctorNavItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/reception', label: 'Register Patient', icon: Users },
        { path: '/?view=triage', label: 'Triage', icon: Stethoscope },
    ];

    const adminNavItems = [
        { path: '/ops', label: 'Command Center', icon: LayoutDashboard },
        { path: '/beds', label: 'Bed Flow', icon: BedDouble },
        { path: '/revenue', label: 'Revenue Guard', icon: Landmark },
        { path: '/tpa', label: 'TPA Desk', icon: FileCheck },
    ];

    const currentNavItems = mode === 'doctor' ? doctorNavItems : adminNavItems;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Fixed Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-50 hidden md:flex transition-all duration-300">
                {/* Header */}
                <div className="h-20 flex flex-col justify-center px-4 border-b border-slate-800 space-y-2">
                    <h1 className="text-white font-bold text-lg tracking-widest uppercase flex items-center gap-2">
                        MedFlow <span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", mode === 'doctor' ? "bg-teal-500/20 text-teal-400" : "bg-indigo-500/20 text-indigo-400")}>
                            {mode === 'doctor' ? 'CLINICAL' : 'OPS'}
                        </span>
                    </h1>
                </div>

                {/* Mode Switcher - Only show if user can access admin */}
                {can('canAccessBeds') && (
                    <div className="px-4 py-4">
                        <div className="bg-slate-800 p-1 rounded-lg flex">
                            <button
                                onClick={() => handleModeSwitch('doctor')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                                    mode === 'doctor' ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Stethoscope className="w-3.5 h-3.5" />
                                Doctor
                            </button>
                            <button
                                onClick={() => handleModeSwitch('admin')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                                    mode === 'admin' ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <BedDouble className="w-3.5 h-3.5" />
                                Admin
                            </button>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1">
                    <div className="mb-2 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {mode === 'doctor' ? 'Clinical Workspace' : 'Hospital Operations'}
                    </div>
                    {currentNavItems.map((item) => {
                        // Custom active state logic to handle query params
                        const isActive = (() => {
                            const currentPath = location.pathname;
                            const currentSearch = location.search;

                            // For Triage (/?view=triage), only active if search matches
                            if (item.path.includes('?')) {
                                const [basePath, search] = item.path.split('?');
                                return currentPath === basePath && currentSearch === `?${search}`;
                            }

                            // For Dashboard (/), only active if NO query params
                            if (item.path === '/') {
                                return currentPath === '/' && !currentSearch;
                            }

                            // Default: pathname starts with item path
                            return currentPath.startsWith(item.path);
                        })();

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200",
                                    isActive
                                        ? (mode === 'doctor' ? "bg-teal-600 text-white shadow-lg shadow-teal-900/20" : "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20")
                                        : "hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-800 space-y-2">
                    {/* Reset Simulation Button */}
                    <button
                        onClick={resetSystem}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-500 hover:text-amber-400 hover:bg-amber-950/30 rounded-md transition-colors group"
                    >
                        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                        Reset Simulation Data
                    </button>

                    <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-800 transition-colors cursor-pointer">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", mode === 'doctor' ? "bg-teal-500/20 text-teal-400" : "bg-indigo-500/20 text-indigo-400")}>
                            <UserCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{currentUser?.name || 'Dr. User'}</p>
                            <p className="text-xs text-slate-500 truncate">{currentUser?.role || 'Clinician'}</p>
                        </div>
                        <button onClick={() => logout()} className="text-slate-500 hover:text-white">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-4 left-4 z-50 md:hidden p-2 bg-slate-900 text-white rounded-lg shadow-lg"
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-50 md:hidden transition-transform duration-300",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800">
                    <h1 className="text-white font-bold text-lg tracking-widest uppercase">
                        MedFlow
                    </h1>
                    <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {currentNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive ? "bg-teal-600/20 text-teal-400" : "hover:bg-slate-800 text-slate-400"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 min-h-screen bg-slate-50 transition-all duration-300 relative">
                {/* Subtle floating status indicator */}
                <div className="hidden md:flex fixed top-4 right-4 z-40 items-center gap-2">
                    <TokenUsageWidget compact />
                    <ConnectionStatus />
                </div>

                {/* Content */}
                <div className="pt-16 md:pt-6 p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};
