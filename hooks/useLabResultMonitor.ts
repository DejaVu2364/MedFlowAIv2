import { useEffect, useRef, useCallback, useState } from 'react';
import { Patient, Result } from '../types';
import { useToast } from '../contexts/ToastContext';

/**
 * Lab Result Alert Configuration
 * Enterprise-grade thresholds for critical lab values
 */
export interface LabAlertConfig {
    name: string;
    criticalLow?: number;
    criticalHigh?: number;
    warningLow?: number;
    warningHigh?: number;
    unit: string;
}

// Clinical reference ranges for common lab tests
const LAB_ALERT_CONFIGS: Record<string, LabAlertConfig> = {
    'hemoglobin': { name: 'Hemoglobin', criticalLow: 7, warningLow: 10, criticalHigh: 20, unit: 'g/dL' },
    'platelet': { name: 'Platelet Count', criticalLow: 20000, warningLow: 50000, criticalHigh: 1000000, unit: '/µL' },
    'wbc': { name: 'WBC Count', criticalLow: 2000, warningLow: 4000, criticalHigh: 30000, unit: '/µL' },
    'creatinine': { name: 'Creatinine', criticalHigh: 10, warningHigh: 4, unit: 'mg/dL' },
    'potassium': { name: 'Potassium', criticalLow: 2.5, warningLow: 3.5, criticalHigh: 6.5, warningHigh: 5.5, unit: 'mEq/L' },
    'sodium': { name: 'Sodium', criticalLow: 120, warningLow: 130, criticalHigh: 160, warningHigh: 150, unit: 'mEq/L' },
    'glucose': { name: 'Blood Glucose', criticalLow: 40, warningLow: 70, criticalHigh: 500, warningHigh: 300, unit: 'mg/dL' },
    'troponin': { name: 'Troponin', criticalHigh: 0.04, unit: 'ng/mL' },
    'hba1c': { name: 'HbA1c', warningHigh: 7, criticalHigh: 10, unit: '%' },
    'inr': { name: 'INR', criticalHigh: 5, warningHigh: 3.5, unit: '' },
    'bilirubin': { name: 'Bilirubin', criticalHigh: 15, warningHigh: 5, unit: 'mg/dL' },
};

export interface LabAlert {
    id: string;
    patientId: string;
    patientName: string;
    resultId: string;
    resultName: string;
    value: string;
    severity: 'critical' | 'warning';
    direction: 'high' | 'low' | 'abnormal';
    message: string;
    timestamp: string;
    acknowledged: boolean;
}

/**
 * Parse numeric value from result string (handles "45,000" etc.)
 */
const parseResultValue = (value: string): number | null => {
    if (!value) return null;
    const cleaned = value.replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
};

/**
 * Match result name to config key (fuzzy matching)
 */
const matchLabConfig = (resultName: string): LabAlertConfig | null => {
    const lower = resultName.toLowerCase();
    for (const [key, config] of Object.entries(LAB_ALERT_CONFIGS)) {
        if (lower.includes(key) || lower.includes(config.name.toLowerCase())) {
            return config;
        }
    }
    return null;
};

/**
 * Analyze a result for alerts
 */
const analyzeResult = (
    result: Result,
    patientName: string
): LabAlert | null => {
    // First check if result is marked as abnormal
    if (!result.isAbnormal) return null;

    const numericValue = parseResultValue(result.value);
    const config = matchLabConfig(result.name);

    let severity: 'critical' | 'warning' = 'warning';
    let direction: 'high' | 'low' | 'abnormal' = 'abnormal';

    if (config && numericValue !== null) {
        // Check critical thresholds
        if (config.criticalLow !== undefined && numericValue < config.criticalLow) {
            severity = 'critical';
            direction = 'low';
        } else if (config.criticalHigh !== undefined && numericValue > config.criticalHigh) {
            severity = 'critical';
            direction = 'high';
        } else if (config.warningLow !== undefined && numericValue < config.warningLow) {
            severity = 'warning';
            direction = 'low';
        } else if (config.warningHigh !== undefined && numericValue > config.warningHigh) {
            severity = 'warning';
            direction = 'high';
        }
    }

    const emoji = severity === 'critical' ? '🚨' : '⚠️';
    const directionText = direction === 'high' ? 'HIGH' : direction === 'low' ? 'LOW' : 'ABNORMAL';

    return {
        id: `alert-${result.id}-${Date.now()}`,
        patientId: result.patientId,
        patientName,
        resultId: result.id,
        resultName: result.name,
        value: result.value,
        severity,
        direction,
        message: `${emoji} ${patientName}: ${result.name} ${directionText} (${result.value})`,
        timestamp: result.timestamp,
        acknowledged: false,
    };
};

/**
 * Enterprise-grade Lab Result Monitor Hook
 * 
 * Features:
 * - Detects new abnormal lab results across all patients
 * - Classifies severity (critical/warning) based on clinical thresholds
 * - Fires toast notifications for new alerts
 * - Maintains alert history for dashboard display
 * - Prevents duplicate alerts for same result
 */
export const useLabResultMonitor = (patients: Patient[]) => {
    const { addToast } = useToast();
    const [alerts, setAlerts] = useState<LabAlert[]>([]);
    const seenResultIds = useRef<Set<string>>(new Set());
    const isFirstRender = useRef(true);

    // Scan all patients for abnormal results
    const scanForAlerts = useCallback(() => {
        const newAlerts: LabAlert[] = [];

        for (const patient of patients) {
            if (patient.status === 'Discharged') continue;
            if (!patient.results?.length) continue;

            for (const result of patient.results) {
                // Skip if already seen
                if (seenResultIds.current.has(result.id)) continue;

                const alert = analyzeResult(result, patient.name);
                if (alert) {
                    newAlerts.push(alert);
                }

                // Mark as seen regardless of alert status
                seenResultIds.current.add(result.id);
            }
        }

        return newAlerts;
    }, [patients]);

    // Monitor for new results
    useEffect(() => {
        const newAlerts = scanForAlerts();

        if (newAlerts.length > 0) {
            // Add to alert history
            setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50

            /*
            // Fire toasts only after first render (avoid initial flood)
            // DISABLED FOR ENTERPRISE MODE - No popups
            if (!isFirstRender.current) {
                // ... logic removed ...
            }
            */
        }

        isFirstRender.current = false;
    }, [patients, scanForAlerts, addToast]);

    // Acknowledge an alert
    const acknowledgeAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.map(a =>
            a.id === alertId ? { ...a, acknowledged: true } : a
        ));
    }, []);

    // Acknowledge all alerts
    const acknowledgeAll = useCallback(() => {
        setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    }, []);

    // Get unacknowledged counts
    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
    const warningCount = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length;
    const totalUnacknowledged = criticalCount + warningCount;

    return {
        alerts,
        criticalCount,
        warningCount,
        totalUnacknowledged,
        acknowledgeAlert,
        acknowledgeAll,
    };
};

export default useLabResultMonitor;
