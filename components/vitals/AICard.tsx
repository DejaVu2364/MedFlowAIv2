import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface AICardProps {
    insights: string[];
}

const AICard: React.FC<AICardProps> = ({ insights }) => {
    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800 p-4">
            <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">AI Insights</h3>
            </div>
            <ul className="space-y-2">
                {insights.length > 0 ? (
                    insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                            <span>{insight}</span>
                        </li>
                    ))
                ) : (
                    <li className="text-sm text-blue-800 dark:text-blue-200 italic">Analyzing vitals patterns...</li>
                )}
            </ul>
        </div>
    );
};

export default AICard;
