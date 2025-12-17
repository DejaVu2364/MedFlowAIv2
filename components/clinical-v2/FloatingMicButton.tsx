import React from 'react';
import { Button } from '../ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FloatingMicButtonProps {
    isListening: boolean;
    isProcessing?: boolean;
    onClick: () => void;
    className?: string;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({
    isListening,
    isProcessing = false,
    onClick,
    className
}) => {
    return (
        <Button
            onClick={onClick}
            disabled={isProcessing}
            className={cn(
                "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl transition-all duration-300",
                "flex items-center justify-center",
                isListening
                    ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200/50"
                    : "bg-teal-600 hover:bg-teal-700 ring-2 ring-teal-200/30",
                isProcessing && "opacity-70",
                className
            )}
            size="icon"
        >
            {isProcessing ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isListening ? (
                <MicOff className="w-6 h-6 text-white" />
            ) : (
                <Mic className="w-6 h-6 text-white" />
            )}

            {/* Pulse rings when listening */}
            {isListening && !isProcessing && (
                <>
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
                    <span className="absolute inset-[-4px] rounded-full border-2 border-red-300 animate-pulse opacity-40" />
                </>
            )}
        </Button>
    );
};

export default FloatingMicButton;
