import React, { ReactNode } from 'react';
import { Patient } from '../../types';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { TriageBadge } from '../common/TriageBadge';
import { cn } from '../../lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface ClinicalSplitLayoutProps {
    patient: Patient;
    children: ReactNode; // Left Panel (Note)
    sidePanel: ReactNode; // Right Panel (Assistant)
}

export const ClinicalSplitLayout: React.FC<ClinicalSplitLayoutProps> = ({ patient, children, sidePanel }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-background">
            {/* Frozen Header */}
            <header className="flex-none h-16 border-b bg-white dark:bg-card flex items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="-ml-2">
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-foreground flex items-center gap-3">
                            {patient.name}
                            <TriageBadge level={patient.triage?.level || 'None'} className="text-xs" />
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-mono">{patient.id}</span>
                            <span>•</span>
                            <span>{patient.age}y / {patient.gender}</span>
                            <span>•</span>
                            <Badge variant={patient.status === 'Discharged' ? 'secondary' : 'outline'} className="text-[10px]">
                                {patient.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                {/* Right Header Actions (Save/Sign could go here later) */}
                <div className="flex items-center gap-2">
                    {/* Placeholder for toolbar */}
                </div>
            </header>

            {/* Split Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: Clinical Note ("The Paper") */}
                <div className="flex-1 min-w-0 bg-white dark:bg-background shadow-sm z-10 flex flex-col">
                    <ScrollArea className="flex-1">
                        <div className="p-8 max-w-4xl mx-auto">
                            {children}
                        </div>
                    </ScrollArea>
                </div>

                {/* RIGHT: Assistant Rail */}
                <div className="w-[400px] flex-none border-l border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/10 hidden lg:flex flex-col">
                    {sidePanel}
                </div>
            </div>
        </div>
    );
};
