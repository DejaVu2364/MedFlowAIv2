import { Patient } from '../types';
import { RevenueAuditResult } from '../services/revenueService';

export interface RevenueRow {
    patientId: string;
    patientName: string;
    ward?: string; // Optional, maybe derived from bed or status
    leakage_amount: number;
    denial_risk: "Low" | "Medium" | "High";
    missed_items: string[];
    policy_gaps: string[];
}

export const aggregateRevenueData = (
    patient: Patient,
    auditResult: RevenueAuditResult
): RevenueRow => {
    return {
        patientId: patient.id,
        patientName: patient.name,
        leakage_amount: auditResult.leakage_amount,
        denial_risk: auditResult.denial_risk,
        missed_items: auditResult.missed_items,
        policy_gaps: auditResult.policy_gaps,
        ward: 'General Ward' // Placeholder as ward info isn't in core Patient type explicitly yet
    };
};


export interface RevenueInsight {
    totalLeakage: number;
    highRiskPatients: number;
    avgLeakagePerPatient: number;
    topMissedItems: { item: string; count: number; }[];
    riskDistribution: { Low: number; Medium: number; High: number };
}

export const calculateRevenueInsights = (rows: RevenueRow[]): RevenueInsight => {
    const totalLeakage = rows.reduce((sum, r) => sum + r.leakage_amount, 0);
    const highRiskPatients = rows.filter(r => r.denial_risk === 'High').length;
    const avgLeakagePerPatient = rows.length > 0 ? totalLeakage / rows.length : 0;

    // Rank Missed Items
    const itemMap = new Map<string, number>();
    rows.forEach(r => {
        r.missed_items.forEach(item => {
            itemMap.set(item, (itemMap.get(item) || 0) + 1);
        });
    });

    const topMissedItems = Array.from(itemMap.entries())
        .map(([item, count]) => ({ item, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

    // Risk Dist
    const riskDistribution = {
        Low: rows.filter(r => r.denial_risk === 'Low').length,
        Medium: rows.filter(r => r.denial_risk === 'Medium').length,
        High: rows.filter(r => r.denial_risk === 'High').length
    };

    return {
        totalLeakage,
        highRiskPatients,
        avgLeakagePerPatient,
        topMissedItems,
        riskDistribution
    };
};
