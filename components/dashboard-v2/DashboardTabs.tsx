import React from 'react';
import { cn } from '../../lib/utils';
import { HomeIcon, ClipboardDocumentListIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Bed } from 'lucide-react';

export type DashboardView = 'dashboard' | 'triage' | 'beds' | 'consultant';

interface DashboardTab {
    id: DashboardView;
    label: string;
    icon: React.ElementType;
}

const tabs: DashboardTab[] = [
    { id: 'dashboard', label: 'Overview', icon: HomeIcon },
    { id: 'triage', label: 'Triage Queue', icon: ClipboardDocumentListIcon },
    { id: 'beds', label: 'Bed Flow', icon: Bed },
    { id: 'consultant', label: 'Consultant', icon: UsersIcon },
];

interface DashboardTabsProps {
    activeView: DashboardView;
    onChange: (view: DashboardView) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeView, onChange }) => {
    return (
        <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30 w-full">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex gap-1 -mb-px">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3",
                                "text-sm font-medium transition-colors",
                                "border-b-2 -mb-px",
                                activeView === tab.id
                                    ? "text-foreground border-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default DashboardTabs;
