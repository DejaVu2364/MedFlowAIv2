import React from 'react';
import { Patient } from '../../types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface VitalsPageHeaderProps {
    patient: Patient;
}

const VitalsPageHeader: React.FC<VitalsPageHeaderProps> = ({ patient }) => {
    const navigate = useNavigate();

    return (
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                {patient.name}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span>{patient.age}y / {patient.gender}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                <span>UHID: {patient.id.split('-')[1]}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                <span>Admitted: {new Date(patient.registrationTime).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            Notes
                        </button>
                        <button className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            Orders
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                            Add Vitals
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VitalsPageHeader;
