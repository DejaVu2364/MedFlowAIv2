import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findUserByEmail } from '../services/api';

const LoginPage: React.FC = () => {
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || (isLogin ? 'Invalid email or password.' : 'Failed to create account.'));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-background-primary rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-brand-blue-dark">Welcome to MedFlow AI</h1>
                    <p className="mt-2 text-text-secondary">{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                data-testid="login-email-input"
                                className="appearance-none block w-full px-3 py-2 border border-border-color rounded-md shadow-sm placeholder-text-tertiary focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                data-testid="login-password-input"
                                className="appearance-none block w-full px-3 py-2 border border-border-color rounded-md shadow-sm placeholder-text-tertiary focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex flex-col space-y-3">
                        <button
                            type="submit"
                            data-testid="login-submit-button"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                        >
                            {isLogin ? 'Sign in' : 'Create Account'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm text-brand-blue hover:text-brand-blue-dark focus:outline-none"
                        >
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-xs text-text-tertiary">
                    <p>Demo accounts:</p>
                    <p>doctor@medflow.ai / password123</p>
                    <p>intern@medflow.ai / password123</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;