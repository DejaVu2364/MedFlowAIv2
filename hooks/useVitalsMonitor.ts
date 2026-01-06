import { useEffect, useCallback } from 'react';
import { Patient, VitalsMeasurements } from '../types';
import { useToast } from '../contexts/ToastContext';

// Vitals threshold configuration for deterioration detection
const VITALS_THRESHOLDS = {
    critical: {
        pulse_low: 40,
        pulse_high: 150,
        bp_sys_low: 80,
        bp_sys_high: 200,
        bp_dia_low: 40,
        bp_dia_high: 120,
        spo2_low: 88,
        temp_high: 39.5,
        temp_low: 35.0,
        rr_low: 8,
        rr_high: 30,
    },
    warning: {
        pulse_low: 50,
        pulse_high: 120,
        bp_sys_low: 90,
        bp_sys_high: 180,
        bp_dia_low: 50,
        bp_dia_high: 110,
        spo2_low: 92,
        temp_high: 38.5,
        temp_low: 35.5,
        rr_low: 10,
        rr_high: 24,
    }
};

export interface VitalsAlert {
    patientId: string;
    patientName: string;
    severity: 'critical' | 'warning';
    parameter: string;
    currentValue: number;
    threshold: number;
    direction: 'high' | 'low';
    message: string;
}

/**
 * Detects if vitals are deteriorating by comparing current with previous readings
 */
export const detectVitalsDeteriorating = (
    current: VitalsMeasurements | undefined,
    previous: VitalsMeasurements | undefined
): { deteriorating: boolean; parameters: string[] } => {
    if (!current || !previous) return { deteriorating: false, parameters: [] };

    const deterioratingParams: string[] = [];

    // Check each vital parameter for worsening trend
    if (current.pulse && previous.pulse) {
        const pulseDiff = current.pulse - previous.pulse;
        if (Math.abs(pulseDiff) > 20) {
            deterioratingParams.push(`Pulse ${pulseDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(pulseDiff)}`);
        }
    }

    if (current.spo2 && previous.spo2 && current.spo2 < previous.spo2 - 3) {
        deterioratingParams.push(`SpO2 dropped from ${previous.spo2}% to ${current.spo2}%`);
    }

    if (current.bp_sys && previous.bp_sys) {
        const bpDiff = previous.bp_sys - current.bp_sys;
        if (bpDiff > 20) {
            deterioratingParams.push(`BP dropped by ${bpDiff}mmHg`);
        }
    }

    if (current.temp_c && previous.temp_c && current.temp_c > previous.temp_c + 0.5) {
        deterioratingParams.push(`Temperature rising (${previous.temp_c}°C → ${current.temp_c}°C)`);
    }

    return {
        deteriorating: deterioratingParams.length > 0,
        parameters: deterioratingParams
    };
};

/**
 * Checks vitals against thresholds and generates alerts
 */
export const checkVitalsThresholds = (
    vitals: VitalsMeasurements | undefined,
    patientId: string,
    patientName: string
): VitalsAlert[] => {
    if (!vitals) return [];

    const alerts: VitalsAlert[] = [];

    // Pulse checks
    if (vitals.pulse) {
        if (vitals.pulse < VITALS_THRESHOLDS.critical.pulse_low) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'Pulse',
                currentValue: vitals.pulse, threshold: VITALS_THRESHOLDS.critical.pulse_low,
                direction: 'low', message: `⚠️ CRITICAL: ${patientName} - Bradycardia (HR: ${vitals.pulse})`
            });
        } else if (vitals.pulse > VITALS_THRESHOLDS.critical.pulse_high) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'Pulse',
                currentValue: vitals.pulse, threshold: VITALS_THRESHOLDS.critical.pulse_high,
                direction: 'high', message: `⚠️ CRITICAL: ${patientName} - Tachycardia (HR: ${vitals.pulse})`
            });
        } else if (vitals.pulse < VITALS_THRESHOLDS.warning.pulse_low || vitals.pulse > VITALS_THRESHOLDS.warning.pulse_high) {
            alerts.push({
                patientId, patientName, severity: 'warning', parameter: 'Pulse',
                currentValue: vitals.pulse, threshold: vitals.pulse < VITALS_THRESHOLDS.warning.pulse_low
                    ? VITALS_THRESHOLDS.warning.pulse_low : VITALS_THRESHOLDS.warning.pulse_high,
                direction: vitals.pulse < VITALS_THRESHOLDS.warning.pulse_low ? 'low' : 'high',
                message: `⚡ WARNING: ${patientName} - Abnormal heart rate (HR: ${vitals.pulse})`
            });
        }
    }

    // SpO2 checks
    if (vitals.spo2) {
        if (vitals.spo2 < VITALS_THRESHOLDS.critical.spo2_low) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'SpO2',
                currentValue: vitals.spo2, threshold: VITALS_THRESHOLDS.critical.spo2_low,
                direction: 'low', message: `⚠️ CRITICAL: ${patientName} - Severe Hypoxia (SpO2: ${vitals.spo2}%)`
            });
        } else if (vitals.spo2 < VITALS_THRESHOLDS.warning.spo2_low) {
            alerts.push({
                patientId, patientName, severity: 'warning', parameter: 'SpO2',
                currentValue: vitals.spo2, threshold: VITALS_THRESHOLDS.warning.spo2_low,
                direction: 'low', message: `⚡ WARNING: ${patientName} - Low oxygen (SpO2: ${vitals.spo2}%)`
            });
        }
    }

    // Blood Pressure checks
    if (vitals.bp_sys) {
        if (vitals.bp_sys < VITALS_THRESHOLDS.critical.bp_sys_low) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'BP Systolic',
                currentValue: vitals.bp_sys, threshold: VITALS_THRESHOLDS.critical.bp_sys_low,
                direction: 'low', message: `⚠️ CRITICAL: ${patientName} - Hypotension (BP: ${vitals.bp_sys}/${vitals.bp_dia || '?'})`
            });
        } else if (vitals.bp_sys > VITALS_THRESHOLDS.critical.bp_sys_high) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'BP Systolic',
                currentValue: vitals.bp_sys, threshold: VITALS_THRESHOLDS.critical.bp_sys_high,
                direction: 'high', message: `⚠️ CRITICAL: ${patientName} - Hypertensive Crisis (BP: ${vitals.bp_sys}/${vitals.bp_dia || '?'})`
            });
        }
    }

    // Temperature checks
    if (vitals.temp_c) {
        if (vitals.temp_c > VITALS_THRESHOLDS.critical.temp_high) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'Temperature',
                currentValue: vitals.temp_c, threshold: VITALS_THRESHOLDS.critical.temp_high,
                direction: 'high', message: `⚠️ CRITICAL: ${patientName} - High Fever (${vitals.temp_c}°C)`
            });
        } else if (vitals.temp_c < VITALS_THRESHOLDS.critical.temp_low) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'Temperature',
                currentValue: vitals.temp_c, threshold: VITALS_THRESHOLDS.critical.temp_low,
                direction: 'low', message: `⚠️ CRITICAL: ${patientName} - Hypothermia (${vitals.temp_c}°C)`
            });
        } else if (vitals.temp_c > VITALS_THRESHOLDS.warning.temp_high) {
            alerts.push({
                patientId, patientName, severity: 'warning', parameter: 'Temperature',
                currentValue: vitals.temp_c, threshold: VITALS_THRESHOLDS.warning.temp_high,
                direction: 'high', message: `⚡ WARNING: ${patientName} - Fever (${vitals.temp_c}°C)`
            });
        }
    }

    // Respiratory Rate checks
    if (vitals.rr) {
        if (vitals.rr < VITALS_THRESHOLDS.critical.rr_low || vitals.rr > VITALS_THRESHOLDS.critical.rr_high) {
            alerts.push({
                patientId, patientName, severity: 'critical', parameter: 'Respiratory Rate',
                currentValue: vitals.rr, threshold: vitals.rr < VITALS_THRESHOLDS.critical.rr_low
                    ? VITALS_THRESHOLDS.critical.rr_low : VITALS_THRESHOLDS.critical.rr_high,
                direction: vitals.rr < VITALS_THRESHOLDS.critical.rr_low ? 'low' : 'high',
                message: `⚠️ CRITICAL: ${patientName} - Respiratory distress (RR: ${vitals.rr}/min)`
            });
        }
    }

    return alerts;
};

/**
 * Hook to monitor patient vitals for deterioration and threshold breaches
 */
export const useVitalsMonitor = (patients: Patient[]) => {
    const { addToast } = useToast();

    // Track which alerts we've already shown to avoid duplicates
    const alertedPatients = new Map<string, number>();

    const checkAllPatients = useCallback(() => {
        const allAlerts: VitalsAlert[] = [];

        for (const patient of patients) {
            // Skip discharged patients
            if (patient.status === 'Discharged') continue;

            // Check current vitals against thresholds
            const thresholdAlerts = checkVitalsThresholds(patient.vitals, patient.id, patient.name);

            // Check for deterioration (compare with previous reading)
            if (patient.vitalsHistory && patient.vitalsHistory.length >= 2) {
                const current = patient.vitalsHistory[0]?.measurements;
                const previous = patient.vitalsHistory[1]?.measurements;
                const deterioration = detectVitalsDeteriorating(current, previous);

                if (deterioration.deteriorating) {
                    thresholdAlerts.push({
                        patientId: patient.id,
                        patientName: patient.name,
                        severity: 'warning',
                        parameter: 'Trend',
                        currentValue: 0,
                        threshold: 0,
                        direction: 'low',
                        message: `📉 DETERIORATING: ${patient.name} - ${deterioration.parameters.join(', ')}`
                    });
                }
            }

            allAlerts.push(...thresholdAlerts);
        }

        return allAlerts;
    }, [patients]);

    // Monitor for changes in patient vitals
    useEffect(() => {
        const alerts = checkAllPatients();

        // Show critical alerts immediately
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        criticalAlerts.forEach(alert => {
            const lastAlertTime = alertedPatients.get(`${alert.patientId}-${alert.parameter}`);
            const now = Date.now();

            // Only show alert if we haven't alerted about this in the last 60 seconds
            if (!lastAlertTime || now - lastAlertTime > 60000) {
                addToast(alert.message, 'error');
                alertedPatients.set(`${alert.patientId}-${alert.parameter}`, now);
            }
        });

        // Show warning alerts with lower frequency
        const warningAlerts = alerts.filter(a => a.severity === 'warning');
        warningAlerts.forEach(alert => {
            const lastAlertTime = alertedPatients.get(`${alert.patientId}-${alert.parameter}`);
            const now = Date.now();

            // Only show warning if we haven't alerted about this in the last 5 minutes
            if (!lastAlertTime || now - lastAlertTime > 300000) {
                addToast(alert.message, 'info');
                alertedPatients.set(`${alert.patientId}-${alert.parameter}`, now);
            }
        });
    }, [patients, checkAllPatients, addToast]);

    return {
        checkAllPatients,
        alerts: checkAllPatients()
    };
};

export default useVitalsMonitor;
