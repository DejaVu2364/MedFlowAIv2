import { useEffect, useRef, useCallback, useState } from 'react';
import { Patient, VitalsMeasurements, Order, Result } from '../types';

/**
 * Change Detection Types
 */
export interface PatientChange {
    type: 'vitals' | 'orders' | 'results' | 'status' | 'clinicalFile';
    severity: 'critical' | 'significant' | 'minor';
    description: string;
    timestamp: number;
    data?: any;
}

export interface ChangeDetectorResult {
    hasChanges: boolean;
    changes: PatientChange[];
    lastVitalsChange: number | null;
    lastOrdersChange: number | null;
    lastResultsChange: number | null;
}

/**
 * Helper to compute a simple hash of vitals for comparison
 */
const hashVitals = (vitals?: VitalsMeasurements): string => {
    if (!vitals) return '';
    return `${vitals.pulse || 0}-${vitals.bp_sys || 0}/${vitals.bp_dia || 0}-${vitals.spo2 || 0}-${vitals.temp_c || 0}-${vitals.rr || 0}`;
};

/**
 * Helper to compute order count hash
 */
const hashOrders = (orders?: Order[]): string => {
    if (!orders?.length) return '0';
    return `${orders.length}-${orders.filter(o => o.status === 'draft').length}`;
};

/**
 * Helper to compute results count and abnormal hash
 */
const hashResults = (results?: Result[]): string => {
    if (!results?.length) return '0';
    return `${results.length}-${results.filter(r => r.isAbnormal).length}`;
};

/**
 * Detect critical vitals changes
 */
const detectVitalsChange = (prev?: VitalsMeasurements, curr?: VitalsMeasurements): PatientChange | null => {
    if (!prev || !curr) return null;

    const changes: string[] = [];
    let severity: 'critical' | 'significant' | 'minor' = 'minor';

    // Heart rate changes
    const hrDiff = Math.abs((curr.pulse || 0) - (prev.pulse || 0));
    if (hrDiff >= 30) {
        changes.push(`HR ${hrDiff > 0 ? 'increased' : 'decreased'} by ${hrDiff}`);
        severity = 'critical';
    } else if (hrDiff >= 15) {
        changes.push(`HR change: ${hrDiff} bpm`);
        severity = 'significant';
    }

    // SpO2 changes
    const spo2Diff = (prev.spo2 || 100) - (curr.spo2 || 100);
    if (spo2Diff >= 5) {
        changes.push(`SpO2 dropped by ${spo2Diff}%`);
        severity = 'critical';
    }

    // BP changes
    const sysDiff = Math.abs((curr.bp_sys || 0) - (prev.bp_sys || 0));
    if (sysDiff >= 30) {
        changes.push(`BP systolic changed by ${sysDiff}`);
        severity = severity === 'critical' ? 'critical' : 'significant';
    }

    if (changes.length === 0) return null;

    return {
        type: 'vitals',
        severity,
        description: changes.join(', '),
        timestamp: Date.now(),
        data: { prev, curr }
    };
};

/**
 * Enterprise Patient Change Detector Hook
 * 
 * Monitors a patient for meaningful data changes that should trigger:
 * - AI context refresh
 * - UI updates
 * - Alert generation
 */
export const usePatientChangeDetector = (patient: Patient | null) => {
    const [changes, setChanges] = useState<PatientChange[]>([]);
    const [lastVitalsHash, setLastVitalsHash] = useState<string>('');
    const [lastOrdersHash, setLastOrdersHash] = useState<string>('');
    const [lastResultsHash, setLastResultsHash] = useState<string>('');
    const previousPatient = useRef<Patient | null>(null);

    // Detect changes on patient update
    useEffect(() => {
        if (!patient) return;

        const detectedChanges: PatientChange[] = [];
        const currVitalsHash = hashVitals(patient.vitals);
        const currOrdersHash = hashOrders(patient.orders);
        const currResultsHash = hashResults(patient.results);

        // Vitals change detection
        if (lastVitalsHash && currVitalsHash !== lastVitalsHash && previousPatient.current) {
            const vitalsChange = detectVitalsChange(previousPatient.current.vitals, patient.vitals);
            if (vitalsChange) {
                detectedChanges.push(vitalsChange);
            }
        }

        // Orders change detection
        if (lastOrdersHash && currOrdersHash !== lastOrdersHash) {
            const prevCount = parseInt(lastOrdersHash.split('-')[0]) || 0;
            const currCount = patient.orders?.length || 0;
            if (currCount > prevCount) {
                detectedChanges.push({
                    type: 'orders',
                    severity: 'significant',
                    description: `${currCount - prevCount} new order(s) added`,
                    timestamp: Date.now()
                });
            }
        }

        // Results change detection
        if (lastResultsHash && currResultsHash !== lastResultsHash) {
            const prevAbnormal = parseInt(lastResultsHash.split('-')[1]) || 0;
            const currAbnormal = patient.results?.filter(r => r.isAbnormal).length || 0;
            if (currAbnormal > prevAbnormal) {
                detectedChanges.push({
                    type: 'results',
                    severity: 'critical',
                    description: `${currAbnormal - prevAbnormal} new abnormal result(s)`,
                    timestamp: Date.now()
                });
            } else if (patient.results && patient.results.length > parseInt(lastResultsHash.split('-')[0])) {
                detectedChanges.push({
                    type: 'results',
                    severity: 'minor',
                    description: 'New lab results available',
                    timestamp: Date.now()
                });
            }
        }

        // Status change detection
        if (previousPatient.current && previousPatient.current.status !== patient.status) {
            detectedChanges.push({
                type: 'status',
                severity: 'significant',
                description: `Status changed: ${previousPatient.current.status} → ${patient.status}`,
                timestamp: Date.now()
            });
        }

        // Update hashes
        setLastVitalsHash(currVitalsHash);
        setLastOrdersHash(currOrdersHash);
        setLastResultsHash(currResultsHash);

        // Store detected changes
        if (detectedChanges.length > 0) {
            setChanges(prev => [...detectedChanges, ...prev].slice(0, 20));
        }

        // Store current patient for next comparison
        previousPatient.current = { ...patient };
    }, [patient, lastVitalsHash, lastOrdersHash, lastResultsHash]);

    // Get latest change times
    const lastVitalsChange = changes.find(c => c.type === 'vitals')?.timestamp || null;
    const lastOrdersChange = changes.find(c => c.type === 'orders')?.timestamp || null;
    const lastResultsChange = changes.find(c => c.type === 'results')?.timestamp || null;

    // Check if any critical changes exist
    const hasCriticalChanges = changes.some(c => c.severity === 'critical');
    const hasSignificantChanges = changes.some(c => c.severity === 'significant');

    // Clear changes
    const clearChanges = useCallback(() => {
        setChanges([]);
    }, []);

    return {
        hasChanges: changes.length > 0,
        hasCriticalChanges,
        hasSignificantChanges,
        changes,
        lastVitalsChange,
        lastOrdersChange,
        lastResultsChange,
        clearChanges
    };
};

export default usePatientChangeDetector;
