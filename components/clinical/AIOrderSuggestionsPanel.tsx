import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Sparkles, PlusCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { suggestOrdersFromClinicalFile } from '../../services/geminiService';
import { ClinicalFileSections, Patient } from '../../types';
import { OrderSuggestionItem, SuggestedOrderDisplay } from '../orders/OrderSuggestionItem';
import { Separator } from '../ui/separator';
import { AILoadingSkeleton } from '../ui/AILoadingSkeleton';

interface AIOrderSuggestionsPanelProps {
    clinicalFileSections: ClinicalFileSections;
    onAddDraftOrders: (orders: any[]) => void;
}

export const AIOrderSuggestionsPanel: React.FC<AIOrderSuggestionsPanelProps> = ({
    clinicalFileSections,
    onAddDraftOrders
}) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleSuggest = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        setSelectedIndices(new Set());

        try {
            const results = await suggestOrdersFromClinicalFile(clinicalFileSections);
            setSuggestions(results);
            // Auto-select high confidence/priority items? No, explicitly Manual.

            if (results.length === 0) {
                addToast("AI analysis complete. No specific orders suggested.", "info");
            } else {
                addToast(`AI suggested ${results.length} draft orders.`, "success");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate order suggestions. Please try again.");
            addToast("Failed to generate suggestions", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setSelectedIndices(next);
    };

    const handleAddSelected = () => {
        const selectedOrders = suggestions.filter((_, i) => selectedIndices.has(i));
        if (selectedOrders.length === 0) return;

        onAddDraftOrders(selectedOrders);
        setSuggestions([]); // Clear after adding
        setSelectedIndices(new Set());
    };

    return (
        <Card className="border-brand-purple/20 bg-brand-purple/5 shadow-sm overflow-hidden mt-8 mb-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-purple/10 rounded-full text-brand-purple">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">AI Clinical Decision Support</h3>
                            <p className="text-xs text-muted-foreground">Analyze drafts to suggest investigations & meds</p>
                        </div>
                    </div>

                    {suggestions.length === 0 && !isLoading && (
                        <Button
                            onClick={handleSuggest}
                            disabled={isLoading}
                            variant="outline"
                            className="bg-background border-brand-purple/30 hover:bg-brand-purple/10 text-brand-purple gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            Suggest Orders
                        </Button>
                    )}
                </div>

                {isLoading && (
                    <AILoadingSkeleton
                        lines={4}
                        message="Analyzing clinical context & generating orders..."
                        className="border-brand-purple/20 from-brand-purple/5 to-indigo-50/50"
                    />
                )}

                {error && (
                    <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {suggestions.length > 0 && (
                    <div className="space-y-4">
                        <Separator className="bg-brand-purple/20" />

                        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                            {suggestions.map((s, i) => (
                                <OrderSuggestionItem
                                    key={i}
                                    suggestion={s}
                                    isSelected={selectedIndices.has(i)}
                                    onToggle={() => toggleSelection(i)}
                                />
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleAddSelected}
                                disabled={selectedIndices.size === 0}
                                className="gap-2 bg-brand-purple hover:bg-brand-purple/90"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Add {selectedIndices.size} Draft Orders
                            </Button>
                        </div>

                        <div className="text-[10px] text-center text-muted-foreground opacity-70">
                            Suggestions are based on your draft notes. Always verify clinically.
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};
