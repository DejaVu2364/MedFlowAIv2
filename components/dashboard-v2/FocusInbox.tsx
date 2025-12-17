import React from 'react';
import { FocusGroup } from '../../utils/dashboardLogicV2';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, FileSignature, LogOut, ArrowRight, FileCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface FocusInboxProps {
    groups: FocusGroup[];
}

export const FocusInbox: React.FC<FocusInboxProps> = ({ groups }) => {
    const navigate = useNavigate();

    const handleGroupClick = (group: FocusGroup) => {
        if (group.targetPatientId) {
            navigate(`/patient/${group.targetPatientId}/medview`);
        } else {
            console.warn("No target patient ID for group:", group.id);
        }
    };

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed border-slate-200 h-64">
                <FileSignature className="w-10 h-10 text-slate-300 mb-2" />
                <p className="font-medium">All inputs cleared</p>
                <p className="text-xs">No pending actions found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {groups.map((group) => {
                let cardStyle = "";
                let Icon = FileSignature;
                let iconColor = "";

                // Phase 6: Switching on ID for handling new 'admin_request' type
                switch (group.id) {
                    case 'critical':
                        cardStyle = "bg-red-50 border-l-4 border-l-red-500 border-y border-r border-red-100 dark:bg-red-900/10 dark:border-l-red-500 dark:border-red-900/20";
                        Icon = AlertCircle;
                        iconColor = "text-red-600";
                        break;
                    case 'admin_request':
                        cardStyle = "bg-purple-50 border-l-4 border-l-purple-500 border-y border-r border-purple-100 dark:bg-purple-900/10 dark:border-l-purple-500 dark:border-purple-900/20";
                        Icon = FileCheck;
                        iconColor = "text-purple-600";
                        break;
                    case 'drafts':
                        cardStyle = "bg-amber-50 border-l-4 border-l-amber-400 border-y border-r border-amber-100 dark:bg-amber-900/10 dark:border-l-amber-400 dark:border-amber-900/20";
                        Icon = FileSignature;
                        iconColor = "text-amber-600";
                        break;
                    case 'discharge':
                        cardStyle = "bg-white border-l-4 border-l-teal-500 border-y border-r border-slate-200 dark:bg-card dark:border-l-teal-500 dark:border-slate-800";
                        Icon = LogOut;
                        iconColor = "text-teal-600";
                        break;
                    default:
                        // Fallback logic if needed
                        if (group.priority === 'high') {
                            cardStyle = "bg-red-50 border-l-4 border-l-red-500 border-y border-r border-red-100 dark:bg-red-900/10 dark:border-l-red-500 dark:border-red-900/20";
                            Icon = AlertCircle;
                            iconColor = "text-red-600";
                        } else {
                            cardStyle = "bg-white border-l-4 border-l-slate-500";
                            Icon = FileSignature;
                            iconColor = "text-slate-600";
                        }
                        break;
                }

                return (
                    <Card
                        key={group.id}
                        className={cn("hover:shadow-md transition-shadow duration-200 cursor-pointer rounded-r-lg rounded-l-md", cardStyle)}
                        onClick={() => handleGroupClick(group)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <Icon className={cn("w-5 h-5", iconColor)} />
                                    <h3 className="font-semibold text-foreground text-base tracking-tight">{group.label}</h3>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-foreground/70">
                                        {group.count}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-8">{group.subtext}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="hidden sm:flex gap-1 text-muted-foreground hover:text-foreground">
                                {group.id === 'admin_request' ? 'Sign Note' : 'Review'} <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
