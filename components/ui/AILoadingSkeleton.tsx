import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AILoadingSkeletonProps {
    className?: string;
    lines?: number;
    message?: string;
}

/**
 * Skeleton loading component for AI operations
 * Shows animated pulse effect while AI is generating content
 */
export const AILoadingSkeleton: React.FC<AILoadingSkeletonProps> = ({
    className,
    lines = 3,
    message = "AI is thinking..."
}) => {
    return (
        <div className={cn(
            "p-4 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50/50 to-cyan-50/50",
            className
        )}>
            <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <div className="absolute inset-0 animate-ping">
                        <Sparkles className="w-4 h-4 text-teal-600 opacity-50" />
                    </div>
                </div>
                <span className="text-sm font-medium text-teal-700">{message}</span>
                <Loader2 className="w-3 h-3 text-teal-600 animate-spin ml-auto" />
            </div>
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-3 rounded-full bg-gradient-to-r from-teal-100 to-teal-200 animate-pulse",
                            i === lines - 1 && "w-3/4"
                        )}
                        style={{ animationDelay: `${i * 150}ms` }}
                    />
                ))}
            </div>
        </div>
    );
};

interface AILoadingInlineProps {
    className?: string;
    text?: string;
}

/**
 * Inline loading indicator for AI operations
 * Shows a compact loader next to buttons/inputs
 */
export const AILoadingInline: React.FC<AILoadingInlineProps> = ({
    className,
    text = "Processing..."
}) => {
    return (
        <div className={cn("flex items-center gap-2 text-sm text-teal-600", className)}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="animate-pulse">{text}</span>
        </div>
    );
};

interface AILoadingOverlayProps {
    isLoading: boolean;
    message?: string;
    children: React.ReactNode;
}

/**
 * Overlay wrapper that shows loading state over content
 */
export const AILoadingOverlay: React.FC<AILoadingOverlayProps> = ({
    isLoading,
    message = "AI generating...",
    children
}) => {
    return (
        <div className="relative">
            {children}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <Sparkles className="w-8 h-8 text-teal-500" />
                            <div className="absolute inset-0 animate-ping">
                                <Sparkles className="w-8 h-8 text-teal-500 opacity-30" />
                            </div>
                        </div>
                        <span className="text-sm font-medium text-teal-700 animate-pulse">{message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AILoadingSkeleton;
