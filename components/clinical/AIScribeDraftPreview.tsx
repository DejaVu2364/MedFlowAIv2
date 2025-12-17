import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, Trash2, RefreshCcw, FileCheck } from 'lucide-react';
import { Separator } from '../ui/separator';

export interface SOAPDraft {
    s: string;
    o: string;
    a: string;
    p: string;
}

interface AIScribeDraftPreviewProps {
    draft: SOAPDraft;
    onDiscard: () => void;
    onRerecord: () => void;
    onAccept: () => void; // Phase 2C placeholder
}

export const AIScribeDraftPreview: React.FC<AIScribeDraftPreviewProps> = ({
    draft,
    onDiscard,
    onRerecord,
    onAccept
}) => {
    return (
        <Card className="mt-6 border-yellow-500/30 bg-yellow-50/10 animate-in fade-in slide-in-from-top-4">
            {/* Disclaimer Banner */}
            <div className="bg-yellow-500/10 px-4 py-2 border-b border-yellow-500/20 flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">AI-generated draft. Please verify clinically before accepting.</span>
            </div>

            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <section>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Subjective</h4>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{draft.s}</p>
                    </section>

                    <Separator className="bg-border/40" />

                    <section>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Objective</h4>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{draft.o}</p>
                    </section>

                    <Separator className="bg-border/40" />

                    <section>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Assessment</h4>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{draft.a}</p>
                    </section>

                    <Separator className="bg-border/40" />

                    <section>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Plan</h4>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{draft.p}</p>
                    </section>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDiscard}
                        className="text-muted-foreground hover:text-destructive w-full sm:w-auto"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Discard
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRerecord}
                        className="w-full sm:w-auto"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Re-record
                    </Button>

                    <Button
                        size="sm"
                        onClick={onAccept}
                        className="w-full sm:w-auto gap-2 bg-brand-blue hover:bg-brand-blue/90"
                        title="Accept and populate clinical fields"
                    >
                        <FileCheck className="w-4 h-4" />
                        Accept & Create Note
                    </Button>
                </div>
            </div>
        </Card>
    );
};
