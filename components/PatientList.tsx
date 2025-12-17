import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TriageBadge } from './common/TriageBadge';
import { Patient } from '../types';
import { UserGroupIcon } from '@heroicons/react/24/solid';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Mic, FileText, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PatientListProps {
    title: string;
    patients: Patient[];
    onSelect: (id: string) => void;
    emptyMsg: string;
    headerClass?: string;
}

export const PatientList: React.FC<PatientListProps> = ({ title, patients, onSelect, emptyMsg, headerClass }) => {
    return (
        <Card className="border-border/50 shadow-sm h-full flex flex-col hover:border-border/80 transition-colors">
            <CardHeader className={cn("py-4 px-6 border-b border-border/50", headerClass || "bg-muted/20")}>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs bg-background/50">{patients.length}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[500px]">
                {patients.length > 0 ? (
                    <div className="divide-y divide-border/50">
                        {patients.map(p => (
                            <PatientListItem key={p.id} patient={p} onSelect={onSelect} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground opacity-60">
                        <UserGroupIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">{emptyMsg}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const PatientListItem: React.FC<{ patient: Patient; onSelect: (id: string) => void }> = ({ patient, onSelect }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handleAction = (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        // Navigate to specific tab/action
        navigate(`/patient/${patient.id}?tab=${action}`);
    };

    return (
        <div
            onClick={() => onSelect(patient.id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            data-testid={`patient-card-${patient.name}`}
            className="relative p-4 hover:bg-muted/30 cursor-pointer transition-all duration-200 group"
        >
            <div className={cn("transition-opacity duration-200", isHovered ? "opacity-40 blur-[1px]" : "opacity-100")}>
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{patient.name}</h4>
                    <TriageBadge level={patient.triage?.level || 'None'} className="text-[10px] uppercase" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{patient.age}y / {patient.gender}</span>
                    <span>•</span>
                    <span className="font-mono">{patient.id.slice(0, 8)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                        {patient.chiefComplaints?.[0]?.complaint || 'No complaints'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Quick Actions Overlay */}
            <div
                className={cn(
                    "absolute inset-0 flex items-center justify-center gap-2 transition-all duration-200",
                    isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                )}
            >
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full shadow-md" onClick={(e) => handleAction(e, 'clinical')}>
                    <Mic className="w-4 h-4 text-primary" />
                </Button>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full shadow-md" onClick={(e) => handleAction(e, 'orders')}>
                    <FileText className="w-4 h-4 text-amber-600" />
                </Button>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full shadow-md" onClick={(e) => handleAction(e, 'vitals')}>
                    <Activity className="w-4 h-4 text-slate-600" />
                </Button>
            </div>
        </div>
    );
};
