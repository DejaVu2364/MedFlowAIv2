import React from 'react';
import { Card, CardContent } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface OccupancyRingProps {
    occupied: number;
    total: number;
    percentage: number;
}

export const OccupancyRing: React.FC<OccupancyRingProps> = ({ occupied, total, percentage }) => {
    const data = [
        { name: 'Occupied', value: occupied },
        { name: 'Available', value: total - occupied },
    ];

    const COLORS = ['#0d9488', '#f1f5f9']; // teal-600, slate-100

    return (
        <Card className="h-full border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full relative">
                <div className="w-full h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={45}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold tracking-tighter text-teal-900 dark:text-teal-100">
                            {percentage}%
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            Occupancy
                        </span>
                    </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-teal-600" />
                        <span>{occupied} In Use</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                        <span>{total - occupied} Free</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
