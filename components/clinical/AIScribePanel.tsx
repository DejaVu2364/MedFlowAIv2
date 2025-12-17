import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Mic, Square, Loader2, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { AIScribeDraftPreview, SOAPDraft } from './AIScribeDraftPreview';
import { generateSOAPFromTranscript } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';

type ScribeState = 'idle' | 'listening' | 'stopped' | 'processing' | 'review';

interface AIScribePanelProps {
    onDraftAccepted?: (draft: SOAPDraft) => void;
}

export const AIScribePanel: React.FC<AIScribePanelProps> = ({ onDraftAccepted }) => {
    const [status, setStatus] = useState<ScribeState>('idle');
    const [draft, setDraft] = useState<SOAPDraft | null>(null);
    const {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript
    } = useSpeechRecognition();
    const { addToast } = useToast();

    const handleStart = useCallback(() => {
        resetTranscript();
        setDraft(null);
        startListening();
        setStatus('listening');
    }, [resetTranscript, startListening]);

    const handleStop = useCallback(() => {
        stopListening();
        setStatus('stopped');
    }, [stopListening]);

    const handleGenerate = useCallback(async () => {
        if (!transcript.trim()) {
            addToast("No transcript captured. Please speak clearly.", "info");
            return;
        }

        setStatus('processing');
        try {
            const { data } = await generateSOAPFromTranscript(transcript);
            setDraft({
                s: data.s,
                o: data.o,
                a: data.a,
                p: data.p
            });
            setStatus('review');
            addToast("Draft generated. Please review.", "success");
        } catch (error) {
            console.error("Failed to generate draft:", error);
            addToast("Failed to generate draft. Please try again.", "error");
            setStatus('stopped');
        }
    }, [transcript, addToast]);

    const handleDiscard = useCallback(() => {
        setDraft(null);
        resetTranscript();
        setStatus('idle');
    }, [resetTranscript]);

    const handleRerecord = useCallback(() => {
        handleDiscard();
        // Optional: immediately start? Let's keep it safe and just go to idle.
    }, [handleDiscard]);

    return (
        <div className="space-y-4">
            <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Status Indicator & Label */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300",
                            status === 'idle' && "bg-muted text-muted-foreground",
                            status === 'listening' && "bg-red-500/10 text-red-500 animate-pulse",
                            status === 'stopped' && "bg-teal-500/10 text-teal-600",
                            status === 'processing' && "bg-yellow-500/10 text-yellow-600",
                            status === 'review' && "bg-green-500/10 text-green-600"
                        )}>
                            {status === 'idle' && <Mic className="w-5 h-5" />}
                            {status === 'listening' && <Mic className="w-6 h-6 animate-pulse" />}
                            {status === 'stopped' && <Mic className="w-5 h-5" />}
                            {status === 'processing' && <Loader2 className="w-6 h-6 animate-spin" />}
                            {status === 'review' && <FileText className="w-6 h-6" />}
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">AI Clinical Scribe</h3>
                                {status === 'listening' && <Badge variant="destructive" className="animate-pulse">Live</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {status === 'idle' && "Ready to record session"}
                                {status === 'listening' && "Listening... (Speak clearly)"}
                                {status === 'stopped' && "Recording paused. Ready to generate."}
                                {status === 'processing' && "Processing clinical notes..."}
                                {status === 'review' && "Draft notes ready for review"}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {status === 'idle' && (
                            <Button onClick={handleStart} className="w-full md:w-auto gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                                <Mic className="w-4 h-4" />
                                Start Scribe
                            </Button>
                        )}

                        {status === 'listening' && (
                            <Button variant="destructive" onClick={handleStop} className="w-full md:w-auto gap-2">
                                <Square className="w-4 h-4 fill-current" />
                                Stop Scribe
                            </Button>
                        )}

                        {status === 'stopped' && (
                            <>
                                <Button variant="outline" onClick={handleRerecord} className="w-full md:w-auto gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Reset
                                </Button>
                                <Button onClick={handleGenerate} className="w-full md:w-auto gap-2" disabled={!transcript}>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Draft
                                </Button>
                            </>
                        )}

                        {/* While processing or reviewing, controls are hidden or inside preview */}
                    </div>
                </div>

                {/* Transcript Preview (While listening/stopped) */}
                {(status === 'listening' || status === 'stopped') && transcript && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                        <div className="bg-muted/30 rounded-md p-3 text-sm text-muted-foreground font-mono max-h-32 overflow-y-auto border border-border/50">
                            {transcript}
                        </div>
                    </div>
                )}

                {/* Trust Footer */}
                <div className="bg-muted/30 px-4 py-2 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>AI listens only when you start it and always requires your review.</span>
                </div>
            </Card>

            {/* Draft Preview Section */}
            {status === 'review' && draft && (
                <AIScribeDraftPreview
                    draft={draft}
                    onDiscard={handleDiscard}
                    onRerecord={handleRerecord}
                    onAccept={() => {
                        if (onDraftAccepted) {
                            onDraftAccepted(draft);
                            setStatus('idle'); // Reset panel after accepting
                            setDraft(null);
                        }
                    }}
                />
            )}
        </div>
    );
};
