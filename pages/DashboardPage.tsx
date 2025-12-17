import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Patient, TriageLevel } from '../types';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { UserGroupIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { TriageBadge } from '../components/common/TriageBadge';
import { FocusFeed } from '../components/FocusFeed';
import { PatientList } from '../components/PatientList';
import { cn } from '../lib/utils';

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ElementType; trend?: string; trendUp?: boolean; colorClass?: string; bgClass?: string }> = ({ label, value, icon: Icon, trend, trendUp, colorClass, bgClass }) => (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    {trend && (
                        <span className={cn("text-xs font-medium", trendUp ? "text-green-600" : "text-red-600")}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
            <div className={cn("p-3 rounded-full", bgClass || "bg-muted/50")}>
                <Icon className={cn("w-5 h-5", colorClass || "text-muted-foreground")} />
            </div>
        </CardContent>
    </Card>
);



const DashboardPage: React.FC = () => {
    const { patients, setSelectedPatientId, isLoading } = usePatient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    console.log("DEBUG: DashboardPage mounted");

    const stats = useMemo(() => {
        const total = patients.length;
        const critical = patients.filter(p => p.triage.level === 'Red').length;
        const waiting = patients.filter(p => p.status === 'Waiting for Triage' || p.status === 'Waiting for Doctor').length;
        return { total, critical, waiting };
    }, [patients]);

    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        return patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [patients, searchTerm]);

    const waitingPatients = filteredPatients.filter(p => p.status === 'Waiting for Triage' || p.status === 'Waiting for Doctor');
    const activePatients = filteredPatients.filter(p => p.status === 'In Treatment');
    const dischargedPatients = filteredPatients.filter(p => p.status === 'Discharged');

    const handlePatientSelect = (id: string) => {
        setSelectedPatientId(id);
        navigate(`/patient/${id}`);
    };

    if (isLoading && patients.length === 0) {
        console.log("DEBUG: DashboardPage rendering LOADING state");
        return <div data-testid="dashboard-loading" className="flex items-center justify-center h-screen text-muted-foreground">Loading dashboard...</div>;
    }

    console.log("DEBUG: DashboardPage rendering MAIN content. Patients count:", patients.length);
    console.log("DEBUG: Waiting Patients count:", waitingPatients.length);
    if (patients.length > 0) {
        console.log("DEBUG: First patient:", patients[0].name, patients[0].status);
    }
    return (
        <div data-testid="dashboard-container" className="space-y-8 max-w-[1600px] mx-auto pb-10">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 data-testid="dashboard-title" className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Overview of current department status.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search patients..."
                            className="pl-9 bg-background"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => navigate('/reception')}>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Check In
                    </Button>
                </div>
            </div>

            {/* To-Do Panel */}
            <FocusFeed />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label="Total Patients"
                    value={stats.total}
                    icon={UserGroupIcon}
                    trend="+12% from yesterday"
                    trendUp={true}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50 dark:bg-blue-900/20"
                />
                <StatCard
                    label="Critical Attention"
                    value={stats.critical}
                    icon={ExclamationTriangleIcon}
                    trend="Requires immediate action"
                    trendUp={false}
                    colorClass="text-red-600"
                    bgClass="bg-red-50 dark:bg-red-900/20"
                />
                <StatCard
                    label="Waiting Room"
                    value={stats.waiting}
                    icon={ClockIcon}
                    trend="Avg wait: 14m"
                    trendUp={true}
                    colorClass="text-amber-600"
                    bgClass="bg-amber-50 dark:bg-amber-900/20"
                />
            </div>

            {/* Patient Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                <PatientList
                    title="Waiting Room"
                    patients={waitingPatients}
                    onSelect={handlePatientSelect}
                    emptyMsg="No patients waiting"
                    headerClass="bg-amber-50/50 dark:bg-amber-900/10"
                />
                <PatientList
                    title="Active Treatment"
                    patients={activePatients}
                    onSelect={handlePatientSelect}
                    emptyMsg="No active patients"
                    headerClass="bg-blue-50/50 dark:bg-blue-900/10"
                />
                <PatientList
                    title="Discharged / Completed"
                    patients={dischargedPatients}
                    onSelect={handlePatientSelect}
                    emptyMsg="No recent discharges"
                    headerClass="bg-green-50/50 dark:bg-green-900/10"
                />
            </div>
        </div>
    );
};

export default DashboardPage;
