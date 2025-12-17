import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiIcon } from '@heroicons/react/24/solid';

export const OfflineBanner: React.FC = () => {
    const isOnline = useNetworkStatus();
    const [isVisible, setIsVisible] = useState(!isOnline);

    useEffect(() => {
        setIsVisible(!isOnline);
    }, [isOnline]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-500 text-white rounded-lg shadow-lg max-w-sm">
                <div className="bg-amber-600/30 p-1.5 rounded-full">
                    <WifiIcon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-semibold">You are currently offline</p>
                    <p className="text-xs text-amber-50/90 leading-tight mt-0.5">
                        Changes will sync when connection is restored.
                    </p>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="ml-2 text-amber-100 hover:text-white p-1 rounded-md hover:bg-amber-600/20 transition-colors"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};
