import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, Info } from 'lucide-react';
import { OrderCategory } from '../../types';

export interface SuggestedOrderDisplay {
    label: string;
    category: OrderCategory;
    priority: 'routine' | 'urgent' | 'STAT';
    reason?: string;
    ai_provenance?: {
        rationale: string | null;
    };
}

interface OrderSuggestionItemProps {
    suggestion: SuggestedOrderDisplay;
    isSelected: boolean;
    onToggle: () => void;
}

export const OrderSuggestionItem: React.FC<OrderSuggestionItemProps> = ({
    suggestion,
    isSelected,
    onToggle
}) => {
    return (
        <div
            className={`flex items-start gap-3 p-3 rounded-md border transition-colors cursor-pointer ${isSelected
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border/40 hover:bg-muted/30'
                }`}
            onClick={onToggle}
        >
            <Checkbox
                checked={isSelected}
                onCheckedChange={onToggle}
                className="mt-1"
            />

            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">
                        {suggestion.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize bg-background">
                        {suggestion.category}
                    </Badge>
                </div>

                {suggestion.ai_provenance?.rationale && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/20 p-1.5 rounded">
                        <Info className="w-3 h-3 mt-0.5 shrink-0 text-brand-blue" />
                        <span>{suggestion.ai_provenance.rationale}</span>
                    </div>
                )}
            </div>

            {suggestion.priority === 'urgent' || suggestion.priority === 'STAT' ? (
                <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                    {suggestion.priority}
                </Badge>
            ) : null}
        </div>
    );
};
