import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon } from './icons';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    placeholder?: string;
    className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, placeholder = "Dictate...", className = "" }) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onTranscript(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            }
        }
    }, [onTranscript]);

    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return (
        <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-full transition-all duration-300 ${
                isListening 
                ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400' 
                : 'bg-background-tertiary text-text-tertiary hover:text-brand-blue hover:bg-brand-blue-light'
            } ${className}`}
            title={isListening ? "Listening..." : "Click to dictate"}
        >
            <MicrophoneIcon className="w-5 h-5" />
        </button>
    );
};

export default VoiceInput;