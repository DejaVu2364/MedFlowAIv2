import React, { useState } from 'react';
import { Patient } from '../types';
import { analyzeRevenueRisk, RevenueAuditResult } from '../services/revenueService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BanknotesIcon, ExclamationTriangleIcon, CheckBadgeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '../lib/utils'; // Assuming cn exists based on previous file reads

interface RevenueAuditWidgetProps {
    patient: Patient;
}

export const RevenueAuditWidget: React.FC<RevenueAuditWidgetProps> = ({ patient }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<RevenueAuditResult | null>(null);
    const [hasRun, setHasRun] = useState(false);

    const handleAudit = async () => {
        setIsLoading(true);
        // Minimum spinner time for UX
        const minTime = new Promise(resolve => setTimeout(resolve, 800));
        const analysis = analyzeRevenueRisk(patient);

        const [auditResult] = await Promise.all([analysis, minTime]);

        setResult(auditResult);
        setHasRun(true);
        setIsLoading(false);
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'High': return 'bg-red-50 text-red-700 border-red-200';
            case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'Low': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (!hasRun) {
        // Show loading state with skeleton UI during analysis
        if (isLoading) {
            return (
                <Card className="shadow-sm border-l-4 border-l-primary/50 overflow-hidden animate-pulse">
                    <CardHeader className="pb-2 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <ArrowPathIcon className="w-5 h-5 text-primary animate-spin" />
                            <CardTitle className="text-base">Analyzing Revenue...</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <div className="h-8 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="border-dashed border-2 shadow-none hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group" onClick={handleAudit}>
                <CardContent className="flex flex-col items-center justify-center py-6 gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <BanknotesIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                        <h4 className="font-semibold text-sm">Revenue Guard</h4>
                        <p className="text-xs text-muted-foreground max-w-[200px]">AI-powered leakage detection and claim risk analysis.</p>
                    </div>
                    <Button size="sm" variant="default" className="group-hover:bg-primary/90">
                        Run Analysis
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-l-4 border-l-primary/50 overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">Revenue Guard</CardTitle>
                    </div>
                    <Badge variant="outline" className={cn("text-xs font-medium", getRiskColor(result?.denial_risk || 'Low'))}>
                        {result?.denial_risk} Denial Risk
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">

                {/* Revenue Impact Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Projected Leakage</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-mono">
                                ₹{result?.leakage_amount.toLocaleString('en-IN') || '0'}
                            </span>
                            {result && result.leakage_amount > 0 && <span className="text-xs text-red-500 font-medium">(Estimated)</span>}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleAudit}>
                        <ArrowPathIcon className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin")} />
                    </Button>
                </div>

                <Separator />

                {/* Findings Section */}
                <div className="space-y-3">
                    {result?.missed_items && result.missed_items.length > 0 ? (
                        <div>
                            <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-yellow-500" />
                                Missed Opportunities
                            </p>
                            <ul className="space-y-1">
                                {result.missed_items.map((item, i) => (
                                    <li key={i} className="text-xs bg-muted/50 px-2 py-1 rounded flex items-center justify-between group">
                                        <span>{item}</span>
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-default">Add</Badge>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 text-xs py-2 bg-green-50/50 rounded-md px-2">
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span>No obvious missed billables found.</span>
                        </div>
                    )}

                    {result?.policy_gaps && result.policy_gaps.length > 0 && (
                        <div className="pt-1">
                            <p className="text-xs font-semibold mb-1 text-muted-foreground">Policy Gaps</p>
                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                                {result.policy_gaps.map(g => `• ${g}`).join('\n')}
                            </p>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <p className="text-[10px] text-center text-muted-foreground/60">
                        AI-generated advisory only. Not a financial guarantee.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
