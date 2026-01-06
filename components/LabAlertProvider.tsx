import React, { createContext, useContext, ReactNode } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useLabResultMonitor, LabAlert } from '../hooks/useLabResultMonitor';

interface LabAlertContextType {
    alerts: LabAlert[];
    criticalCount: number;
    warningCount: number;
    totalUnacknowledged: number;
    acknowledgeAlert: (alertId: string) => void;
    acknowledgeAll: () => void;
}

const LabAlertContext = createContext<LabAlertContextType | null>(null);

export const useLabAlerts = () => {
    const context = useContext(LabAlertContext);
    return context || {
        alerts: [],
        criticalCount: 0,
        warningCount: 0,
        totalUnacknowledged: 0,
        acknowledgeAlert: () => { },
        acknowledgeAll: () => { }
    };
};

/**
 * Enterprise Lab Alert Provider
 * Monitors all patients for abnormal lab results and provides alert context
 */
export const LabAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { patients } = usePatient();
    const labMonitor = useLabResultMonitor(patients);

    return (
        <LabAlertContext.Provider value={labMonitor}>
            {children}
        </LabAlertContext.Provider>
    );
};

export default LabAlertProvider;
