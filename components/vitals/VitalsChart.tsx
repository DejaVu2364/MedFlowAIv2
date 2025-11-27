import React, { useState } from 'react';
import * as Recharts from 'recharts';

const {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    Legend
} = Recharts;
import { VitalsRecord } from '../../types';

interface VitalsChartProps {
    data: VitalsRecord[];
}

type TimeRange = '6h' | '24h' | '3d' | '7d';

const VitalsChart: React.FC<VitalsChartProps> = ({ data }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');

    // Filter data based on time range
    const filteredData = data.filter(record => {
        const recordTime = new Date(record.recordedAt).getTime();
        const now = Date.now();
        const hours = (now - recordTime) / (1000 * 60 * 60);

        switch (timeRange) {
            case '6h': return hours <= 6;
            case '24h': return hours <= 24;
            case '3d': return hours <= 72;
            case '7d': return hours <= 168;
            default: return true;
        }
    }).sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const chartData = filteredData.map(d => ({
        time: new Date(d.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: d.recordedAt,
        hr: d.measurements.pulse,
        spo2: d.measurements.spo2,
        rr: d.measurements.rr,
        temp: d.measurements.temp_c,
        bp_sys: d.measurements.bp_sys,
        bp_dia: d.measurements.bp_dia,
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg text-xs">
                    <p className="font-bold mb-2 text-gray-700 dark:text-gray-300">{label}</p>
                    {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.color }}>
                            {p.name}: {p.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vitals Trends</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {(['6h', '24h', '3d', '7d'] as TimeRange[]).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === range
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {/* Heart Rate & BP Chart */}
                <div className="h-64">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Heart Rate & Blood Pressure</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="hr" name="Heart Rate" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="bp_sys" name="Sys BP" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="bp_dia" name="Dia BP" stroke="#93C5FD" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* SpO2 & RR Chart */}
                <div className="h-64">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">SpO₂ & Respiratory Rate</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} domain={[80, 100]} />
                            <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <ReferenceArea yAxisId="left" y1={90} y2={100} fill="#10B981" fillOpacity={0.1} />
                            <Line yAxisId="left" type="monotone" dataKey="spo2" name="SpO₂" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                            <Line yAxisId="right" type="monotone" dataKey="rr" name="Resp. Rate" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                {/* Temperature Chart */}
                <div className="h-48">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Temperature (°C)</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="temp" name="Temp" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default VitalsChart;
