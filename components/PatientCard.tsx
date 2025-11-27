import React from 'react';
import { Patient, TriageLevel } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePatient } from '../contexts/PatientContext';

interface PatientCardProps {
    patient: Patient;
    onTriageClick?: (patientId: string) => void;
    onClick?: (patientId: string) => void;
}

const TriageBadge: React.FC<{ level: TriageLevel }> = React.memo(({ level }) => {
    const levelStyles: Record<TriageLevel, string> = {
        Red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400',
        Yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
        Green: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
        None: 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400',
    };
    return (
        <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ring-1 ring-inset ${levelStyles[level]}`}>
            {level}
        </span>
    );
});

const PatientCard: React.FC<PatientCardProps> = ({ patient, onTriageClick, onClick }) => {
    const { currentUser } = useAuth();
    const { logAuditEvent } = usePatient();

    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const diff = (new Date().getTime() - date.getTime()) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };

    const handleCardClick = () => {
        if (onClick) {
            if (currentUser) {
                logAuditEvent({
                    userId: currentUser.id,
                    patientId: patient.id,
                    action: 'view',
                    entity: 'patient_record'
                });
            }
            onClick(patient.id);
        }
    };

    const isCritical = patient.triage.level === 'Red' && patient.status !== 'Discharged';
    const vitals = patient.vitals;

    return (
        <div
            className={`group relative bg-background-primary rounded-xl border border-border-color shadow-sm hover:shadow-soft transition-all duration-300 cursor-pointer overflow-hidden ${isCritical ? 'animate-pulse-red ring-1 ring-red-400' : ''}`}
            onClick={handleCardClick}
            role="button"
        >
            {/* Status indicator bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${patient.triage.level === 'Red' ? 'bg-triage-red' :
                    patient.triage.level === 'Yellow' ? 'bg-triage-yellow' :
                        patient.triage.level === 'Green' ? 'bg-triage-green' : 'bg-transparent'
                }`}></div>

            <div className="p-5 pl-6">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-base font-bold text-text-primary group-hover:text-brand-blue transition-colors">
                            {patient.name}
                        </h3>
                        <p className="text-xs text-text-tertiary font-medium">
                            {patient.age}y &middot; {patient.gender}
                        </p>
                    </div>
                    <TriageBadge level={patient.triage.level} />
                </div>

                <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                    {patient.complaint}
                </p>

                {/* Mini Stats Grid for Scannability */}
                {vitals && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-background-secondary rounded p-1.5 text-center">
                            <div className="text-[10px] text-text-tertiary uppercase">HR</div>
                            <div className={`text-xs font-bold ${vitals.pulse && vitals.pulse > 100 ? 'text-triage-red' : 'text-text-primary'}`}>
                                {vitals.pulse || '--'}
                            </div>
                        </div>
                        <div className="bg-background-secondary rounded p-1.5 text-center">
                            <div className="text-[10px] text-text-tertiary uppercase">BP</div>
                            <div className="text-xs font-bold text-text-primary">
                                {vitals.bp_sys}/{vitals.bp_dia || '--'}
                            </div>
                        </div>
                        <div className="bg-background-secondary rounded p-1.5 text-center">
                            <div className="text-[10px] text-text-tertiary uppercase">SpO2</div>
                            <div className={`text-xs font-bold ${vitals.spo2 && vitals.spo2 < 95 ? 'text-triage-red' : 'text-text-primary'}`}>
                                {vitals.spo2 || '--'}%
                            </div>
                        </div>
                    </div>
                )}

                {patient.aiTriage && !vitals && (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-2.5 mb-3 border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-1.5 mb-1">
                            <svg className="w-3 h-3 text-brand-blue" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" /></svg>
                            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wide">AI Suggestion</span>
                        </div>
                        <p className="text-xs text-text-secondary">
                            Likely <span className="font-semibold text-text-primary">{patient.aiTriage.department}</span>
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-border-color">
                    <span className="text-xs font-mono text-text-tertiary flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {timeSince(patient.registrationTime)}
                    </span>

                    {patient.status === 'Waiting for Triage' && onTriageClick ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onTriageClick(patient.id); }}
                            className="text-xs font-semibold text-white bg-brand-blue px-3 py-1.5 rounded-full hover:bg-brand-blue-dark shadow-sm hover:shadow transition-all"
                        >
                            Start Triage
                        </button>
                    ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-background-secondary text-text-secondary border border-border-color">
                            {patient.status}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(PatientCard);