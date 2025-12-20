import React from 'react';
import { useParams } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Separator } from '../components/ui/separator';

const DischargePrintView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { patients } = usePatient();
    const patient = patients.find(p => p.id === id);

    if (!patient || !patient.dischargeSummary) {
        return <div className="p-10 text-center">Loading or No Discharge Summary Found...</div>;
    }

    const summary = patient.dischargeSummary;

    return (
        <div className="max-w-[210mm] mx-auto bg-white min-h-screen p-[20mm] text-slate-900 print:p-0 print:max-w-none font-serif">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-4 border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-slate-900 text-white flex items-center justify-center rounded-lg print:border print:border-slate-900 print:text-slate-900 print:bg-white">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-900">MedFlow</h1>
                        <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">General Hospital</p>
                        <p className="text-xs text-slate-500 mt-1">JJMMC Hospital, Davangere, Karnataka</p>
                        <p className="text-xs text-slate-500">Ph: +91-8192-123456 • Web: medflow.hospital</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-slate-900 uppercase">Discharge Summary</h2>
                    <div className="mt-2 text-sm space-y-1">
                        <p><span className="font-semibold text-slate-600">UHID:</span> {patient.id}</p>
                        <p><span className="font-semibold text-slate-600">Date:</span> {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Patient Demographics Box */}
            <div className="border border-slate-300 rounded-lg p-4 mb-8 bg-slate-50 print:bg-white print:border-slate-400">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Patient Name</span>
                        <span className="font-bold">{patient.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Age / Gender</span>
                        <span>{patient.age} yrs / {patient.gender}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Admission Date</span>
                        <span>{new Date(patient.registrationTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Discharge Date</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Consultant In-Charge</span>
                        <span>Dr. Harikrishnan S (General Medicine)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-semibold text-slate-600">Ward / Bed</span>
                        <span>Ward A / Bed 04</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="space-y-8">
                <section className="break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase border-b-2 border-slate-800 mb-3 text-slate-800 tracking-wider">Final Diagnosis</h3>
                    <p className="text-lg font-semibold text-slate-900">{summary.finalDiagnosis}</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                    <section className="break-inside-avoid">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-slate-600 tracking-wide">Condition at Discharge</h3>
                        <p className="text-sm leading-relaxed">{summary.conditionAtDischarge}</p>
                    </section>
                    <section className="break-inside-avoid">
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-slate-600 tracking-wide">Allergies</h3>
                        {patient.clinicalFile.sections.history?.allergy_history?.length ? (
                            <ul className="list-disc list-inside text-sm text-red-700 font-medium">
                                {patient.clinicalFile.sections.history.allergy_history.map((a, i) => (
                                    <li key={i}>{a.substance} ({a.reaction})</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No known allergies.</p>
                        )}
                    </section>
                </div>

                <section className="break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-slate-600 tracking-wide">Brief History & Hospital Course</h3>
                    <div className="text-sm leading-relaxed space-y-2 text-justify">
                        <p>{summary.briefHistory}</p>
                        <p>{summary.courseInHospital}</p>
                    </div>
                </section>

                <section className="break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-slate-600 tracking-wide">Significant Investigations</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.investigationsSummary || "See attached lab reports."}</p>
                </section>

                <section className="break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-slate-600 tracking-wide">Procedures / Treatment Given</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.treatmentGiven}</p>
                </section>

                <section className="break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase border-b-2 border-slate-800 mb-4 text-slate-800 tracking-wider">Discharge Medications</h3>
                    <table className="w-full text-sm text-left border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 print:bg-slate-50">
                                <th className="py-2 px-3 border-r border-slate-300 font-bold w-1/4">Drug Name</th>
                                <th className="py-2 px-3 border-r border-slate-300 font-bold w-1/6">Dosage</th>
                                <th className="py-2 px-3 border-r border-slate-300 font-bold w-1/6">Frequency</th>
                                <th className="py-2 px-3 border-r border-slate-300 font-bold w-1/6">Duration</th>
                                <th className="py-2 px-3 font-bold">Instructions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.dischargeMeds?.map((med, i) => (
                                <tr key={i} className="border-b border-slate-200">
                                    <td className="py-2 px-3 border-r border-slate-200 font-semibold">{med.name}</td>
                                    <td className="py-2 px-3 border-r border-slate-200">{med.dosage}</td>
                                    <td className="py-2 px-3 border-r border-slate-200">{med.frequency}</td>
                                    <td className="py-2 px-3 border-r border-slate-200">{med.duration}</td>
                                    <td className="py-2 px-3 text-slate-600 italic">{med.instructions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 break-inside-avoid">
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-slate-600 tracking-wide">Follow Up Instructions</h3>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{summary.followUpInstructions}</p>
                    </section>
                    <section>
                        <h3 className="text-sm font-bold uppercase border-b border-slate-300 mb-2 text-slate-600 tracking-wide">Diet & Activity Advice</h3>
                        <div className="space-y-1">
                            <p className="text-sm"><span className="font-semibold">Diet:</span> {summary.dietAdvice}</p>
                            <p className="text-sm"><span className="font-semibold">Activity:</span> {summary.activityAdvice}</p>
                        </div>
                    </section>
                </div>

                {summary.emergencyWarnings && (
                    <section className="border-2 border-red-100 bg-red-50 p-4 rounded-lg print:border-red-200 break-inside-avoid">
                        <h3 className="text-sm font-bold uppercase text-red-800 mb-1 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Emergency Warnings
                        </h3>
                        <p className="text-sm text-red-900 font-medium">{summary.emergencyWarnings}</p>
                    </section>
                )}
            </div>

            {/* Footer / Signatures */}
            <div className="mt-20 pt-8 border-t-2 border-slate-800 flex justify-between items-end break-inside-avoid">
                <div className="text-xs text-slate-500 space-y-1">
                    <p>Generated by MedFlow AI EMR System</p>
                    <p>Printed on: {new Date().toLocaleString()}</p>
                    <p>Page 1 of 1</p>
                </div>
                <div className="flex gap-16">
                    <div className="text-center">
                        <div className="h-16 w-40 mb-2 flex items-end justify-center">
                            {/* Placeholder for digital signature */}
                            <span className="font-script text-2xl text-blue-900">Harikrishnan S</span>
                        </div>
                        <div className="border-t border-slate-400 w-40 pt-1">
                            <p className="text-sm font-bold uppercase">Dr. Harikrishnan S</p>
                            <p className="text-xs text-slate-500">MBBS, General Medicine</p>
                            <p className="text-xs text-slate-500">Reg No: KA-12345</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Button (Hidden in Print) */}
            <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="bg-slate-200 text-slate-800 px-6 py-3 rounded-full shadow-lg font-bold hover:bg-slate-300 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={() => window.print()}
                    className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Summary
                </button>
            </div>
        </div>
    );
};

export default DischargePrintView;
