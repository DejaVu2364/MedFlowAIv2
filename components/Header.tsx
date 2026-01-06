import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { HomeIcon, UserPlusIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, SunIcon, MoonIcon, UserCircleIcon, XMarkIcon, UsersIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import { ConnectionStatus } from './common/ConnectionStatus';
import { AlertBadge } from './AlertBadge';

interface HeaderProps {
    onToggleChat?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleChat }) => {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useUI();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [showSetupInfo, setShowSetupInfo] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', path: '/', icon: <HomeIcon />, testId: 'nav-dashboard' },
        { name: 'Reception', path: '/reception', icon: <UserPlusIcon />, testId: 'nav-reception' },
        { name: 'Triage', path: '/?view=triage', icon: <ClipboardDocumentListIcon />, testId: 'nav-triage' },
        { name: 'Consultant', path: '/?view=consultant', icon: <UsersIcon />, testId: 'nav-consultant' },
    ];

    if (currentUser.role === 'Admin') {
        navigation.push({ name: 'Revenue', path: '/admin/revenue', icon: <ChartBarSquareIcon />, testId: 'nav-revenue' });
    }

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (!currentUser) {
        return null;
    }

    return (
        <>
            <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <h1 className="text-lg font-bold tracking-tight text-foreground">
                                    MedFlow<span className="font-normal text-muted-foreground">AI</span>
                                </h1>
                            </Link>
                            <nav className="hidden md:flex space-x-1">
                                {navigation.map(item => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        data-testid={item.testId}
                                        className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'text-foreground bg-secondary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                            }`}
                                    >
                                        {React.cloneElement(item.icon as any, { className: "w-4 h-4 mr-2" })}
                                        {item.name}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Connection Status */}
                            <ConnectionStatus />

                            {/* Lab Alerts */}
                            <AlertBadge />

                            <button
                                onClick={onToggleChat}
                                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-background"></span>
                            </button>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground border border-border/50 bg-muted/20"
                                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                                >
                                    <span className="text-xs">Search</span>
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                        <span className="text-xs">⌘</span>K
                                    </kbd>
                                </Button>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                                        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                    </Button>

                                    {/* Profile Dropdown */}
                                    <div className="relative ml-2">
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border shadow-sm hover:ring-2 hover:ring-primary/20 transition-all"
                                        >
                                            <UserCircleIcon className="w-5 h-5" />
                                        </button>

                                        {isProfileOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setIsProfileOpen(false)}
                                                />
                                                <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 border border-border">
                                                    <div className="px-4 py-2 border-b border-border">
                                                        <p className="text-sm font-medium text-foreground truncate">{currentUser.email}</p>
                                                        <p className="text-xs text-muted-foreground">Doctor</p>
                                                    </div>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                                    >
                                                        Sign out
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Mobile Navigation */}
                <nav className="md:hidden bg-background border-t border-border fixed bottom-0 left-0 w-full z-50 pb-safe">
                    <div className="flex justify-around py-3">
                        {navigation.map(item => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-colors ${isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {React.cloneElement(item.icon as any, { className: "w-6 h-6" })}
                                <span className="mt-1">{item.name}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </header>

            {/* Setup Instructions Modal */}
            {showSetupInfo && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card p-6 rounded-xl shadow-lg max-w-lg w-full relative border border-border animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowSetupInfo(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <span className="text-2xl">☁️</span> Enable Cloud Persistence
                        </h3>
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                                <strong>Important:</strong> Connect your own Firebase project to persist data across reloads.
                            </div>
                            <ol className="list-decimal pl-5 space-y-3 marker:text-primary">
                                <li>
                                    Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-primary hover:underline font-medium">Firebase Console</a>.
                                </li>
                                <li>Create a project and add a Web App.</li>
                                <li>Copy the <code>firebaseConfig</code> object.</li>
                                <li>Update <code>services/firebase.ts</code> with your config keys.</li>
                            </ol>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <Button
                                onClick={() => setShowSetupInfo(false)}
                            >
                                Got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;