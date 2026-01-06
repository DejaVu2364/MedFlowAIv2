import React, { createContext, useContext, ReactNode } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useVitalsMonitor, VitalsAlert } from '../hooks/useVitalsMonitor';

interface VitalsMonitorContextType {
    alerts: VitalsAlert[];
    criticalCount: number;
    warningCount: number;
}

const VitalsMonitorContext = createContext<VitalsMonitorContextType | null>(null);

export const useVitalsAlerts = () => {
    const context = useContext(VitalsMonitorContext);
    return context || { alerts: [], criticalCount: 0, warningCount: 0 };
};

/**
 * Provider component that monitors patient vitals across the application
 * Places alerts through the toast system when thresholds are breached
 */
export const VitalsMonitorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { patients } = usePatient();
    const { alerts } = useVitalsMonitor(patients);

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    return (
        <VitalsMonitorContext.Provider value={{ alerts, criticalCount, warningCount }}>
            {children}
        </VitalsMonitorContext.Provider>
    );
};

export default VitalsMonitorProvider;
