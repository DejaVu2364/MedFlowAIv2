// BackToDashboard - Simple home navigation component

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';

export const BackToDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show on dashboard
    if (location.pathname === '/' || location.pathname === '/dashboard') {
        return null;
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1 text-slate-600 dark:text-slate-400 hover:text-teal-600"
        >
            <ChevronLeftIcon className="w-4 h-4" />
            <HomeIcon className="w-4 h-4" />
            Dashboard
        </Button>
    );
};

export default BackToDashboard;
