import React, { useState, useEffect } from 'react';
import { SignalIcon } from '@heroicons/react/24/solid';

const PulseOxLiveBox: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [spo2, setSpo2] = useState(98);
    const [hr, setHr] = useState(72);
    const [waveform, setWaveform] = useState<number[]>(new Array(20).fill(50));

    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            // Simulate live data fluctuation
            setSpo2(prev => Math.random() > 0.8 ? (Math.random() > 0.5 ? 99 : 97) : 98);
            setHr(prev => {
                const change = Math.floor(Math.random() * 3) - 1;
                return Math.min(Math.max(prev + change, 60), 100);
            });

            // Simulate waveform
            setWaveform(prev => {
                const next = [...prev.slice(1), Math.random() * 40 + 30];
                return next;
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [isConnected]);

    return (
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-4 text-white relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Device: Pulse Oximeter</span>
                </div>
                {!isConnected ? (
                    <button
                        onClick={() => setIsConnected(true)}
                        className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-full transition-colors"
                    >
                        Connect
                    </button>
                ) : (
                    <button
                        onClick={() => setIsConnected(false)}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                        Disconnect
                    </button>
                )}
            </div>

            {isConnected ? (
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-blue-400 font-bold uppercase">SpO₂ %</span>
                        <span className="text-4xl font-mono font-bold text-blue-400">{spo2}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-green-400 font-bold uppercase">PR bpm</span>
                        <span className="text-4xl font-mono font-bold text-green-400 flex items-center gap-2">
                            {hr}
                            <SignalIcon className="w-4 h-4 animate-pulse" />
                        </span>
                    </div>

                    {/* Simplified Waveform Visual */}
                    <div className="col-span-2 h-12 flex items-end gap-1 mt-2 opacity-50">
                        {waveform.map((h, i) => (
                            <div key={i} className="flex-1 bg-green-500 rounded-t-sm transition-all duration-300" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center text-gray-600 text-sm">
                    Device not connected
                </div>
            )}
        </div>
    );
};

export default PulseOxLiveBox;
