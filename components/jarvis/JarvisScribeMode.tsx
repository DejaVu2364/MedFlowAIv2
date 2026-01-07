// JarvisScribeMode.tsx - Integrated scribe mode for Jarvis
// Listens to doctor-patient conversations and extracts clinical data

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    Mic,
    Square,
    Loader2,
    Sparkles,
    Volume2,
    VolumeX,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { extractClinicalDataFromTranscript, ExtractionResult } from '../../services/jarvis/ClinicalExtractor';
import { ScribePreviewPanel } from './ScribePreviewPanel';
import { ClinicalFileSections, Patient } from '../../types';
import { usePatient } from '../../contexts/PatientContext';
import { useToast } from '../../contexts/ToastContext';

interface JarvisScribeModeProps {
    patient: Patient;
    onClose?: () => void;
    onApplied?: () => void;
}

type ScribeState = 'idle' | 'listening' | 'processing' | 'preview';

export const JarvisScribeMode: React.FC<JarvisScribeModeProps> = ({
    patient,
    onClose,
    onApplied
}) => {
    const [state, setState] = useState<ScribeState>('idle');
    const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const extractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTranscriptRef = useRef<string>('');

    const { updateClinicalFileSection } = usePatient();
    const { addToast } = useToast();

    const {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        hasSupport,
        language,
        setLanguage
    } = useSpeechRecognition();

    // Handle recording state changes
    useEffect(() => {
        if (isListening) {
            setState('listening');
        }
    }, [isListening]);

    // Debounced extraction - extract when user pauses speaking
    useEffect(() => {
        if (!isListening || !transcript || transcript === lastTranscriptRef.current) {
            return;
        }

        // Clear previous timeout
        if (extractionTimeoutRef.current) {
            clearTimeout(extractionTimeoutRef.current);
        }

        // Set new timeout for extraction after 3 seconds of no new speech
        extractionTimeoutRef.current = setTimeout(async () => {
            if (transcript.length > 50 && transcript !== lastTranscriptRef.current) {
                lastTranscriptRef.current = transcript;
                // Don't stop listening, just do background extraction
                // This provides real-time feedback
            }
        }, 3000);

        return () => {
            if (extractionTimeoutRef.current) {
                clearTimeout(extractionTimeoutRef.current);
            }
        };
    }, [transcript, isListening]);

    // Start scribe
    const handleStart = useCallback(() => {
        setError(null);
        resetTranscript();
        setExtractionResult(null);
        startListening();
        setState('listening');
    }, [resetTranscript, startListening]);

    // Stop and process
    const handleStop = useCallback(async () => {
        stopListening();

        if (!transcript || transcript.trim().length < 20) {
            setError('Not enough speech captured. Please try again.');
            setState('idle');
            return;
        }

        setState('processing');

        try {
            const result = await extractClinicalDataFromTranscript(transcript);
            setExtractionResult(result);
            setState('preview');
        } catch (err) {
            console.error('[JarvisScribe] Extraction failed:', err);
            setError('Failed to extract clinical data. Please try again.');
            setState('idle');
        }
    }, [stopListening, transcript]);

    // Reset
    const handleReset = useCallback(() => {
        stopListening();
        resetTranscript();
        setExtractionResult(null);
        setState('idle');
        setError(null);
    }, [stopListening, resetTranscript]);

    // Apply extracted data to clinical file
    const handleApply = useCallback((data: Partial<ClinicalFileSections>) => {
        if (data.history) {
            updateClinicalFileSection(patient.id, 'history', data.history);
        }
        if (data.gpe) {
            updateClinicalFileSection(patient.id, 'gpe', data.gpe);
        }
        if (data.systemic) {
            updateClinicalFileSection(patient.id, 'systemic', data.systemic);
        }

        addToast('Clinical data applied successfully', 'success');
        handleReset();
        onApplied?.();
    }, [patient.id, updateClinicalFileSection, addToast, handleReset, onApplied]);

    // Handle ask question
    const handleAskQuestion = useCallback((question: string) => {
        // Add question to conversation context
        addToast(`Suggested question: "${question}"`, 'info');
        // In a more advanced version, this could trigger TTS
    }, [addToast]);

    // Language toggle
    const languageOptions = [
        { value: 'en-IN', label: 'English' },
        { value: 'hi-IN', label: 'हिंदी' },
        { value: 'kn-IN', label: 'ಕನ್ನಡ' }
    ];

    if (!hasSupport) {
        return (
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="w-5 h-5" />
                        <p>Speech recognition is not supported in this browser. Please use Chrome or Edge.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Scribe Card */}
            <Card className={cn(
                "border-2 transition-colors duration-300",
                state === 'listening' && "border-red-300 bg-red-50/30",
                state === 'processing' && "border-amber-300 bg-amber-50/30",
                state === 'preview' && "border-teal-300 bg-teal-50/30",
                state === 'idle' && "border-slate-200"
            )}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-teal-600" />
                            Jarvis Scribe
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {/* Language Selector */}
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as any)}
                                disabled={state !== 'idle'}
                                className="text-xs h-7 px-2 rounded border border-input"
                            >
                                {languageOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

                            {state === 'listening' && (
                                <Badge variant="destructive" className="animate-pulse gap-1">
                                    <Mic className="w-3 h-3" /> Recording
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Status Display */}
                    <div className="flex items-center gap-4">
                        {/* Mic Indicator */}
                        <div className={cn(
                            "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300",
                            state === 'idle' && "bg-slate-100 text-slate-400",
                            state === 'listening' && "bg-red-100 text-red-600 animate-pulse",
                            state === 'processing' && "bg-amber-100 text-amber-600",
                            state === 'preview' && "bg-teal-100 text-teal-600"
                        )}>
                            {state === 'processing' ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : state === 'listening' ? (
                                <Volume2 className="w-8 h-8 animate-pulse" />
                            ) : (
                                <Mic className="w-8 h-8" />
                            )}
                        </div>

                        {/* Status Text */}
                        <div className="flex-1">
                            <p className="font-medium">
                                {state === 'idle' && 'Ready to record'}
                                {state === 'listening' && 'Listening... Speak clearly'}
                                {state === 'processing' && 'Processing with AI...'}
                                {state === 'preview' && 'Review extracted data'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {state === 'idle' && 'Click Start to begin capturing conversation'}
                                {state === 'listening' && `${transcript.split(' ').length} words captured`}
                                {state === 'processing' && 'Jarvis is analyzing the conversation'}
                                {state === 'preview' && 'Edit and apply to clinical file'}
                            </p>
                        </div>
                    </div>

                    {/* Transcript Preview (while listening) */}
                    {state === 'listening' && transcript && (
                        <div className="p-3 bg-slate-50 rounded-md border max-h-32 overflow-y-auto">
                            <p className="text-sm font-mono text-slate-700">{transcript}</p>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {state === 'idle' && (
                            <Button
                                onClick={handleStart}
                                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white flex-1"
                            >
                                <Mic className="w-4 h-4" />
                                Start Scribe
                            </Button>
                        )}

                        {state === 'listening' && (
                            <>
                                <Button
                                    onClick={handleStop}
                                    variant="destructive"
                                    className="gap-2 flex-1"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                    Stop & Process
                                </Button>
                                <Button
                                    onClick={handleReset}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reset
                                </Button>
                            </>
                        )}

                        {state === 'processing' && (
                            <Button disabled className="gap-2 flex-1">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Preview Panel */}
            {state === 'preview' && extractionResult && (
                <ScribePreviewPanel
                    extractedData={extractionResult.extractedFields}
                    missingFields={extractionResult.missingFields}
                    suggestedQuestions={extractionResult.suggestedQuestions}
                    confidence={extractionResult.confidence}
                    onApply={handleApply}
                    onDiscard={handleReset}
                    onAskQuestion={handleAskQuestion}
                />
            )}
        </div>
    );
};

export default JarvisScribeMode;
