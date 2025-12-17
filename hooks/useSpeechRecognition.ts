import { useState, useEffect, useRef, useCallback } from 'react';

type Language = 'en-IN' | 'hi-IN' | 'kn-IN';

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    language: Language;
    setLanguage: (lang: Language) => void;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    hasSupport: boolean;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [language, setLanguage] = useState<Language>('en-IN');
    const [hasSupport, setHasSupport] = useState(false);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setHasSupport(true);
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Intentionally false for simpler one-shot commands
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language;

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(prev => {
                        const spacer = prev ? ' ' : '';
                        return prev + spacer + finalTranscript;
                    });
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
        }
    }, []);

    // Update language dynamically
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language;
        }
    }, [language]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Failed to start speech recognition", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        language,
        setLanguage,
        startListening,
        stopListening,
        resetTranscript,
        hasSupport
    };
};
