import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Sparkles, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { Patient, DischargeSummary } from '../../types';
import { generateStructuredDischargeSummary } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';

interface AIDischargeSummaryPanelProps {
    patient: Patient;
    onDraftGenerated: (draft: Partial<DischargeSummary>) => void;
}

export const AIDischargeSummaryPanel: React.FC<AIDischargeSummaryPanelProps> = ({
    patient,
    onDraftGenerated
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { addToast } = useToast();

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateStructuredDischargeSummary(patient);

            // Pass draft back to parent (Memory only, no DB write)
            onDraftGenerated(result);

            addToast("AI Draft generated. Please review and edit.", "success");
        } catch (error) {
            console.error(error);
            addToast("Failed to generate discharge summary.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 space-y-4">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    AI Assistant
                </div>
                <p className="text-xs text-muted-foreground">
                    Generate a structured discharge summary based on clinical file, orders, and rounds.
                </p>
            </div>

            <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
                size="sm"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Drafting...
                    </>
                ) : (
                    <>
                        <FileText className="w-4 h-4" />
                        Generate AI Draft
                    </>
                )}
            </Button>

            <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-900/50">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                    AI-generated draft. Must be reviewed clinically before finalization. Not auto-saved.
                </span>
            </div>
        </div>
    );
};
