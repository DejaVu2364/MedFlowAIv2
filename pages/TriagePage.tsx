import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Patient, Vitals } from '../types';

const TriageForm: React.FC<{ patient: Patient }> = ({ patient }) => {
    const { updatePatientVitals, isLoading, setSelectedPatientId } = usePatient();
    const navigate = useNavigate();
    const [vitals, setVitals] = useState<Vitals>({
        hr: 0,
        bpSys: 0,
        bpDia: 0,
        rr: 0,
        spo2: 0,
        temp: 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVitals(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updatePatientVitals(patient.id, vitals);
        setSelectedPatientId(null);
        navigate('/');
    };

    const handleBack = () => {
        setSelectedPatientId(null);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={handleBack} className="mb-4 text-sm text-brand-blue hover:underline">
                &larr; Back to Triage List
            </button>
            <div className="bg-background-primary p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Triage & Vitals Assessment</h2>
                <div className="mb-6 p-4 bg-brand-blue-light rounded-lg">
                    <p className="font-bold text-lg text-brand-blue-dark">{patient.name}, {patient.age}</p>
                    <p className="text-sm text-text-secondary mt-1"><strong>Complaint:</strong> {patient.complaint}</p>
                    {patient.aiTriage &&
                        <p className="text-sm text-text-secondary/80 mt-1">
                            <strong>AI Suggestion:</strong> {patient.aiTriage.department} (Triage: {patient.aiTriage.suggested_triage})
                        </p>
                    }
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {Object.entries({ hr: 'Heart Rate (bpm)', bpSys: 'BP Systolic (mmHg)', bpDia: 'BP Diastolic (mmHg)', rr: 'Resp. Rate (/min)', spo2: 'SpO2 (%)', temp: 'Temp (°C)' }).map(([key, label]) => (
                            <div key={key}>
                                <label htmlFor={key} className="block text-sm font-medium text-text-secondary">{label}</label>
                                <input
                                    type="number"
                                    name={key}
                                    id={key}
                                    value={vitals[key as keyof Vitals] > 0 ? vitals[key as keyof Vitals] : ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={() => { setSelectedPatientId(null); navigate('/'); }} className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-tertiary border border-transparent rounded-md hover:bg-border-color focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-wait">
                            {isLoading ? 'Saving...' : 'Submit Vitals'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TriagePatientList: React.FC = () => {
    const { patients, setSelectedPatientId } = usePatient();

    const waitingPatients = patients.filter(p => p.status === 'Waiting for Triage');

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Triage Queue</h2>
            <div className="bg-background-primary rounded-xl shadow-lg overflow-hidden">
                {waitingPatients.length > 0 ? (
                    <ul className="divide-y divide-border-color">
                        {waitingPatients.map(patient => (
                            <li key={patient.id} onClick={() => setSelectedPatientId(patient.id)} className="p-4 hover:bg-background-secondary cursor-pointer transition-colors" role="button" aria-label={`Triage patient ${patient.name}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-text-primary">{patient.name}</p>
                                        <p className="text-sm text-text-tertiary">{patient.age}, {patient.gender}</p>
                                    </div>
                                    {patient.aiTriage && (
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-text-tertiary uppercase">AI Suggestion</p>
                                            <p className="text-sm font-medium text-brand-blue-dark">{patient.aiTriage.department}</p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-text-secondary mt-2">{patient.complaint}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-8 text-center text-text-tertiary">No patients are waiting for triage.</p>
                )}
            </div>
        </div>
    );
};


const TriagePage: React.FC = () => {
    const { patients, selectedPatientId } = usePatient();
    const [patientForForm, setPatientForForm] = useState<Patient | null>(null);

    useEffect(() => {
        if (selectedPatientId) {
            const currentPatient = patients.find(p => p.id === selectedPatientId);
            if (currentPatient && currentPatient.status === 'Waiting for Triage') {
                setPatientForForm(currentPatient);
            } else {
                setPatientForForm(null);
            }
        } else {
            setPatientForForm(null);
        }
    }, [selectedPatientId, patients]);

    if (patientForForm) {
        return <TriageForm patient={patientForForm} />;
    } else {
        return <TriagePatientList />;
    }
};

export default TriagePage;