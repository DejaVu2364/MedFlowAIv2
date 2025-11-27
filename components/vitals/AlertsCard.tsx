import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AlertsCardProps {
    alerts: string[];
}

const AlertsCard: React.FC<AlertsCardProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    return (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-100 dark:border-red-800 p-4 animate-pulse-slow">
            <div className="flex items-center gap-2 mb-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Active Alerts</h3>
            </div>
            <ul className="space-y-2">
                {alerts.map((alert, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200 font-medium">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                        <span>{alert}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AlertsCard;
