import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Patient, TriageLevel } from '../types';
import PatientCard from '../components/PatientCard';
import { PlusIcon, SearchIcon } from '../components/icons';

const StatCard: React.FC<{ label: string; value: number | string; icon?: React.ReactNode; color: string; subtext?: string }> = ({ label, value, icon, color, subtext }) => (
    <div className="bg-background-primary p-5 rounded-2xl border border-border-color shadow-sm hover:shadow-md transition-shadow flex items-start justify-between relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-5 -mr-8 -mt-8 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
        <div>
            <p className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-text-primary mt-2 tracking-tight">{value}</p>
            {subtext && <p className="text-xs text-text-secondary mt-1 font-medium">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center text-opacity-100 shadow-sm`}>
            {icon}
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { patients, setSelectedPatientId, isLoading } = usePatient();
    const navigate = useNavigate();
    const [triageSearchTerm, setTriageSearchTerm] = useState('');

    const stats = useMemo(() => {
        const total = patients.length;
        const critical = patients.filter(p => p.triage.level === 'Red' && p.status !== 'Discharged').length;
        const waiting = patients.filter(p => p.status === 'Waiting for Triage' || p.status === 'Waiting for Doctor').length;
        return { total, critical, waiting };
    }, [patients]);

    const patientColumns = useMemo(() => {
        // Helper to sort by Triage Level: Red > Yellow > Green > None
        const sortByTriage = (a: Patient, b: Patient) => {
            const levels: Record<TriageLevel, number> = { 'Red': 3, 'Yellow': 2, 'Green': 1, 'None': 0 };
            return levels[b.triage.level] - levels[a.triage.level];
        };

        const waitingForTriage = patients
            .filter(p => p.status === 'Waiting for Triage')
            .filter(p => p.name.toLowerCase().includes(triageSearchTerm.toLowerCase()))
            .sort(sortByTriage);

        const waitingForDoctor = patients
            .filter(p => p.status === 'Waiting for Doctor')
            .sort(sortByTriage);

        const inTreatment = patients
            .filter(p => p.status === 'In Treatment')
            .sort(sortByTriage);

        return [
            { title: 'Reception / Triage', status: 'Waiting for Triage', patients: waitingForTriage, color: 'border-t-4 border-gray-400' },
            { title: 'Provider Queue', status: 'Waiting for Doctor', patients: waitingForDoctor, color: 'border-t-4 border-yellow-400' },
            { title: 'Active Treatment', status: 'In Treatment', patients: inTreatment, color: 'border-t-4 border-brand-blue' },
        ];
    }, [patients, triageSearchTerm]);

    const handleTriageClick = (patientId: string) => {
        setSelectedPatientId(patientId);
        navigate('/triage');
    };

    const handlePatientSelect = (patientId: string) => {
        setSelectedPatientId(patientId);
        navigate(`/patient/${patientId}`);
    };

    if (isLoading && patients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="text-text-tertiary animate-pulse font-medium">Syncing patient data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Total Patients"
                    value={stats.total}
                    icon={<span className="text-brand-blue text-2xl">👥</span>}
                    color="bg-brand-blue text-brand-blue"
                    subtext="Currently checked in"
                />
                <StatCard
                    label="Critical Attention"
                    value={stats.critical}
                    icon={<span className="text-triage-red text-2xl">⚡</span>}
                    color="bg-triage-red text-triage-red"
                    subtext="Requires immediate action"
                />
                <StatCard
                    label="Waiting Room"
                    value={stats.waiting}
                    icon={<span className="text-yellow-600 text-2xl">⏳</span>}
                    color="bg-yellow-500 text-yellow-600"
                    subtext="Avg wait: 12m"
                />
                <button
                    onClick={() => navigate('/reception')}
                    className="flex flex-col items-center justify-center p-4 bg-brand-blue text-white rounded-2xl shadow-lg shadow-brand-blue/30 hover:bg-brand-blue-dark hover:scale-[1.02] active:scale-95 transition-all group border border-brand-blue-dark"
                >
                    <div className="bg-white/20 p-2 rounded-full mb-1 group-hover:bg-white/30 transition-colors">
                        <PlusIcon className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm">Check-in Patient</span>
                </button>

                {/* Seed Database Button (Debug/Admin) */}
                <button
                    onClick={async () => {
                        if (confirm("Are you sure you want to seed the database? This will add mock patients.")) {
                            try {
                                const { seedDatabase } = await import('../services/firebase');
                                const count = await seedDatabase();
                                alert(`Successfully seeded ${count} patients!`);
                                window.location.reload();
                            } catch (e: any) {
                                alert(`Seeding failed: ${e.message}`);
                            }
                        }
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-background-secondary text-text-primary rounded-2xl shadow-sm hover:bg-background-tertiary hover:scale-[1.02] active:scale-95 transition-all group border border-border-color"
                >
                    <div className="bg-background-tertiary p-2 rounded-full mb-1 group-hover:bg-background-primary transition-colors">
                        <span className="text-xl">🎲</span>
                    </div>
                    <span className="font-bold text-sm">Seed Database</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {patientColumns.map(col => (
                    <div key={col.title} className="flex flex-col h-full">
                        <div className={`bg-background-primary rounded-t-2xl p-4 border-x border-t border-border-color ${col.color} shadow-sm z-10 relative`}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg text-text-primary tracking-tight">{col.title}</h3>
                                <span className="bg-background-secondary text-text-secondary px-2.5 py-0.5 rounded-full text-xs font-bold border border-border-color">
                                    {col.patients.length}
                                </span>
                            </div>

                            {col.status === 'Waiting for Triage' && (
                                <div className="relative mt-3">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-tertiary">
                                        <SearchIcon className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Filter by name..."
                                        value={triageSearchTerm}
                                        onChange={(e) => setTriageSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-border-color rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 bg-background-secondary/50 text-input-text transition-all placeholder-text-tertiary"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 bg-background-tertiary/50 dark:bg-background-secondary/20 p-4 rounded-b-2xl border-x border-b border-border-color min-h-[500px] overflow-y-auto">
                            <div className="space-y-4">
                                {col.patients.length > 0 ? (
                                    col.patients.map(p => <PatientCard key={p.id} patient={p} onTriageClick={handleTriageClick} onClick={handlePatientSelect} />)
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-text-tertiary opacity-60">
                                        <div className="w-16 h-16 bg-border-color/50 rounded-full mb-3 flex items-center justify-center">
                                            <span className="text-2xl">✓</span>
                                        </div>
                                        <span className="text-sm font-medium">No patients in queue</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardPage;
