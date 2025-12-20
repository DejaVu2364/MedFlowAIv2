import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface DoctorProfile {
    name: string;
    displayName: string;
    specialty: string;
    preferences: {
        commonOrders: string[];
        verbosity: 'concise' | 'detailed';
    };
}

/**
 * Hook to get the current doctor's profile.
 * Combines auth data with clinical preferences.
 * 
 * Future: Fetch preferences from Firestore based on user ID.
 */
export const useDoctorProfile = (): DoctorProfile => {
    const { currentUser } = useAuth();

    const profile = useMemo((): DoctorProfile => {
        const baseName = currentUser?.name || 'Sharma';
        const displayName = baseName.startsWith('Dr.') ? baseName : `Dr. ${baseName}`;

        return {
            name: displayName, // Used in greetings and orders
            displayName,
            specialty: 'Internal Medicine', // TODO: Fetch from Firestore
            preferences: {
                commonOrders: ['CBC', 'LFT', 'RFT', 'Chest X-ray', 'ECG'],
                verbosity: 'concise'
            }
        };
    }, [currentUser?.name]);

    return profile;
};

export default useDoctorProfile;
