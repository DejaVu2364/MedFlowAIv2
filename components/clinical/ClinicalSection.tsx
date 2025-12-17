import React from 'react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface ClinicalSectionProps {
    title: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    helperText?: string;
    className?: string;
    readOnly?: boolean;
}

export const ClinicalSection: React.FC<ClinicalSectionProps> = ({
    title,
    placeholder,
    value,
    onChange,
    helperText,
    className,
    readOnly = false
}) => {
    return (
        <Card className={cn("p-4 border-border/60 shadow-sm bg-card", className)}>
            <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                    {title}
                </h3>

                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={cn(
                        "w-full min-h-[120px] resize-none bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-muted-foreground/50",
                        readOnly && "opacity-80 cursor-default"
                    )}
                />

                {helperText && (
                    <p className="text-xs text-muted-foreground italic">
                        {helperText}
                    </p>
                )}
            </div>
        </Card>
    );
};
