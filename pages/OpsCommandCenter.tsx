import React, { useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useNavigate } from 'react-router-dom';
import { allocatePatientsToBeds, calculateTotalRoomRevenue } from '../utils/bedLogic';
import { runRevenueAudit } from '../utils/revenueGuardLogic';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
    Users
} from 'lucide-react';
import { cn } from '../lib/utils';

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
    const { patients } = usePatient();
    const navigate = useNavigate();

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

    // Calculate TPA Stats (Mock for now - will connect to real data)
    const tpaStats = useMemo((): TPAStats => {
        // Mock insurance patients (in real app, would use actual insurance data)
        const activePatients = patients.filter(p => p.status !== 'Discharged');
        const mockInsuranceCount = Math.floor(activePatients.length * 0.4); // Assume 40% are insured

        return {
            pending: Math.min(5, mockInsuranceCount),
            approved: Math.floor(mockInsuranceCount * 0.6),
            rejected: Math.floor(mockInsuranceCount * 0.1),
            urgent: Math.min(2, Math.floor(mockInsuranceCount * 0.3)),
            totalPendingAmount: mockInsuranceCount * 45000
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
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Live
                </Badge>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Bed Census Card */}
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/beds')}>
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
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/revenue')}>
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
                <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/tpa')}>
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
                <Card className="border-0 shadow-md bg-white">
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
                                    {Math.floor(patients.filter(p => p.status !== 'Discharged').length * 0.4)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OpsCommandCenter;
