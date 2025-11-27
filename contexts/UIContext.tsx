import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UIContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    sidebarOpen: boolean;
    toggleSidebar: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        // Check system preference or local storage
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    return (
        <UIContext.Provider value={{ theme, toggleTheme, sidebarOpen, toggleSidebar }}>
            {children}
        </UIContext.Provider>
    );
};
