import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { HomeIcon, UserPlusIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, SunIcon, MoonIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getIsFirebaseInitialized } from '../services/firebase';

interface HeaderProps {
    onToggleChat?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleChat }) => {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useUI();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isCloudConnected = getIsFirebaseInitialized();
    const [showSetupInfo, setShowSetupInfo] = useState(false);

    const navigation = [
        { name: 'Dashboard', path: '/', icon: <HomeIcon />, testId: 'nav-dashboard' },
        { name: 'Reception', path: '/reception', icon: <UserPlusIcon />, testId: 'nav-reception' },
        { name: 'Triage', path: '/triage', icon: <ClipboardDocumentListIcon />, testId: 'nav-triage' },
    ];

    if (!currentUser) {
        return null;
    }

    return (
        <>
            <header className="sticky top-0 z-40 w-full glass border-b border-border-color transition-all duration-300 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center text-white shadow-lg shadow-brand-blue/30 group-hover:scale-105 transition-transform duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-dark to-brand-blue tracking-tight">
                                    MedFlow<span className="font-light text-text-tertiary">AI</span>
                                </h1>
                            </Link>
                            <nav className="hidden md:flex space-x-1 bg-background-tertiary/50 p-1 rounded-full border border-border-color">
                                {navigation.map(item => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        data-testid={item.testId}
                                        className={({ isActive }) => `flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-white dark:bg-gray-700 text-brand-blue-dark shadow-sm ring-1 ring-black/5'
                                            : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        {React.cloneElement(item.icon as any, { className: "w-4 h-4 mr-2" })}
                                        <span>{item.name}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center space-x-3">
                            {!isCloudConnected && (
                                <button
                                    onClick={() => setShowSetupInfo(true)}
                                    className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                                    Demo Mode
                                </button>
                            )}
                            <div className="h-6 w-px bg-border-color mx-2 hidden sm:block"></div>
                            <button
                                onClick={onToggleChat}
                                className="p-2 rounded-full text-text-secondary hover:bg-brand-blue/10 hover:text-brand-blue transition-colors relative"
                                aria-label="Toggle AI Chat"
                            >
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-green rounded-full border-2 border-white dark:border-gray-900"></span>
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-text-secondary hover:bg-background-tertiary transition-colors"
                            >
                                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                            </button>
                            <div className="hidden sm:flex items-center pl-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center text-text-secondary border border-border-color shadow-sm">
                                    <UserCircleIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Mobile Navigation */}
                <nav className="md:hidden glass border-t border-border-color fixed bottom-0 left-0 w-full z-50 pb-safe">
                    <div className="flex justify-around py-3">
                        {navigation.map(item => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-colors ${isActive
                                    ? 'text-brand-blue'
                                    : 'text-text-tertiary hover:text-text-primary'
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background-primary p-6 rounded-2xl shadow-2xl max-w-lg w-full relative border border-border-color animate-fade-in-up">
                        <button
                            onClick={() => setShowSetupInfo(false)}
                            className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                            <span className="text-2xl">☁️</span> Enable Cloud Persistence
                        </h3>
                        <div className="space-y-4 text-sm text-text-secondary">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-800/50">
                                <strong>Important:</strong> Connect your own Firebase project to persist data across reloads.
                            </div>
                            <ol className="list-decimal pl-5 space-y-3 marker:text-brand-blue">
                                <li>
                                    Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-brand-blue hover:underline font-medium">Firebase Console</a>.
                                </li>
                                <li>Create a project and add a Web App.</li>
                                <li>Copy the <code>firebaseConfig</code> object.</li>
                                <li>Update <code>services/firebase.ts</code> with your config keys.</li>
                            </ol>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setShowSetupInfo(false)}
                                className="px-5 py-2.5 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark transition-colors shadow-lg shadow-brand-blue/20"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;