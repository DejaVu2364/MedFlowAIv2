import React from 'react';
import { cn } from '../../lib/utils';
import { useConnectionStatus, ServiceStatus } from '../../hooks/useConnectionStatus';
import { Loader2, Database, Sparkles, RefreshCw, Check, AlertTriangle, X } from 'lucide-react';

// Elegant mini status indicator for individual services
const ServiceIndicator: React.FC<{ status: ServiceStatus; icon: React.ElementType; label: string }> = ({
    status, icon: Icon, label
}) => {
    const configs: Record<ServiceStatus, { color: string; bg: string; text: string }> = {
        'connected': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'Connected' },
        'disconnected': { color: 'text-red-500', bg: 'bg-red-500/10', text: 'Offline' },
        'checking': { color: 'text-amber-500', bg: 'bg-amber-500/10', text: 'Checking...' },
        'no-key': { color: 'text-slate-400', bg: 'bg-slate-400/10', text: 'Not Configured' }
    };
    const config = configs[status];

    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                {status === 'connected' && <Check className="w-3 h-3 text-emerald-500" />}
                {status === 'disconnected' && <X className="w-3 h-3 text-red-500" />}
                {status === 'no-key' && <AlertTriangle className="w-3 h-3 text-slate-400" />}
                {status === 'checking' && <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />}
                <span className={cn("text-[10px] font-medium", config.color)}>{config.text}</span>
            </div>
        </div>
    );
};

export const ConnectionStatus: React.FC<{ className?: string }> = ({ className }) => {
    const { status, isChecking, refresh } = useConnectionStatus();

    // Elegant color configs with subtle glow
    const dotConfigs = {
        'online': {
            dot: 'bg-emerald-400',
            glow: 'shadow-[0_0_12px_3px_rgba(52,211,153,0.4)]',
            ring: 'ring-emerald-400/20',
            pulse: 'animate-pulse'
        },
        'degraded': {
            dot: 'bg-amber-400',
            glow: 'shadow-[0_0_12px_3px_rgba(251,191,36,0.4)]',
            ring: 'ring-amber-400/20',
            pulse: ''
        },
        'offline': {
            dot: 'bg-rose-400',
            glow: 'shadow-[0_0_12px_3px_rgba(251,113,133,0.4)]',
            ring: 'ring-rose-400/20',
            pulse: ''
        }
    };

    const config = dotConfigs[status.overall];

    return (
        <div className={cn("relative group", className)}>
            {/* Minimal Status Dot - No Text */}
            <button
                onClick={refresh}
                disabled={isChecking}
                className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-full",
                    "bg-white/60 dark:bg-slate-800/60 backdrop-blur-md",
                    "border border-slate-200/50 dark:border-slate-700/50",
                    "hover:bg-white/80 dark:hover:bg-slate-800/80",
                    "transition-all duration-300 ease-out",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500/50"
                )}
                aria-label={`System Status: ${status.overall}`}
            >
                {isChecking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                ) : (
                    <div className="relative">
                        {/* Outer glow ring */}
                        <div className={cn(
                            "absolute inset-0 rounded-full ring-4 transition-all duration-500",
                            config.ring,
                            status.overall === 'online' && "animate-ping opacity-30"
                        )} style={{ animationDuration: '3s' }} />
                        {/* Main dot */}
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            config.dot,
                            config.glow
                        )} />
                    </div>
                )}
            </button>

            {/* Premium Hover Card */}
            <div className={cn(
                "absolute right-0 top-full mt-3 w-64",
                "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                "border border-slate-200/80 dark:border-slate-700/80",
                "rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50",
                "p-4 opacity-0 invisible translate-y-2",
                "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
                "transition-all duration-200 ease-out z-50"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", config.dot, config.glow)} />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {status.overall === 'online' ? 'All Systems Go' :
                                status.overall === 'degraded' ? 'Partial Outage' : 'Offline'}
                        </span>
                    </div>
                    <button
                        onClick={refresh}
                        disabled={isChecking}
                        className={cn(
                            "p-1.5 rounded-lg",
                            "hover:bg-slate-100 dark:hover:bg-slate-800",
                            "transition-colors duration-150"
                        )}
                        title="Refresh"
                    >
                        <RefreshCw className={cn(
                            "w-3.5 h-3.5 text-slate-400",
                            isChecking && "animate-spin"
                        )} />
                    </button>
                </div>

                {/* Service List */}
                <div className="space-y-0.5">
                    <ServiceIndicator status={status.firebase} icon={Database} label="Firebase" />
                    <ServiceIndicator status={status.gemini} icon={Sparkles} label="Gemini 2.5" />
                </div>

                {/* Footer */}
                {status.lastChecked && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400">
                            Checked {status.lastChecked.toLocaleTimeString()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;
