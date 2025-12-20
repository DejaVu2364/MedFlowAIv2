import React, { useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { PatientOverviewCard } from '../components/medview/PatientOverviewCard';
import { UsersIcon, FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

interface ConsultantViewPageProps {
    embedded?: boolean;
}

const ConsultantViewPage: React.FC<ConsultantViewPageProps> = ({ embedded = false }) => {
    const { patients, isLoading } = usePatient();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState<{ key: 'name' | 'triage' | 'age' | 'wait_time', direction: 'asc' | 'desc' }>({ key: 'triage', direction: 'desc' });
    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [deptFilter, setDeptFilter] = React.useState<string>('all');

    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            const matchesDept = deptFilter === 'all' || (p.aiTriage?.department || 'Unknown') === deptFilter;
            return matchesSearch && matchesStatus && matchesDept;
        });
    }, [patients, searchQuery, statusFilter, deptFilter]);

    const sortedPatients = useMemo(() => {
        return [...filteredPatients].sort((a, b) => {
            if (sortConfig.key === 'triage') {
                const priority = { 'Red': 3, 'Yellow': 2, 'Green': 1, 'None': 0 };
                const diff = (priority[b.triage.level] || 0) - (priority[a.triage.level] || 0);
                return sortConfig.direction === 'asc' ? -diff : diff;
            }
            if (sortConfig.key === 'age') {
                return sortConfig.direction === 'asc' ? a.age - b.age : b.age - a.age;
            }
            if (sortConfig.key === 'wait_time') {
                const timeA = new Date(a.registrationTime).getTime();
                const timeB = new Date(b.registrationTime).getTime();
                return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
            }
            return sortConfig.direction === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        });
    }, [filteredPatients, sortConfig]);

    const toggleSort = (key: 'name' | 'triage' | 'age' | 'wait_time') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (isLoading) {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-64 bg-card rounded-xl border border-border/50 p-6 space-y-4">
                        <div className="flex justify-between">
                            <div className="h-12 w-12 rounded-full bg-muted/20 animate-pulse" />
                            <div className="h-6 w-20 bg-muted/20 animate-pulse rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-6 w-3/4 bg-muted/20 animate-pulse rounded" />
                            <div className="h-4 w-1/2 bg-muted/20 animate-pulse rounded" />
                        </div>
                        <div className="pt-4 space-y-2">
                            <div className="h-16 bg-muted/10 animate-pulse rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("space-y-8 pb-12 animate-in fade-in duration-500", embedded && "max-w-[1600px] mx-auto px-4")}>
            {/* Header */}
            {!embedded && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <UsersIcon className="w-8 h-8 text-primary" />
                            Consultant Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Overview of all admitted patients • {patients.length} Active Cases
                        </p>
                    </div>
                </div>
            )}
            {/* Filter Controls - Conditional styling when embedded */}
            <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4", embedded && "mb-6")}>
                {embedded ? (
                    <div className="block">
                        {/* Empty div to spacing if embedded header is gone, but we still need row for filters */}
                    </div>
                ) : null}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">

                    <div className="relative w-full sm:w-auto">
                        <Input
                            placeholder="Filter patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 bg-background pl-9"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="all">All Status</option>
                        <option value="Waiting for Triage">Waiting Triage</option>
                        <option value="Waiting for Doctor">Waiting Doctor</option>
                        <option value="In Treatment">In Treatment</option>
                        <option value="Discharged">Discharged</option>
                    </select>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={() => toggleSort('triage')} className={sortConfig.key === 'triage' ? 'bg-muted flex-1 sm:flex-none' : 'flex-1 sm:flex-none'}>
                            Priority {sortConfig.key === 'triage' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleSort('wait_time')} className={sortConfig.key === 'wait_time' ? 'bg-muted flex-1 sm:flex-none' : 'flex-1 sm:flex-none'}>
                            Wait Time {sortConfig.key === 'wait_time' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            {sortedPatients.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">No active patients found matching your filter.</p>
                    <Button variant="link" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="mt-2 text-primary">Clear Filter</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedPatients.map(patient => (
                        <PatientOverviewCard key={patient.id} patient={patient} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConsultantViewPage;
