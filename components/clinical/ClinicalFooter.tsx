import React from 'react';
import { Button } from '../ui/button';
import { Save, ArrowRight, Sparkles } from 'lucide-react';

interface ClinicalFooterProps {
    onSave: () => void;
    isSaving?: boolean;
    lastSavedAt?: string | null;
}

export const ClinicalFooter: React.FC<ClinicalFooterProps> = ({
    onSave,
    isSaving = false,
    lastSavedAt
}) => {
    return (
        <div className="sticky bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 shadow-lg animate-in slide-in-from-bottom duration-300">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

                <div className="flex items-center gap-2 text-xs text-muted-foreground order-2 md:order-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-purple/70" />
                    <span>AI-assisted plan suggestions will be available in the next step</span>
                    {lastSavedAt && (
                        <>
                            <span className="mx-1">•</span>
                            <span>Draft saved {lastSavedAt}</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto order-1 md:order-2">
                    <Button
                        variant="outline"
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex-1 md:flex-none border-brand-blue/30 hover:bg-brand-blue/5 text-brand-blue hover:text-brand-blue"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>

                    <Button
                        disabled
                        className="flex-1 md:flex-none opacity-50 cursor-not-allowed"
                    >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
