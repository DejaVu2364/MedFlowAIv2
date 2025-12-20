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
    'doctor@medflow.ai': { id: 'USR-001', name: 'Dr. Harikrishnan S', email: 'doctor@medflow.ai', role: 'Doctor' },
    'intern@medflow.ai': { id: 'USR-002', name: 'Dr. James Wu (Intern)', email: 'intern@medflow.ai', role: 'Intern' },
    'admin@medflow.ai': { id: 'USR-003', name: 'Admin User', email: 'admin@medflow.ai', role: 'Admin' }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    console.log("DEBUG: AuthProvider render, user:", currentUser?.email);

    // Helper to map Firebase user to App user
    const mapFirebaseUser = (user: any): User => {
        const email = user.email?.toLowerCase() || '';
        const mockUser = MOCK_USERS[email];
        const role = email.includes('admin') ? 'Admin' : email.includes('intern') ? 'Intern' : 'Doctor';
        return {
            id: user.uid,
            name: mockUser?.name || user.displayName || 'Dr. Harikrishnan S',
            email: user.email || '',
            role: role as Role
        };
    };

    useEffect(() => {
        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (isLoading) {
                console.warn("DEBUG: Auth initialization timed out");
                setIsLoading(false);
                setError("Connection timed out. Running in offline/demo mode.");
            }
        }, 5000);

        const auth = getAuthInstance();
        if (getIsFirebaseInitialized() && auth) {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                clearTimeout(safetyTimeout);
                if (user) {
                    setCurrentUser(mapFirebaseUser(user));
                } else {
                    setCurrentUser(null);
                }
                setIsLoading(false);
            });
            return () => {
                unsubscribe();
                clearTimeout(safetyTimeout);
            };
        } else {
            // Fallback to local storage for demo mode
            const storedUser = localStorage.getItem('medflow_user');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
            clearTimeout(safetyTimeout);
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        console.log("DEBUG: login called with", email);
        setIsLoading(true);
        setError(null);

        if (getIsFirebaseInitialized()) {
            const auth = getAuthInstance();
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Explicitly update state to avoid race conditions with onAuthStateChanged
                setCurrentUser(mapFirebaseUser(userCredential.user));
                setIsLoading(false);
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
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Explicitly update state to avoid race conditions
                setCurrentUser(mapFirebaseUser(userCredential.user));
                setIsLoading(false);
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
                // Explicitly clear state
                setCurrentUser(null);
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
