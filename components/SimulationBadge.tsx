import React from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '../lib/utils';

interface SimulationBadgeProps {
    className?: string;
}

/**
 * Badge component indicating the app is running with synthetic/demo data
 * Displays prominently to distinguish from production environments
 */
export const SimulationBadge: React.FC<SimulationBadgeProps> = ({ className }) => {
    return (
        <div className={cn(
            "fixed top-2 right-2 z-50",
            "flex items-center gap-1.5 px-2.5 py-1",
            "bg-gradient-to-r from-orange-500/90 to-amber-500/90",
            "text-white text-[10px] font-bold uppercase tracking-wider",
            "rounded-full shadow-lg backdrop-blur-sm",
            "border border-orange-400/50",
            "animate-pulse",
            className
        )}>
            <FlaskConical className="w-3 h-3" />
            <span>Simulation Mode</span>
        </div>
    );
};

export default SimulationBadge;
