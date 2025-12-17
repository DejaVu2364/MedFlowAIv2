import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, ShieldCheck, AlertTriangle, TrendingUp, RefreshCw, Lock } from 'lucide-react';
import { analyzeRevenueRisk, RevenueAuditResult } from '../services/revenueService';
import { aggregateRevenueData, RevenueRow, calculateRevenueInsights, RevenueInsight } from '../utils/revenueAggregation';
import { useToast } from '../contexts/ToastContext';

const AdminRevenueDashboard: React.FC = () => {
    const { patients } = usePatient();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<RevenueRow[]>([]);
    const [progress, setProgress] = useState(0);

    // 1. Access Control
    if (!currentUser || currentUser.role !== 'Admin') {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-red-50/50">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-red-900 mb-2">Access Restricted</h1>
                <p className="text-red-700 max-w-md">
                    This Revenue Intelligence Dashboard is restricted to Administrators only.
                    Please contact IT if you require access.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    // 2. Logic
    const runAudit = async () => {
        if (patients.length === 0) {
            addToast("No patients to audit.", "info");
            return;
        }

        setIsAnalyzing(true);
        setResults([]);
        setProgress(0);

        const tempResults: RevenueRow[] = [];
        let completed = 0;

        try {
            // Process in serial to avoid rate limits (or parallel blocks)
            for (const patient of patients) {
                // Skip discharged patients? Maybe optional. For now process all active.
                if (patient.status === 'Discharged') continue;

                const auditResult = await analyzeRevenueRisk(patient);
                const row = aggregateRevenueData(patient, auditResult);

                // Only keep rows with Findings? Or all? 
                // Let's keep all to show "Low Risk" too, establishes confidence.
                if (row.leakage_amount > 0 || row.denial_risk !== 'Low') {
                    tempResults.push(row);
                }

                completed++;
                setProgress(Math.round((completed / patients.length) * 100));
            }

            // Sort by Risk (High first) then Leakage (High first)
            tempResults.sort((a, b) => {
                const riskMap = { High: 3, Medium: 2, Low: 1 };
                if (riskMap[b.denial_risk] !== riskMap[a.denial_risk]) {
                    return riskMap[b.denial_risk] - riskMap[a.denial_risk];
                }
                return b.leakage_amount - a.leakage_amount;
            });

            setResults(tempResults);
            addToast(`Audit complete. Found ${tempResults.length} records with potential leakage.`, "success");

        } catch (error) {
            console.error(error);
            addToast("Audit failed due to an error.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearResults = () => {
        setResults([]);
        setProgress(0);
    };

    // 3. Stats & Insights
    const insights: RevenueInsight = calculateRevenueInsights(results);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">

            {/* SAFETY BANNER */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-center gap-2 text-blue-700 text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                Revenue Intelligence is AI-assisted and advisory only. Final billing decisions remain the responsibility of hospital administration.
            </div>

            <header className="flex justify-between items-center bg-white p-6 rounded-xl border border-border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                        Revenue Intelligence
                        <Badge variant="outline" className="ml-2 font-normal text-xs uppercase tracking-wider">Admin Only</Badge>
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        AI-powered audit for unbilled items and denial risks.
                    </p>
                </div>

                <div className="flex gap-3">
                    {results.length > 0 && (
                        <Button variant="ghost" onClick={clearResults} disabled={isAnalyzing}>
                            Clear Results
                        </Button>
                    )}
                    <Button
                        onClick={runAudit}
                        disabled={isAnalyzing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px]"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing {progress}%
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Run Revenue Audit
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {/* KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-0 shadow-sm bg-card ring-1 ring-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Est. Leakage</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground tabular-nums">₹{insights.totalLeakage.toLocaleString('en-IN')}</span>
                    </div>
                </Card>
                <Card className="p-4 border-0 shadow-sm bg-card ring-1 ring-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">High Risk Patients</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground tabular-nums">{insights.highRiskPatients}</span>
                        <span className="text-xs text-muted-foreground">of {results.length} audited</span>
                    </div>
                </Card>
                <Card className="p-4 border-0 shadow-sm bg-card ring-1 ring-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Leakage / Pt</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground tabular-nums">₹{Math.round(insights.avgLeakagePerPatient).toLocaleString('en-IN')}</span>
                    </div>
                </Card>
                <Card className="p-4 border-0 shadow-sm bg-card ring-1 ring-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Distribution</p>
                    <div className="mt-2 flex items-center gap-1 h-8">
                        {/* Simple Stacked Bar */}
                        <div className="h-4 bg-emerald-500/80 rounded-l" style={{ width: `${(insights.riskDistribution.Low / (results.length || 1)) * 100}%` }} title="Low Risk" />
                        <div className="h-4 bg-amber-400" style={{ width: `${(insights.riskDistribution.Medium / (results.length || 1)) * 100}%` }} title="Medium Risk" />
                        <div className="h-4 bg-rose-500 rounded-r" style={{ width: `${(insights.riskDistribution.High / (results.length || 1)) * 100}%` }} title="High Risk" />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tabular-nums">
                        <span>Low: {insights.riskDistribution.Low}</span>
                        <span>Med: {insights.riskDistribution.Medium}</span>
                        <span>High: {insights.riskDistribution.High}</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* TOP DRIVERS */}
                <Card className="lg:col-span-1 border-0 shadow-sm ring-1 ring-border/50 bg-card p-0 overflow-hidden">
                    <div className="p-4 border-b border-border/40 bg-muted/20">
                        <h3 className="font-semibold text-foreground">Top Leakage Drivers</h3>
                        <p className="text-xs text-muted-foreground">Most frequent missed billables</p>
                    </div>
                    {insights.topMissedItems.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm italic">No data available</div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {insights.topMissedItems.map((item, idx) => (
                                <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/10">
                                    <span className="text-sm font-medium text-foreground/80">{item.item}</span>
                                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground tabular-nums">
                                        {item.count} hits
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* MAIN TABLE */}
                <Card className="lg:col-span-2 overflow-hidden bg-card shadow-sm border-0 ring-1 ring-border/50">
                    <div className="p-4 border-b border-border/40 bg-muted/20 flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">Patient Audit List</h3>
                        <div className="text-xs text-muted-foreground italic flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Estimates only. Not final billing data.
                        </div>
                    </div>

                    {results.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            {isAnalyzing ? (
                                <p>Analysis in progress... please wait.</p>
                            ) : (
                                <p>Click "Run Revenue Audit" to scan active patients.</p>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/10 text-muted-foreground font-medium border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Patient</th>
                                        <th className="px-6 py-3 font-semibold">Est. Leakage</th>
                                        <th className="px-6 py-3 font-semibold">Denial Risk</th>
                                        <th className="px-6 py-3 font-semibold">Missed Items / Gaps</th>
                                        <th className="px-6 py-3 text-right font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {results.map((row) => (
                                        <tr key={row.patientId} className="hover:bg-muted/5 group transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {row.patientName}
                                                <div className="text-xs text-muted-foreground font-normal opacity-70">{row.patientId}</div>
                                            </td>
                                            <td className="px-6 py-4 text-foreground/80 tabular-nums">
                                                ₹{row.leakage_amount.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <RiskBadge risk={row.denial_risk} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {row.missed_items.slice(0, 3).map((item, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs bg-background text-muted-foreground border-border/60">
                                                            {item}
                                                        </Badge>
                                                    ))}
                                                    {row.missed_items.length > 3 && (
                                                        <span className="text-xs text-muted-foreground self-center">+{row.missed_items.length - 3} more</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/patient/${row.patientId}`)}
                                                    className="text-primary hover:text-primary hover:bg-primary/10"
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>


            {/* <SyntheticDemoControls /> - Removed in favor of Sidebar Reset */}
        </div >
    );
};

const RiskBadge: React.FC<{ risk: "Low" | "Medium" | "High" }> = ({ risk }) => {
    const colors = {
        High: "bg-red-100 text-red-700 border-red-200",
        Medium: "bg-amber-100 text-amber-700 border-amber-200",
        Low: "bg-green-100 text-green-700 border-green-200"
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[risk]}`}>
            {risk}
        </span>
    );
};

export default AdminRevenueDashboard;
