import { describe, it, expect, vi } from 'vitest';

// Mock the types for testing
interface MockResult {
    id: string;
    name: string;
    value: string;
    isAbnormal: boolean;
}

interface MockPatient {
    id: string;
    name: string;
    results?: MockResult[];
}

// Simplified lab thresholds for testing
const LAB_ALERT_CONFIGS = {
    'hemoglobin': { criticalLow: 7, warningLow: 10, criticalHigh: 20, unit: 'g/dL' },
    'potassium': { criticalLow: 2.5, warningLow: 3.5, criticalHigh: 6.0, unit: 'mEq/L' },
    'sodium': { criticalLow: 120, warningLow: 130, criticalHigh: 155, unit: 'mEq/L' },
    'glucose': { criticalLow: 50, warningLow: 70, criticalHigh: 400, unit: 'mg/dL' },
};

// Simplified lab result analysis for testing
const analyzeResult = (result: MockResult): { severity: 'critical' | 'warning' | null; direction: 'high' | 'low' | null } => {
    const name = result.name.toLowerCase();
    const config = Object.entries(LAB_ALERT_CONFIGS).find(([key]) => name.includes(key));

    if (!config || !result.value) return { severity: null, direction: null };

    const numericValue = parseFloat(result.value);
    if (isNaN(numericValue)) return { severity: null, direction: null };

    const [, thresholds] = config;

    if (thresholds.criticalLow && numericValue < thresholds.criticalLow) {
        return { severity: 'critical', direction: 'low' };
    }
    if (thresholds.criticalHigh && numericValue > thresholds.criticalHigh) {
        return { severity: 'critical', direction: 'high' };
    }
    if (thresholds.warningLow && numericValue < thresholds.warningLow) {
        return { severity: 'warning', direction: 'low' };
    }

    return { severity: null, direction: null };
};

describe('Lab Result Monitor Logic', () => {

    it('detects critical low hemoglobin', () => {
        const result: MockResult = {
            id: 'r1',
            name: 'Hemoglobin',
            value: '6.5',
            isAbnormal: true
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBe('critical');
        expect(analysis.direction).toBe('low');
    });

    it('detects warning low hemoglobin', () => {
        const result: MockResult = {
            id: 'r2',
            name: 'Hemoglobin',
            value: '9.0',
            isAbnormal: true
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBe('warning');
        expect(analysis.direction).toBe('low');
    });

    it('does not alert for normal hemoglobin', () => {
        const result: MockResult = {
            id: 'r3',
            name: 'Hemoglobin',
            value: '14.0',
            isAbnormal: false
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBeNull();
    });

    it('detects critical high potassium', () => {
        const result: MockResult = {
            id: 'r4',
            name: 'Potassium',
            value: '6.5',
            isAbnormal: true
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBe('critical');
        expect(analysis.direction).toBe('high');
    });

    it('detects critical low glucose', () => {
        const result: MockResult = {
            id: 'r5',
            name: 'Blood Glucose Fasting',
            value: '45',
            isAbnormal: true
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBe('critical');
        expect(analysis.direction).toBe('low');
    });

    it('detects critical low sodium (hyponatremia)', () => {
        const result: MockResult = {
            id: 'r6',
            name: 'Serum Sodium',
            value: '118',
            isAbnormal: true
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBe('critical');
        expect(analysis.direction).toBe('low');
    });

    it('handles non-numeric values gracefully', () => {
        const result: MockResult = {
            id: 'r7',
            name: 'Hemoglobin',
            value: 'Pending',
            isAbnormal: false
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBeNull();
    });

    it('ignores unrecognized lab types', () => {
        const result: MockResult = {
            id: 'r8',
            name: 'Some Unknown Lab',
            value: '999',
            isAbnormal: false
        };

        const analysis = analyzeResult(result);
        expect(analysis.severity).toBeNull();
    });
});
