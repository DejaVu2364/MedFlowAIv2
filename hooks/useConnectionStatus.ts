import { useState, useEffect, useCallback } from 'react';
import { getIsFirebaseInitialized } from '../services/firebase';
import { getGeminiApiKeyStatus, checkGeminiConnection } from '../services/geminiService';

export type ServiceStatus = 'connected' | 'disconnected' | 'checking' | 'no-key';

export interface ConnectionStatus {
    firebase: ServiceStatus;
    gemini: ServiceStatus;
    overall: 'online' | 'degraded' | 'offline';
    lastChecked: Date | null;
}

const initialStatus: ConnectionStatus = {
    firebase: 'checking',
    gemini: 'checking',
    overall: 'offline',
    lastChecked: null
};

export const useConnectionStatus = () => {
    const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
    const [isChecking, setIsChecking] = useState(false);

    const checkConnections = useCallback(async () => {
        setIsChecking(true);

        // Check Firebase (sync)
        const firebaseStatus: ServiceStatus = getIsFirebaseInitialized() ? 'connected' : 'disconnected';

        // Check Gemini API key first (sync)
        const geminiKeyStatus = getGeminiApiKeyStatus();
        let geminiStatus: ServiceStatus = geminiKeyStatus === 'missing' ? 'no-key' : 'checking';

        // Update with initial status
        setStatus(prev => ({ ...prev, firebase: firebaseStatus, gemini: geminiStatus }));

        // If API key exists, ping Gemini (async)
        if (geminiKeyStatus === 'configured') {
            try {
                const result = await checkGeminiConnection();
                geminiStatus = result.connected ? 'connected' : 'disconnected';
            } catch {
                geminiStatus = 'disconnected';
            }
        }

        // Calculate overall status
        let overall: 'online' | 'degraded' | 'offline' = 'offline';
        if (geminiStatus === 'connected' && firebaseStatus === 'connected') {
            overall = 'online';
        } else if (geminiStatus === 'connected' || firebaseStatus === 'connected') {
            overall = 'degraded';
        }

        setStatus({
            firebase: firebaseStatus,
            gemini: geminiStatus,
            overall,
            lastChecked: new Date()
        });
        setIsChecking(false);
    }, []);

    // Check on mount
    useEffect(() => {
        checkConnections();
    }, [checkConnections]);

    return { status, isChecking, refresh: checkConnections };
};

export default useConnectionStatus;
