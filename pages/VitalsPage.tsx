import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import VitalsPageHeader from '../components/vitals/VitalsPageHeader';
import VitalsInputCard from '../components/vitals/VitalsInputCard';
import VitalsSnapshotCard from '../components/vitals/VitalsSnapshotCard';
import VitalsChart from '../components/vitals/VitalsChart';
import AICard from '../components/vitals/AICard';
import AlertsCard from '../components/vitals/AlertsCard';
import PulseOxLiveBox from '../components/vitals/PulseOxLiveBox';
import VitalsTable from '../components/vitals/VitalsTable';
import { VitalsMeasurements } from '../types';

const VitalsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { patients, updatePatientVitals, isLoading } = usePatient();
    const [aiInsights, setAiInsights] = useState<string[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);

    const patient = useMemo(() => patients.find(p => p.id === id), [patients, id]);

    // Load AI insights when patient data is available
    useEffect(() => {
        const loadAIInsights = async () => {
            if (!patient || patient.vitalsHistory.length === 0) return;

            setIsLoadingInsights(true);
            try {
                const { summarizeVitals } = await import('../services/geminiService');
                const { summary } = await summarizeVitals(patient.vitalsHistory);
                setAiInsights([summary]);
            } catch (error) {
                console.error('Failed to load AI insights:', error);
                setAiInsights(['AI insights unavailable. Please check your connection.']);
            } finally {
                setIsLoadingInsights(false);
            }
        };

        loadAIInsights();
    }, [patient?.id]);

    if (!patient) {
        return <div className="p-8 text-center">Patient not found</div>;
    }

    const handleSaveVitals = async (vitals: VitalsMeasurements) => {
        // Convert VitalsMeasurements to Vitals interface expected by updatePatientVitals
        // Note: The context method might need adjustment or we map it here.
        // The current updatePatientVitals expects { hr, bpSys, bpDia, rr, spo2, temp }
        // But our input card returns partials. We'll map what we can.

        const mappedVitals = {
            hr: vitals.pulse || 0,
            bpSys: vitals.bp_sys || 0,
            bpDia: vitals.bp_dia || 0,
            rr: vitals.rr || 0,
            spo2: vitals.spo2 || 0,
            temp: vitals.temp_c || 0
        };

        await updatePatientVitals(patient.id, mappedVitals);
    };

    // Mock Alerts logic
    const alerts = [];
    if (patient.triage.level === 'Red') alerts.push("Critical Triage Level: Red");
    if (patient.vitals?.spo2 && patient.vitals.spo2 < 90) alerts.push("Critical Hypoxia Alert");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            <VitalsPageHeader patient={patient} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT PANEL (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        <VitalsInputCard onSave={handleSaveVitals} isLoading={isLoading} />
                        {patient.vitals && <VitalsSnapshotCard vitals={patient.vitals} />}
                    </div>

                    {/* MAIN PANEL (6 cols) */}
                    <div className="lg:col-span-6 space-y-6">
                        <VitalsChart data={patient.vitalsHistory} />
                        <VitalsTable history={patient.vitalsHistory} />
                    </div>

                    <div className="lg:col-span-3 space-y-6">
                        <PulseOxLiveBox />
                        <AlertsCard alerts={alerts} />
                        <AICard insights={isLoadingInsights ? ['Analyzing vitals...'] : aiInsights} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VitalsPage;
