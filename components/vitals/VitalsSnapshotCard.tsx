import React from 'react';
import { VitalsMeasurements } from '../../types';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/20/solid';

interface VitalsSnapshotCardProps {
    vitals: VitalsMeasurements;
}

const VitalItem: React.FC<{ label: string; value: number | null | undefined; unit: string; trend?: 'up' | 'down' | 'stable'; status?: 'normal' | 'warning' | 'critical' }> = ({ label, value, unit, trend, status = 'normal' }) => {
    if (value === null || value === undefined) return null;

    const statusColors = {
        normal: 'text-gray-900 dark:text-white',
        warning: 'text-yellow-600 dark:text-yellow-400',
        critical: 'text-red-600 dark:text-red-400'
    };

    const TrendIcon = trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : MinusIcon;
    const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400'; // Context dependent, simplified here

    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${statusColors[status]}`}>
                    {value} <span className="text-xs font-normal text-gray-400">{unit}</span>
                </span>
                {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
            </div>
        </div>
    );
};

const VitalsSnapshotCard: React.FC<VitalsSnapshotCardProps> = ({ vitals }) => {
    // Mock trend logic for now
    const getTrend = () => Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Latest Snapshot</h3>
            <div className="space-y-1">
                <VitalItem label="Heart Rate" value={vitals.pulse} unit="bpm" trend={getTrend()} status={vitals.pulse && (vitals.pulse > 100 || vitals.pulse < 60) ? 'warning' : 'normal'} />
                <VitalItem label="Blood Pressure" value={vitals.bp_sys} unit={`/ ${vitals.bp_dia || '-'} mmHg`} trend={getTrend()} status={vitals.bp_sys && vitals.bp_sys > 140 ? 'warning' : 'normal'} />
                <VitalItem label="Resp. Rate" value={vitals.rr} unit="/min" trend={getTrend()} />
                <VitalItem label="SpO₂" value={vitals.spo2} unit="%" trend={getTrend()} status={vitals.spo2 && vitals.spo2 < 95 ? 'warning' : 'normal'} />
                <VitalItem label="Temperature" value={vitals.temp_c} unit="°C" trend={getTrend()} status={vitals.temp_c && vitals.temp_c > 37.5 ? 'warning' : 'normal'} />
                <VitalItem label="Pain Score" value={vitals.pain_score} unit="/10" />
            </div>
        </div>
    );
};

export default VitalsSnapshotCard;
