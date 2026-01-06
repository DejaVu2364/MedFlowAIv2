import React, { useMemo } from 'react';
import { Patient } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
    Sparkles,
    AlertTriangle,
    Clock,
    TrendingUp,
    BedDouble,
    IndianRupee,
    LogOut,
    Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface OpsAIInsightsProps {
    patients: Patient[];
    bedOccupancyRate: number;
    totalLeakage: number;
    dischargeReady: number;
}

interface AIInsight {
    id: string;
    type: 'warning' | 'alert' | 'suggestion' | 'positive';
    icon: React.ElementType;
    title: string;
    description: string;
    metric?: string;
}

/**
 * AI-powered insights component that analyzes operational data
 * and surfaces proactive recommendations.
 */
export const OpsAIInsights: React.FC<OpsAIInsightsProps> = ({
    patients,
    bedOccupancyRate,
    totalLeakage,
    dischargeReady
}) => {
    // Generate insights based on current data
    const insights = useMemo((): AIInsight[] => {
        const results: AIInsight[] = [];
        const activePatients = patients.filter(p => p.status !== 'Discharged');

        // 1. High Occupancy Alert
        if (bedOccupancyRate >= 90) {
            results.push({
                id: 'high-occupancy',
                type: 'alert',
                icon: BedDouble,
                title: 'Critical Bed Capacity',
                description: 'Occupancy at critical levels. Prioritize discharge-ready patients.',
                metric: `${bedOccupancyRate}%`
            });
        }

        // 2. Patients exceeding average LOS
        const avgLOS = 3.5; // Typical hospital stay
        const longStayPatients = activePatients.filter(p => {
            if (!p.admissionDate) return false;
            const los = Math.ceil((Date.now() - new Date(p.admissionDate).getTime()) / (1000 * 60 * 60 * 24));
            return los > avgLOS * 2; // More than 7 days
        });

        if (longStayPatients.length > 0) {
            results.push({
                id: 'long-stay',
                type: 'warning',
                icon: Clock,
                title: 'Extended Stay Patients',
                description: `${longStayPatients.length} patient(s) exceeding typical LOS. Review for discharge eligibility.`,
                metric: `${longStayPatients.length} patients`
            });
        }

        // 3. Revenue Leakage Alert
        if (totalLeakage > 50000) {
            results.push({
                id: 'revenue-risk',
                type: 'alert',
                icon: IndianRupee,
                title: 'Revenue at Risk',
                description: 'Significant unbilled items detected. Action needed to prevent losses.',
                metric: `₹${(totalLeakage / 1000).toFixed(0)}K`
            });
        }

        // 4. Discharge Backlog
        if (dischargeReady > 10) {
            results.push({
                id: 'discharge-backlog',
                type: 'suggestion',
                icon: LogOut,
                title: 'Discharge Opportunities',
                description: 'Multiple patients ready for discharge. Clear these to free capacity.',
                metric: `${dischargeReady} ready`
            });
        }

        // 5. Positive: All smooth if no issues
        if (results.length === 0) {
            results.push({
                id: 'all-clear',
                type: 'positive',
                icon: Activity,
                title: 'Operations Running Smoothly',
                description: 'No critical issues detected. All metrics within normal range.'
            });
        }

        // 6. TPA pending reminder
        const insurancePatients = activePatients.filter(p => p.paymentMode === 'Insurance');
        const pendingDocs = insurancePatients.filter(p => p.clinicalFile?.status !== 'signed');
        if (pendingDocs.length > 3) {
            results.push({
                id: 'tpa-docs',
                type: 'warning',
                icon: TrendingUp,
                title: 'TPA Documentation Gap',
                description: `${pendingDocs.length} insurance patients need clinical file completion for claims.`,
                metric: `${pendingDocs.length} pending`
            });
        }

        return results.slice(0, 4); // Limit to 4 insights
    }, [patients, bedOccupancyRate, totalLeakage, dischargeReady]);

    const getInsightStyles = (type: AIInsight['type']) => {
        switch (type) {
            case 'alert':
                return 'bg-rose-50 border-rose-200 text-rose-700';
            case 'warning':
                return 'bg-amber-50 border-amber-200 text-amber-700';
            case 'suggestion':
                return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'positive':
                return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            default:
                return 'bg-slate-50 border-slate-200 text-slate-700';
        }
    };

    return (
        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI Operations Insights
                    <Badge variant="outline" className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 border-indigo-200">
                        Live Analysis
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {insights.map(insight => {
                    const Icon = insight.icon;
                    return (
                        <div
                            key={insight.id}
                            className={cn(
                                "p-3 rounded-lg border flex items-start gap-3 transition-all hover:scale-[1.01]",
                                getInsightStyles(insight.type)
                            )}
                        >
                            <div className="p-1.5 rounded-md bg-white/60">
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">{insight.title}</p>
                                    {insight.metric && (
                                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                                            {insight.metric}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs opacity-80 mt-0.5">{insight.description}</p>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default OpsAIInsights;
