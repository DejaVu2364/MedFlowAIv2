import { describe, it, expect } from 'vitest';
import { generateSyntheaData } from '../../utils/syntheaImporter';

describe('syntheaImporter', () => {

    it('generates 50 synthetic patients', () => {
        const patients = generateSyntheaData();
        expect(patients).toHaveLength(50);
    });

    it('generates critical scenario patients', () => {
        const patients = generateSyntheaData();

        // Amitabh B
        const amitabh = patients.find(p => p.name === 'Amitabh B');
        expect(amitabh).toBeDefined();
        expect(amitabh?.chiefComplaints[0].complaint).toBe('Head Injury');
        expect(amitabh?.clinicalFile.sections.history?.hpi).toContain('suturing');

        // Sania M
        const sania = patients.find(p => p.name === 'Sania M');
        expect(sania).toBeDefined();
        expect(sania?.status).toBe('In Treatment');
        expect(sania?.dischargeSummary?.status).toBe('finalized');

        // Vikram S
        const vikram = patients.find(p => p.name === 'Vikram S');
        expect(vikram).toBeDefined();
        expect(vikram?.orders.length).toBeGreaterThan(0);
        expect(vikram?.orders[0].label).toContain('Meropenem');

        // Rahul D
        const rahul = patients.find(p => p.name === 'Rahul D');
        expect(rahul).toBeDefined();
        expect(rahul?.triage.level).toBe('Red');
        expect(rahul?.vitals?.pulse).toBeGreaterThan(100);
    });

    it('ensures valid unique IDs', () => {
        const patients = generateSyntheaData();
        const ids = new Set(patients.map(p => p.id));
        expect(ids.size).toBe(50);
    });
});
