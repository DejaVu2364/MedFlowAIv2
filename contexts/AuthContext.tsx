import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { getAuthInstance, getIsFirebaseInitialized } from '../services/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
    currentUser: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Mock Credentials (moved from LoginPage)
const MOCK_USER_CREDENTIALS = {
    'doctor@medflow.ai': 'password123',
    'intern@medflow.ai': 'password123',
    'admin@medflow.ai': 'admin123'
};

const MOCK_USERS: Record<string, User> = {
    'doctor@medflow.ai': { id: 'USR-001', name: 'Dr. Sarah Chen', email: 'doctor@medflow.ai', role: 'Doctor' },
    'intern@medflow.ai': { id: 'USR-002', name: 'Dr. James Wu (Intern)', email: 'intern@medflow.ai', role: 'Intern' },
    'admin@medflow.ai': { id: 'USR-003', name: 'Admin User', email: 'admin@medflow.ai', role: 'Admin' }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuthInstance();
        if (getIsFirebaseInitialized() && auth) {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    // Map Firebase User to App User
                    // In a real app, you'd fetch the user role/profile from Firestore here
                    // For now, we'll default to Doctor role if not found, or map based on email
                    const role = user.email?.includes('admin') ? 'Admin' : user.email?.includes('intern') ? 'Intern' : 'Doctor';
                    setCurrentUser({
                        id: user.uid,
                        name: user.displayName || user.email?.split('@')[0] || 'User',
                        email: user.email || '',
                        role: role as Role
                    });
                } else {
                    setCurrentUser(null);
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            // Fallback to local storage for demo mode
            const storedUser = localStorage.getItem('medflow_user');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        if (getIsFirebaseInitialized()) {
            const auth = getAuthInstance();
            try {
                await signInWithEmailAndPassword(auth, email, password);
                // State update handled by onAuthStateChanged
            } catch (err: any) {
                console.error("Login failed", err);
                setError(err.message || 'Failed to login');
                setIsLoading(false);
            }
        } else {
            // Mock Login
            await new Promise(resolve => setTimeout(resolve, 500));
            const user = MOCK_USERS[email.toLowerCase()];
            if (user && MOCK_USER_CREDENTIALS[email.toLowerCase() as keyof typeof MOCK_USER_CREDENTIALS] === password) {
                setCurrentUser(user);
                localStorage.setItem('medflow_user', JSON.stringify(user));
            } else {
                setError('Invalid email or password.');
            }
            setIsLoading(false);
        }
    };

    const signup = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        if (getIsFirebaseInitialized()) {
            const auth = getAuthInstance();
            try {
                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (err: any) {
                console.error("Signup failed", err);
                setError(err.message || 'Failed to create account');
                setIsLoading(false);
            }
        } else {
            setError("Cannot create account in Demo Mode");
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (getIsFirebaseInitialized()) {
            const auth = getAuthInstance();
            try {
                await signOut(auth);
            } catch (e) { console.error(e); }
        } else {
            setCurrentUser(null);
            localStorage.removeItem('medflow_user');
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, signup, logout, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
