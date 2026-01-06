import React, { useState } from 'react';
import { Bell, AlertTriangle, X, Check, ChevronDown } from 'lucide-react';
import { useLabAlerts } from './LabAlertProvider';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';

interface AlertBadgeProps {
    className?: string;
    showDropdown?: boolean;
}

/**
 * Enterprise Alert Badge Component
 * Shows lab alert count with dropdown for alert details
 */
export const AlertBadge: React.FC<AlertBadgeProps> = ({
    className,
    showDropdown = true
}) => {
    const {
        alerts,
        criticalCount,
        warningCount,
        totalUnacknowledged,
        acknowledgeAlert,
        acknowledgeAll
    } = useLabAlerts();

    const hasCritical = criticalCount > 0;
    const hasAlerts = totalUnacknowledged > 0;

    const BadgeContent = (
        <div className={cn(
            "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all",
            hasCritical
                ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200"
                : hasAlerts
                    ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200",
            className
        )}>
            <Bell className={cn(
                "w-4 h-4",
                hasCritical && "animate-pulse"
            )} />
            <span className="text-sm font-medium">Alerts</span>
            {hasAlerts && (
                <Badge
                    variant="destructive"
                    className={cn(
                        "ml-1 h-5 min-w-[20px] px-1.5 text-xs",
                        !hasCritical && "bg-amber-500"
                    )}
                >
                    {totalUnacknowledged}
                </Badge>
            )}
            {hasCritical && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
        </div>
    );

    if (!showDropdown) return BadgeContent;

    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
    const recentAlerts = unacknowledgedAlerts.slice(0, 10);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {BadgeContent}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Lab Alerts
                    </span>
                    {hasAlerts && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                acknowledgeAll();
                            }}
                        >
                            <Check className="w-3 h-3 mr-1" />
                            Clear All
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {!hasAlerts ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No pending alerts
                    </div>
                ) : (
                    <ScrollArea className="max-h-[300px]">
                        {recentAlerts.map((alert) => (
                            <DropdownMenuItem
                                key={alert.id}
                                className={cn(
                                    "flex items-start gap-3 p-3 cursor-pointer",
                                    alert.severity === 'critical' && "bg-red-50"
                                )}
                            >
                                <div className={cn(
                                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                    alert.severity === 'critical' ? "bg-red-500" : "bg-amber-500"
                                )} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {alert.patientName}
                                    </p>
                                    <p className={cn(
                                        "text-xs",
                                        alert.severity === 'critical' ? "text-red-600" : "text-amber-600"
                                    )}>
                                        {alert.resultName}: {alert.value}
                                        <span className="ml-1 uppercase font-semibold">
                                            ({alert.direction})
                                        </span>
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        acknowledgeAlert(alert.id);
                                    }}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </DropdownMenuItem>
                        ))}
                        {unacknowledgedAlerts.length > 10 && (
                            <div className="p-2 text-center text-xs text-muted-foreground border-t">
                                +{unacknowledgedAlerts.length - 10} more alerts
                            </div>
                        )}
                    </ScrollArea>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AlertBadge;
