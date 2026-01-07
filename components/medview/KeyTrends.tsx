import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { Patient } from '../../types';

interface TrendMetric {
    label: string;
    value: string;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: string;
    status: 'stable' | 'improving' | 'concerning';
    color: 'red' | 'blue' | 'green' | 'teal' | 'orange';
}

const TrendMetricCard: React.FC<{ metric: TrendMetric }> = ({ metric }) => {
    // Soft color accents for icons (approx 40% opacity feel)
    const iconColors = {
        red: "text-[#ff6b6b]",
        blue: "text-[#6366f1]",
        green: "text-[#34d399]",
        teal: "text-[#22d3ee]",
        orange: "text-[#fbbf24]",
    };

    const bgColors = {
        red: "bg-[#ff6b6b]/10",
        blue: "bg-[#6366f1]/10",
        green: "bg-[#34d399]/10",
        teal: "bg-[#22d3ee]/10",
        orange: "bg-[#fbbf24]/10",
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md h-full">
            {/* Icon */}
            <div className={cn("mb-3 p-2 rounded-full", bgColors[metric.color])}>
                {metric.label === 'Heart Rate' && <svg className={cn("w-5 h-5", iconColors[metric.color])} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                {metric.label === 'Blood Pressure' && <svg className={cn("w-5 h-5", iconColors[metric.color])} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                {metric.label === 'SpO2' && <svg className={cn("w-5 h-5", iconColors[metric.color])} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
                {metric.label === 'Resp Rate' && <svg className={cn("w-5 h-5", iconColors[metric.color])} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                {metric.label === 'Temperature' && <svg className={cn("w-5 h-5", iconColors[metric.color])} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            </div>

            {/* Value */}
            <div className="text-3xl font-semibold text-foreground tracking-tight mb-1">
                {metric.value}
            </div>

            {/* Unit */}
            <div className="text-sm text-muted-foreground font-medium mb-4">
                {metric.unit}
            </div>

            {/* Label */}
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold mb-3">
                {metric.label}
            </div>

            {/* Change Pill */}
            <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1",
                metric.trend === 'up' ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                    metric.trend === 'down' ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}>
                {metric.trend === 'up' ? <ArrowTrendingUpIcon className="w-3 h-3" /> :
                    metric.trend === 'down' ? <ArrowTrendingDownIcon className="w-3 h-3" /> :
                        <MinusIcon className="w-3 h-3" />}
                {metric.change}
            </div>
        </div>
    );
};

export const KeyTrends: React.FC<{ patient: Patient }> = ({ patient }) => {
    const metrics: TrendMetric[] = [
        {
            label: "Heart Rate",
            value: patient.vitals?.pulse?.toString() || "--",
            unit: "bpm",
            trend: "stable",
            change: "vs last",
            status: "stable",
            color: (patient.vitals?.pulse || 0) > 100 ? "red" : "green"
        },
        {
            label: "Blood Pressure",
            value: patient.vitals?.bp_sys ? `${patient.vitals.bp_sys}/${patient.vitals.bp_dia}` : "--/--",
            unit: "mmHg",
            trend: "stable",
            change: "vs last",
            status: "stable",
            color: (patient.vitals?.bp_sys || 120) < 90 ? "red" : "blue"
        },
        {
            label: "SpO2",
            value: patient.vitals?.spo2?.toString() || "--",
            unit: "%",
            trend: "stable",
            change: "vs last",
            status: (patient.vitals?.spo2 || 100) < 95 ? "concerning" : "stable",
            color: (patient.vitals?.spo2 || 100) < 95 ? "red" : "green"
        },
        {
            label: "Resp Rate",
            value: patient.vitals?.rr?.toString() || "--",
            unit: "breaths/min",
            trend: "stable",
            change: "vs last",
            status: "stable",
            color: "teal"
        },
        {
            label: "Temperature",
            value: patient.vitals?.temp_c?.toFixed(1) || "--",
            unit: "°C",
            trend: "stable",
            change: "vs last",
            status: (patient.vitals?.temp_c || 37) > 38 ? "concerning" : "stable",
            color: (patient.vitals?.temp_c || 37) > 38 ? "orange" : "teal"
        },
    ];

    return (
        <Card className="shadow-none border-none bg-transparent">
            <CardHeader className="flex flex-row items-center gap-2 pb-6 px-0">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-foreground">Key Trends</CardTitle>
                    <p className="text-xs text-muted-foreground">Last 24 Hours • <span className="text-green-600 font-medium">Overall Stable</span></p>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {metrics.map((m, i) => (
                        <TrendMetricCard key={i} metric={m} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
