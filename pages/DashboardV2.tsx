import React, { useMemo, useState, useEffect } from 'react';
import { usePatient } from '@/contexts/PatientContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
    UserPlus,
    Stethoscope,
    BedDouble,
    Users,
    Clock,
    AlertCircle,
    Search,
    Activity,
    ChevronRight,
    RefreshCw,




    TrendingUp,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/types';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { DashboardTabs, DashboardView } from '@/components/dashboard-v2/DashboardTabs';
import TriagePage from './TriagePage';
import BedManager from './BedManager';
import ConsultantViewPage from './ConsultantViewPage';



// ============================================
// MINI CHART FOR STATS
// ============================================
const MiniChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const chartData = data.map((value, index) => ({ value, index }));

    return (
        <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#gradient-${color})`}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

// ============================================
// PATIENT LIST SHEET
// ============================================
const PatientListSheet: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    patients: Patient[];
    onPatientSelect: (id: string) => void;
}> = ({ isOpen, onClose, title, description, patients, onPatientSelect }) => {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                    <div className="space-y-2">
                        {patients.map(patient => (
                            <Card
                                key={patient.id}
                                className="cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => {
                                    onPatientSelect(patient.id);
                                    onClose();
                                }}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full shrink-0",
                                        patient.triage?.level === 'Red' ? 'bg-red-500' :
                                            patient.triage?.level === 'Yellow' ? 'bg-amber-500' : 'bg-green-500'
                                    )} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{patient.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {patient.chiefComplaints?.[0]?.complaint || 'No complaint'}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">{patient.age}{patient.gender === 'Male' ? 'M' : 'F'}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                        {patients.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No patients</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

// ============================================
// PATIENT ROW
// ============================================
const PatientRow: React.FC<{ patient: Patient; onClick: () => void }> = ({ patient, onClick }) => {
    const triageColor = patient.triage?.level === 'Red' ? 'bg-red-500' :
        patient.triage?.level === 'Yellow' ? 'bg-amber-500' : 'bg-green-500';

    return (
        <div onClick={onClick} className="group flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors rounded-lg">
            <div className={cn("w-2 h-2 rounded-full shrink-0", triageColor)} />
            <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground truncate block">{patient.name}</span>
                <span className="text-sm text-muted-foreground truncate block">
                    {patient.chiefComplaints?.[0]?.complaint || 'No chief complaint'}
                </span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
                {new Date(patient.registrationTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

// ============================================
// STAT CARD
// ============================================
const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
    variant?: 'default' | 'alert';
    chartData?: number[];
    chartColor?: string;
    onClick?: () => void;
}> = ({ label, value, icon: Icon, variant = 'default', chartData, chartColor = '#14b8a6', onClick }) => {
    return (
        <Card
            className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                variant === 'alert' && value > 0 && "border-red-200 bg-red-50/30"
            )}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    <Icon className={cn(
                        "w-4 h-4",
                        variant === 'alert' && value > 0 ? "text-red-400" : "text-muted-foreground/50"
                    )} />
                </div>
                <p className={cn(
                    "text-3xl font-bold",
                    variant === 'alert' && value > 0 ? "text-red-600" : "text-foreground"
                )}>
                    {value}
                </p>
                {chartData && (
                    <div className="mt-2 -mx-2">
                        <MiniChart data={chartData} color={chartColor} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ============================================
// MAIN DASHBOARD
// ============================================
const DashboardV2: React.FC = () => {
    const { patients, isLoading, setSelectedPatientId } = usePatient();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');


    // Get active view from URL params (default to 'dashboard')
    const activeView = (searchParams.get('view') as DashboardView) || 'dashboard';

    const handleViewChange = (view: DashboardView) => {
        if (view === 'dashboard') {
            setSearchParams({});
        } else {
            setSearchParams({ view });
        }
    };
    const [sheetState, setSheetState] = useState<{ open: boolean; type: string }>({ open: false, type: '' });

    // Derived data
    const waitingForTriage = useMemo(() => patients.filter(p => p.status === 'Waiting for Triage'), [patients]);
    const waitingForDoctor = useMemo(() => patients.filter(p => p.status === 'Waiting for Doctor'), [patients]);
    const activePatients = useMemo(() => patients.filter(p => p.status === 'In Treatment'), [patients]);
    const criticalPatients = useMemo(() => patients.filter(p => p.triage?.level === 'Red'), [patients]);

    // Mock chart data for visual appeal
    const chartDataCritical = [2, 3, 1, 4, 2, criticalPatients.length];
    const chartDataQueue = [5, 8, 6, 10, 7, waitingForDoctor.length];
    const chartDataActive = [3, 4, 5, 6, 4, activePatients.length];

    // Priority queue
    const priorityQueue = useMemo(() => {
        return [...waitingForDoctor].sort((a, b) => {
            if (a.triage?.level === 'Red' && b.triage?.level !== 'Red') return -1;
            if (b.triage?.level === 'Red' && a.triage?.level !== 'Red') return 1;
            return new Date(a.registrationTime).getTime() - new Date(b.registrationTime).getTime();
        });
    }, [waitingForDoctor]);

    // Search
    const filteredPatients = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
    }, [patients, searchQuery]);

    // Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const handlePatientSelect = (id: string) => {
        setSelectedPatientId(id);
        navigate(`/patient/${id}/medview`);
    };

    // Get patients for sheet
    const getSheetPatients = () => {
        switch (sheetState.type) {
            case 'critical': return criticalPatients;
            case 'triage': return waitingForTriage;
            case 'queue': return waitingForDoctor;
            case 'treatment': return activePatients;
            default: return [];
        }
    };

    const getSheetTitle = () => {
        switch (sheetState.type) {
            case 'critical': return 'Critical Patients';
            case 'triage': return 'Awaiting Triage';
            case 'queue': return 'In Queue';
            case 'treatment': return 'In Treatment';
            default: return '';
        }
    };

    if (isLoading && patients.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="-mx-6 -mt-6 mb-8 pt-0">
                <DashboardTabs activeView={activeView} onChange={handleViewChange} />
            </div>

            {activeView === 'dashboard' ? (
                <div className="space-y-8">


                    {/* Header with Doctor Name - Enhanced */}
                    <header className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                {currentUser?.name?.charAt(0) || 'D'}
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                                    {getGreeting()}, <span className="text-teal-600">{currentUser?.name || 'Doctor'}</span>
                                </h1>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {patients.length} patients
                                    </span>
                                </div>
                            </div>
                        </div>

                    </header>

                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        {filteredPatients.length > 0 && (
                            <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
                                <CardContent className="p-0">
                                    {filteredPatients.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => { handlePatientSelect(p.id); setSearchQuery(''); }}
                                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => navigate('/reception')} className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            Register Patient
                        </Button>
                    </div>

                    <Separator />

                    {/* Stats with Mini Charts - Clickable */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Critical"
                            value={criticalPatients.length}
                            icon={AlertCircle}
                            variant="alert"
                            chartData={chartDataCritical}
                            chartColor="#ef4444"
                            onClick={() => setSheetState({ open: true, type: 'critical' })}
                        />
                        <StatCard
                            label="Awaiting Triage"
                            value={waitingForTriage.length}
                            icon={Clock}
                            chartData={[3, 5, 4, 6, 5, waitingForTriage.length]}
                            chartColor="#f59e0b"
                            onClick={() => setSheetState({ open: true, type: 'triage' })}
                        />
                        <StatCard
                            label="In Queue"
                            value={waitingForDoctor.length}
                            icon={Users}
                            chartData={chartDataQueue}
                            chartColor="#3b82f6"
                            onClick={() => setSheetState({ open: true, type: 'queue' })}
                        />
                        <StatCard
                            label="In Treatment"
                            value={activePatients.length}
                            icon={Activity}
                            chartData={chartDataActive}
                            chartColor="#14b8a6"
                            onClick={() => setSheetState({ open: true, type: 'treatment' })}
                        />
                    </div>

                    {/* Patient Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-medium">Your Queue</CardTitle>
                                <CardDescription>Patients waiting for your attention</CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-0">
                                <ScrollArea className="h-[350px]">
                                    {priorityQueue.length > 0 ? (
                                        <div className="divide-y">
                                            {priorityQueue.map(patient => (
                                                <PatientRow key={patient.id} patient={patient} onClick={() => handlePatientSelect(patient.id)} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No patients in queue</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-medium">In Treatment</CardTitle>
                                <CardDescription>Active patients you're seeing</CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-0">
                                <ScrollArea className="h-[350px]">
                                    {activePatients.length > 0 ? (
                                        <div className="divide-y">
                                            {activePatients.map(patient => (
                                                <PatientRow key={patient.id} patient={patient} onClick={() => handlePatientSelect(patient.id)} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No active patients</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    {activeView === 'triage' && <TriagePage embedded />}
                    {activeView === 'beds' && <BedManager embedded />}
                    {activeView === 'consultant' && <ConsultantViewPage embedded />}
                </div>
            )}



            {/* Patient List Sheet */}
            <PatientListSheet
                isOpen={sheetState.open}
                onClose={() => setSheetState({ open: false, type: '' })}
                title={getSheetTitle()}
                description={`${getSheetPatients().length} patients`}
                patients={getSheetPatients()}
                onPatientSelect={handlePatientSelect}
            />
        </div>
    );
};

export default DashboardV2;
