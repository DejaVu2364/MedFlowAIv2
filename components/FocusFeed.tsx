import React, { useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { deriveFocusGroups, FocusGroup } from '../utils/dashboardLogicV2';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, CheckSquare, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const FocusFeed: React.FC = () => {
    const { patients } = usePatient();
    const navigate = useNavigate();

    const groups = useMemo(() => deriveFocusGroups(patients), [patients]);

    if (groups.length === 0) {
        return (
            <div className="mb-8 p-6 rounded-xl border border-dashed border-border/50 bg-secondary/30 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm py-8 animate-in fade-in duration-500">
                <CheckSquare className="w-8 h-8 text-primary/40" />
                <span className="font-medium">All Clear</span>
                <span className="text-xs opacity-70">No pending actions requiring attention.</span>
            </div>
        );
    }

    return (
        <div className="mb-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-3 text-foreground/90">
                    <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(13,148,136,0.4)]" />
                    Focus Feed
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {groups.reduce((acc, g) => acc + g.count, 0)}
                    </span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map(group => (
                    <FocusGroupCard key={group.id} group={group} onAction={() => handleAction(group, navigate)} />
                ))}
            </div>
        </div>
    );
};

// Helper to route actions based on group intent
const handleAction = (group: FocusGroup, navigate: (path: string) => void) => {
    // In a real app, this might filter the list or nav to specific views
    // For now, we route to a generic "next action" logic or just the dashboard with filter?
    // User requirement was just "deriveClinicalInbox". Navigation implementation details:
    // Critical -> Filter Dashboard for Red? Or go to first patient?
    // Drafts -> Maybe go to first patient with drafts?
    // For V2 prototype, we can make it simple.

    // Simple Heuristic Routing:
    // This part wasn't strictly defined in logic layer, implemented here for UI interactivity.
    // Ideally we'd find the first patient matching the criteria and go there, or filter the list.
    // For now, let's keep it handled visually or basic navigation.
    console.log(`Action triggered for ${group.id}`);
};

const FocusGroupCard: React.FC<{ group: FocusGroup; onAction: () => void }> = ({ group, onAction }) => {
    const bgClass = group.priority === 'high' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-900/20' :
        group.priority === 'medium' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-900/20' :
            'bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-900/20';

    const iconColor = group.priority === 'high' ? 'text-red-600' :
        group.priority === 'medium' ? 'text-amber-600' :
            'text-green-600';

    const Icon = group.id === 'critical' ? AlertCircle :
        group.id === 'drafts' ? FileText :
            CheckSquare;

    return (
        <Card className={cn("border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group", bgClass)} onClick={onAction}>
            <CardContent className="p-5 flex items-start justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Icon className={cn("w-5 h-5", iconColor)} />
                        <h3 className="font-semibold text-foreground">{group.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{group.subtext}</p>

                    <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Badge variant="outline" className="text-xs font-normal bg-background/50 hover:bg-background">
                            {group.intent} <ArrowRight className="w-3 h-3 ml-1" />
                        </Badge>
                    </div>
                </div>
                <div className="text-3xl font-bold tracking-tighter text-foreground/80">
                    {group.count}
                </div>
            </CardContent>
        </Card>
    );
};
