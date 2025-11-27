import React, { useState } from 'react';
import { VitalsMeasurements } from '../../types';

interface VitalsInputCardProps {
    onSave: (vitals: VitalsMeasurements) => void;
    isLoading?: boolean;
}

const VitalsInputCard: React.FC<VitalsInputCardProps> = ({ onSave, isLoading }) => {
    const [vitals, setVitals] = useState<VitalsMeasurements>({
        pulse: null,
        spo2: null,
        rr: null,
        temp_c: null,
        bp_sys: null,
        bp_dia: null,
        pain_score: null
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVitals(prev => ({
            ...prev,
            [name]: value === '' ? null : parseFloat(value)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(vitals);
        // Optional: clear form or keep for "Add Another" logic
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Vitals Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Heart Rate</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="pulse"
                                value={vitals.pulse ?? ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                placeholder="bpm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SpO₂</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="spo2"
                                value={vitals.spo2 ?? ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                placeholder="%"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Resp. Rate</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="rr"
                                value={vitals.rr ?? ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                placeholder="/min"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Temp (°C)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="temp_c"
                                step="0.1"
                                value={vitals.temp_c ?? ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                placeholder="°C"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">BP (Sys)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="bp_sys"
                                value={vitals.bp_sys ?? ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                placeholder="mmHg"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">BP (Dia)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="bp_dia"
                                value={vitals.bp_dia ?? ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                placeholder="mmHg"
                            />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pain Score (0-10)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="pain_score"
                                min="0"
                                max="10"
                                value={vitals.pain_score ?? ''}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                placeholder="0-10"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VitalsInputCard;
