import React, { useMemo, useState, useEffect } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useNavigate } from 'react-router-dom';
import { allocatePatientsToBeds, calculateTotalRoomRevenue, Bed } from '../utils/bedLogic';
import { runRevenueAudit, RevenueRisk } from '../utils/revenueGuardLogic';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { Patient } from '../types';
import {
    BedDouble,
    IndianRupee,
    FileCheck,
    LogOut,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    Users,
    Activity,
    Sparkles,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { OpsAIInsights } from '../components/ops/OpsAIInsights';

// Types
interface BedStats {
    total: number;
    occupied: number;
    available: number;
    cleaning: number;
    occupancyRate: number;
    revenueToday: number;
    expectedDischarges: number;
}

interface TPAStats {
    pending: number;
    approved: number;
    rejected: number;
    urgent: number; // > 24 hours
    totalPendingAmount: number;
}

interface LeakageStats {
    totalLeakage: number;
    highRiskCount: number;
    topIssue: string;
}

interface DischargeStats {
    ready: number;
    pending: number;
    blocked: number;
}

const OpsCommandCenter: React.FC = () => {
    const { patients, isLoading } = usePatient();
    const navigate = useNavigate();

    // Real-time refresh state
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIsRefreshing(true);
            setLastUpdated(new Date());
            // Simulate quick refresh animation
            setTimeout(() => setIsRefreshing(false), 500);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Manual refresh handler
    const handleRefresh = () => {
        setIsRefreshing(true);
        setLastUpdated(new Date());
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Calculate Bed Stats
    const bedStats = useMemo((): BedStats => {
        const beds = allocatePatientsToBeds(patients);
        const occupied = beds.filter(b => b.status === 'occupied').length;
        const cleaning = beds.filter(b => b.status === 'cleaning').length;
        const available = beds.filter(b => b.status === 'available').length;

        // Count patients with status indicating near-discharge
        // PatientStatus is: 'Waiting for Triage' | 'Waiting for Doctor' | 'In Treatment' | 'Discharged'
        // Use In Treatment as proxy for potential discharges
        const expectedDischarges = patients.filter(p =>
            p.status === 'In Treatment' &&
            (p.orders?.every(o => o.status === 'completed' || o.status === 'cancelled'))
        ).length;

        return {
            total: beds.length,
            occupied,
            available,
            cleaning,
            occupancyRate: Math.round((occupied / beds.length) * 100),
            revenueToday: calculateTotalRoomRevenue(beds),
            expectedDischarges
        };
    }, [patients]);

    // Calculate TPA Stats from REAL patient insurance data
    const tpaStats = useMemo((): TPAStats => {
        const activePatients = patients.filter(p => p.status !== 'Discharged');

        // Get patients with actual insurance info
        const insuredPatients = activePatients.filter(p =>
            p.paymentMode === 'Insurance' && p.insuranceInfo
        );

        // Fallback: if no real insurance data, estimate from payment mode
        const insuranceCount = insuredPatients.length > 0
            ? insuredPatients.length
            : activePatients.filter(p => p.paymentMode === 'Insurance').length;

        // Calculate pending based on incomplete documentation  
        const pendingPatients = insuredPatients.filter(p => {
            const hasClinicalFile = p.clinicalFile?.sections?.history;
            const hasCompleteFile = p.clinicalFile?.status === 'signed';
            return !hasCompleteFile;
        });

        // Urgent: patients with insurance pending > 24 hours (check registration time)
        const now = Date.now();
        const urgentPatients = pendingPatients.filter(p => {
            const regTime = new Date(p.registrationTime).getTime();
            const hoursSinceReg = (now - regTime) / (1000 * 60 * 60);
            return hoursSinceReg > 24;
        });

        // Calculate total pending amount from insurance caps
        const totalPendingAmount = insuredPatients.reduce((sum, p) => {
            return sum + (p.insuranceInfo?.overallCap || 50000);
        }, 0);

        return {
            pending: pendingPatients.length,
            approved: Math.max(0, insuranceCount - pendingPatients.length),
            rejected: 0, // No rejection tracking yet
            urgent: urgentPatients.length,
            totalPendingAmount
        };
    }, [patients]);

    // Calculate Leakage Stats
    const leakageStats = useMemo((): LeakageStats => {
        const risks = runRevenueAudit(patients);
        const highRisk = risks.filter(r => r.severity === 'High');

        return {
            totalLeakage: risks.reduce((sum, r) => sum + r.potentialLoss, 0),
            highRiskCount: highRisk.length,
            topIssue: risks[0]?.category || 'None detected'
        };
    }, [patients]);

    // Calculate Discharge Stats
    const dischargeStats = useMemo((): DischargeStats => {
        const activePatients = patients.filter(p => p.status !== 'Discharged');

        // Ready: Has clinical file completed AND all orders completed
        const ready = activePatients.filter(p =>
            p.clinicalFile?.sections?.history &&
            p.clinicalFile?.sections?.gpe &&
            !p.orders?.some(o => o.status === 'draft' || o.status === 'sent')
        ).length;

        // Blocked: Has pending orders > 2
        const blocked = activePatients.filter(p =>
            (p.orders?.filter(o => o.status === 'draft').length || 0) > 2
        ).length;

        return {
            ready,
            pending: Math.max(0, activePatients.length - ready - blocked),
            blocked
        };
    }, [patients]);

    // Get full beds array for drill-down
    const beds = useMemo(() => allocatePatientsToBeds(patients), [patients]);

    // Get revenue risks for drill-down
    const revenueRisks = useMemo(() => runRevenueAudit(patients), [patients]);

    // Sheet state for drill-down panels
    type SheetType = 'beds' | 'tpa' | 'leakage' | 'discharge' | null;
    const [activeSheet, setActiveSheet] = useState<SheetType>(null);

    // Derived lists for drill-downs
    const criticalBeds = beds.filter(b => b.status === 'occupied' && b.patient);
    const dischargeReadyPatients = patients.filter(p =>
        p.status !== 'Discharged' &&
        p.clinicalFile?.sections?.history &&
        p.clinicalFile?.sections?.gpe &&
        !p.orders?.some(o => o.status === 'draft' || o.status === 'sent')
    );
    const blockedPatients = patients.filter(p =>
        p.status !== 'Discharged' &&
        (p.orders?.filter(o => o.status === 'draft').length || 0) > 2
    );
    const insuredPatients = patients.filter(p =>
        p.status !== 'Discharged' &&
        (p.paymentMode === 'Insurance' || p.insuranceInfo)
    );

    // Handle patient navigation
    const handlePatientClick = (patientId: string) => {
        setActiveSheet(null);
        navigate(`/patient/${patientId}/medview`);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        🏥 Ops Command Center
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Real-time hospital operations at a glance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        className={cn(
                            "gap-1 text-slate-500 hover:text-slate-700",
                            isRefreshing && "opacity-50"
                        )}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        <span className="text-xs">
                            {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </Button>
                    <Badge variant="outline" className={cn(
                        "bg-indigo-50 text-indigo-700 border-indigo-200",
                        isRefreshing && "animate-pulse"
                    )}>
                        <Clock className="w-3 h-3 mr-1" />
                        Live
                    </Badge>
                </div>
            </header>

            {/* AI Insights Panel */}
            <OpsAIInsights
                patients={patients}
                bedOccupancyRate={bedStats.occupancyRate}
                totalLeakage={leakageStats.totalLeakage}
                dischargeReady={dischargeStats.ready}
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Bed Census Card */}
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSheet('beds')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <BedDouble className="w-4 h-4 text-blue-600" />
                                Bed Census
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{bedStats.occupancyRate}%</span>
                            <span className="text-sm text-slate-500">occupied</span>
                        </div>
                        <div className="mt-3 flex gap-3 text-xs">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                {bedStats.available} free
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                {bedStats.cleaning} cleaning
                            </span>
                        </div>
                        {bedStats.expectedDischarges > 0 && (
                            <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                                <LogOut className="w-3 h-3" />
                                {bedStats.expectedDischarges} discharge(s) expected today
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue Leakage Card */}
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSheet('leakage')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <IndianRupee className="w-4 h-4 text-rose-600" />
                                Revenue Leakage
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-rose-600">
                                ₹{(leakageStats.totalLeakage / 1000).toFixed(0)}K
                            </span>
                            <span className="text-sm text-slate-500">est. loss</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs">
                            {leakageStats.highRiskCount > 0 ? (
                                <Badge variant="destructive" className="text-[10px]">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {leakageStats.highRiskCount} High Risk
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    No critical issues
                                </Badge>
                            )}
                        </div>
                        <div className="mt-2 text-xs text-slate-500 truncate">
                            Top: {leakageStats.topIssue}
                        </div>
                    </CardContent>
                </Card>

                {/* TPA Alerts Card */}
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSheet('tpa')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-purple-600" />
                                TPA Status
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{tpaStats.pending}</span>
                            <span className="text-sm text-slate-500">pending</span>
                        </div>
                        <div className="mt-3 flex gap-2 text-xs">
                            {tpaStats.urgent > 0 && (
                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-[10px]">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {tpaStats.urgent} &gt; 24hrs
                                </Badge>
                            )}
                            <span className="text-slate-400">
                                ₹{(tpaStats.totalPendingAmount / 100000).toFixed(1)}L pending
                            </span>
                        </div>
                        <div className="mt-2 flex gap-3 text-xs text-slate-500">
                            <span className="text-emerald-600">✓ {tpaStats.approved} approved</span>
                            <span className="text-rose-500">✗ {tpaStats.rejected} rejected</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Discharge Readiness Card */}
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSheet('discharge')}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <LogOut className="w-4 h-4 text-emerald-600" />
                            Discharge Readiness
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-emerald-600">{dischargeStats.ready}</span>
                            <span className="text-sm text-slate-500">ready to go</span>
                        </div>
                        <div className="mt-3 flex gap-3 text-xs">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                {dischargeStats.pending} pending
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                {dischargeStats.blocked} blocked
                            </span>
                        </div>
                        {dischargeStats.blocked > 0 && (
                            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {dischargeStats.blocked} patient(s) need attention
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/beds')} className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4" />
                    Manage Beds
                </Button>
                <Button variant="outline" onClick={() => navigate('/revenue')} className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Revenue Audit
                </Button>
                <Button variant="outline" onClick={() => navigate('/tpa')} className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    TPA Desk
                </Button>
            </div>

            {/* Summary Stats */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Patients</p>
                                <p className="text-2xl font-bold text-slate-900">{patients.filter(p => p.status !== 'Discharged').length}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Room Revenue</p>
                                <p className="text-2xl font-bold text-slate-900">₹{(bedStats.revenueToday / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Insurance Patients</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {insuredPatients.length}
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            Last updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* DRILL-DOWN SHEETS */}

            {/* Beds Drill-Down */}
            <Sheet open={activeSheet === 'beds'} onOpenChange={() => setActiveSheet(null)}>
                <SheetContent className="w-[500px] sm:w-[600px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <BedDouble className="w-5 h-5 text-blue-600" />
                            Bed Census Detail
                        </SheetTitle>
                        <SheetDescription>
                            {bedStats.occupied}/{bedStats.total} beds occupied • {bedStats.available} available
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-180px)] mt-4">
                        <div className="space-y-2">
                            {criticalBeds.slice(0, 15).map(bed => (
                                <Card key={bed.id} className="hover:bg-slate-50 transition-colors">
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono">{bed.label}</Badge>
                                            <div>
                                                <p className="font-medium text-sm">{bed.patient?.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    LOS: {bed.patient?.lengthOfStay}d • ₹{bed.patient?.currentBill.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handlePatientClick(bed.patient!.id)}>
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="mt-4 pt-4 border-t">
                        <Button className="w-full" onClick={() => { setActiveSheet(null); navigate('/beds'); }}>
                            <BedDouble className="w-4 h-4 mr-2" />
                            Open Full Bed Manager
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Leakage Drill-Down */}
            <Sheet open={activeSheet === 'leakage'} onOpenChange={() => setActiveSheet(null)}>
                <SheetContent className="w-[500px] sm:w-[600px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <IndianRupee className="w-5 h-5 text-rose-600" />
                            Revenue Leakage Risks
                        </SheetTitle>
                        <SheetDescription>
                            {revenueRisks.length} issues • ₹{(leakageStats.totalLeakage / 1000).toFixed(0)}K potential loss
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-180px)] mt-4">
                        <div className="space-y-2">
                            {revenueRisks.slice(0, 10).map(risk => (
                                <Card key={risk.id} className="border-l-4 border-l-rose-400 hover:bg-slate-50">
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <Badge className={cn(
                                                    "text-[10px] mb-1",
                                                    risk.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                                )}>
                                                    {risk.category}
                                                </Badge>
                                                <p className="text-sm text-slate-700">{risk.description}</p>
                                                <p className="text-xs font-medium text-rose-600 mt-1">₹{risk.potentialLoss.toLocaleString()}</p>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => handlePatientClick(risk.patientId)}>
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="mt-4 pt-4 border-t">
                        <Button className="w-full" onClick={() => { setActiveSheet(null); navigate('/revenue'); }}>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Open Revenue Dashboard
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* TPA Drill-Down */}
            <Sheet open={activeSheet === 'tpa'} onOpenChange={() => setActiveSheet(null)}>
                <SheetContent className="w-[500px] sm:w-[600px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-purple-600" />
                            Insurance Patients
                        </SheetTitle>
                        <SheetDescription>
                            {tpaStats.pending} pending • {tpaStats.approved} approved • ₹{(tpaStats.totalPendingAmount / 100000).toFixed(1)}L value
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-180px)] mt-4">
                        <div className="space-y-2">
                            {insuredPatients.slice(0, 15).map(patient => (
                                <Card key={patient.id} className="hover:bg-slate-50 transition-colors">
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                patient.clinicalFile?.status === 'signed' ? 'bg-emerald-500' : 'bg-amber-500'
                                            )} />
                                            <div>
                                                <p className="font-medium text-sm">{patient.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {patient.insuranceInfo?.provider || 'Insurance'} • Cap: ₹{((patient.insuranceInfo?.overallCap || 0) / 1000).toFixed(0)}K
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handlePatientClick(patient.id)}>
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {insuredPatients.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No insurance patients found</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="mt-4 pt-4 border-t">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => { setActiveSheet(null); navigate('/tpa'); }}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Open TPA Desk (AI Pre-Auth)
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Discharge Drill-Down */}
            <Sheet open={activeSheet === 'discharge'} onOpenChange={() => setActiveSheet(null)}>
                <SheetContent className="w-[500px] sm:w-[600px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <LogOut className="w-5 h-5 text-emerald-600" />
                            Discharge Pipeline
                        </SheetTitle>
                        <SheetDescription>
                            {dischargeStats.ready} ready • {dischargeStats.blocked} blocked
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-180px)] mt-4">
                        <div className="space-y-4">
                            {/* Ready Section */}
                            {dischargeReadyPatients.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-medium text-emerald-600 uppercase mb-2">Ready for Discharge</h4>
                                    <div className="space-y-2">
                                        {dischargeReadyPatients.slice(0, 8).map(patient => (
                                            <Card key={patient.id} className="border-l-4 border-l-emerald-400 hover:bg-slate-50">
                                                <CardContent className="p-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">{patient.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {patient.age}y {patient.gender.charAt(0)} • Ready
                                                        </p>
                                                    </div>
                                                    <Button size="sm" variant="outline" onClick={() => { setActiveSheet(null); navigate(`/patient/${patient.id}/discharge`); }}>
                                                        <LogOut className="w-3 h-3 mr-1" />
                                                        Discharge
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Blocked Section */}
                            {blockedPatients.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-medium text-rose-600 uppercase mb-2 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Blocked (Pending Orders)
                                    </h4>
                                    <div className="space-y-2">
                                        {blockedPatients.slice(0, 5).map(patient => (
                                            <Card key={patient.id} className="border-l-4 border-l-rose-400 hover:bg-slate-50">
                                                <CardContent className="p-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">{patient.name}</p>
                                                        <p className="text-xs text-rose-600">
                                                            {patient.orders?.filter(o => o.status === 'draft').length} pending orders
                                                        </p>
                                                    </div>
                                                    <Button size="sm" variant="ghost" onClick={() => handlePatientClick(patient.id)}>
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default OpsCommandCenter;
