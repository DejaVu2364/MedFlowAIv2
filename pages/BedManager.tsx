import React, { useMemo, useState } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { allocatePatientsToBeds, calculateTotalRoomRevenue, Bed } from '../utils/bedLogic';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '../components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    IndianRupee,
    LayoutGrid,
    Activity,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Users,
    Clock,
    LogOut,
    CheckCircle2,
    UserPlus,
    ArrowRightLeft,
    Sparkles,
    X
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';
import { Patient } from '../types';
import BackToDashboard from '../components/navigation/BackToDashboard';

interface BedManagerProps {
    embedded?: boolean;
}

interface WardStats {
    total: number;
    occupied: number;
    available: number;
    cleaning: number;
    revenue: number;
    dischargeReady: number;
}

const BedManager: React.FC<BedManagerProps> = ({ embedded = false }) => {
    const { patients, updateStateAndDb, updatePatientStatus } = usePatient();
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Ward collapse state
    const [expandedWards, setExpandedWards] = useState<Record<string, boolean>>({
        'ICU': true,
        'WARD-A': true,
        'WARD-B': true
    });

    // Bed selection state
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');

    // Compute allocations
    const beds = useMemo(() => allocatePatientsToBeds(patients), [patients]);
    const totalRoomRevenue = useMemo(() => calculateTotalRoomRevenue(beds), [beds]);
    const occupiedCount = beds.filter(b => b.status === 'occupied').length;
    const occupancyRate = Math.round((occupiedCount / beds.length) * 100);

    // Get unassigned patients (active but no bed)
    const unassignedPatients = useMemo(() => {
        return patients.filter(p =>
            p.status !== 'Discharged' &&
            !p.bedAssignment
        );
    }, [patients]);

    // Calculate ward-level stats
    const wardStats = useMemo(() => {
        const stats: Record<string, WardStats> = {};

        ['ICU', 'WARD-A', 'WARD-B'].forEach(wardId => {
            const wardBeds = beds.filter(b => b.wardId === wardId);
            const occupied = wardBeds.filter(b => b.status === 'occupied');

            const dischargeReady = occupied.filter(b => {
                const patient = patients.find(p => p.id === b.patient?.id);
                return patient?.dischargeSummary?.status === 'finalized';
            }).length;

            stats[wardId] = {
                total: wardBeds.length,
                occupied: occupied.length,
                available: wardBeds.filter(b => b.status === 'available').length,
                cleaning: wardBeds.filter(b => b.status === 'cleaning').length,
                revenue: occupied.reduce((sum, b) => sum + (b.patient?.currentBill || 0), 0),
                dischargeReady
            };
        });

        return stats;
    }, [beds, patients]);

    const wards = [
        { id: 'ICU', name: 'Intensive Care Unit (ICU)', color: 'rose' },
        { id: 'WARD-A', name: 'Private & Semi-Private Ward', color: 'blue' },
        { id: 'WARD-B', name: 'General Ward', color: 'emerald' }
    ];

    const toggleWard = (wardId: string) => {
        setExpandedWards(prev => ({ ...prev, [wardId]: !prev[wardId] }));
    };

    const getDischargeStatus = (bed: Bed) => {
        if (bed.status !== 'occupied' || !bed.patient) return null;
        const patient = patients.find(p => p.id === bed.patient?.id);
        if (!patient) return null;
        if (patient.dischargeSummary?.status === 'finalized') return 'ready';
        const hasPendingOrders = patient.orders?.some(o => o.status === 'draft' || o.status === 'sent');
        if (!hasPendingOrders && patient.clinicalFile?.sections?.history) return 'pending';
        return null;
    };

    // Handle bed assignment
    const handleAssignPatient = async () => {
        if (!selectedBed || !selectedPatientId) return;

        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient) return;

        // Update patient with bed assignment using updateStateAndDb
        updateStateAndDb(selectedPatientId, p => ({
            ...p,
            bedAssignment: {
                bedId: selectedBed.id,
                wardId: selectedBed.wardId,
                bedLabel: selectedBed.label,
                assignedAt: new Date().toISOString()
            },
            admissionDate: p.admissionDate || new Date().toISOString(),
            status: 'In Treatment'
        }));

        addToast(`${patient.name} assigned to ${selectedBed.label}`, 'success');
        setSelectedBed(null);
        setSelectedPatientId('');
    };

    // Handle discharge from bed
    const handleDischarge = (bed: Bed) => {
        if (!bed.patient) return;

        const patient = patients.find(p => p.id === bed.patient?.id);
        if (!patient) return;

        // Update patient: clear bed assignment and set status to Discharged
        updateStateAndDb(patient.id, p => ({
            ...p,
            bedAssignment: undefined,
            status: 'Discharged'
        }));

        addToast(`${patient.name} discharged from ${bed.label}`, 'success');
        setSelectedBed(null);
    };

    return (
        <div className={cn("min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6", embedded && "bg-transparent p-0 min-h-0")}>
            {/* Header */}
            {!embedded && (
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <BackToDashboard />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bed Manager & Financials</h1>
                        <p className="text-muted-foreground">Real-time occupancy, revenue, and discharge tracking</p>
                    </div>
                    <div className="flex gap-4">
                        {/* Unassigned Patients Alert */}
                        {unassignedPatients.length > 0 && (
                            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 py-2 px-4 flex items-center gap-3">
                                <UserPlus className="w-5 h-5 text-amber-600" />
                                <div>
                                    <p className="text-xs text-amber-700 font-medium">{unassignedPatients.length} Patients Need Beds</p>
                                </div>
                            </Card>
                        )}
                        <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 py-2 px-4 flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Active Room Revenue</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₹ {(totalRoomRevenue / 100000).toFixed(2)} Lakh</p>
                            </div>
                        </Card>
                        <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 py-2 px-4 flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Occupancy</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{occupancyRate}%</p>
                            </div>
                        </Card>
                    </div>
                </header>
            )}

            {/* Legend */}
            {!embedded && (
                <div className="flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        Ready to Discharge
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        Pending Discharge
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        Cap Exceeded
                    </span>
                    <span className="flex items-center gap-1 ml-4">
                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                        Available
                    </span>
                </div>
            )}

            {wards.map(ward => {
                const wardBeds = beds.filter(b => b.wardId === ward.id);
                const stats = wardStats[ward.id];
                const isExpanded = expandedWards[ward.id];

                return (
                    <div key={ward.id} className="space-y-3">
                        {/* Ward Header - Clickable */}
                        <div
                            onClick={() => toggleWard(ward.id)}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                <LayoutGrid className={cn("w-5 h-5", `text-${ward.color}-500`)} />
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{ward.name}</h2>
                            </div>

                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
                                    <Users className="w-3 h-3 mr-1" />
                                    {stats.occupied}/{stats.total}
                                </Badge>
                                {stats.available > 0 && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                        {stats.available} Free
                                    </Badge>
                                )}
                                {stats.dischargeReady > 0 && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                        <LogOut className="w-3 h-3 mr-1" />
                                        {stats.dischargeReady} Ready
                                    </Badge>
                                )}
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <IndianRupee className="w-3 h-3 mr-1" />
                                    ₹{(stats.revenue / 1000).toFixed(0)}K
                                </Badge>
                            </div>
                        </div>

                        {/* Bed Grid */}
                        {isExpanded && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pl-8">
                                {wardBeds.map(bed => {
                                    const isOccupied = bed.status === 'occupied' && bed.patient;
                                    const dischargeStatus = getDischargeStatus(bed);
                                    const capExceeded = isOccupied && bed.patient!.insuranceLimit && bed.dailyRate > bed.patient!.insuranceLimit;

                                    return (
                                        <Card
                                            key={bed.id}
                                            onClick={() => setSelectedBed(bed)}
                                            className={cn(
                                                "shadow-sm transition-all hover:shadow-md cursor-pointer relative overflow-hidden",
                                                dischargeStatus === 'ready' && "border-2 border-emerald-500 bg-emerald-50/50",
                                                dischargeStatus === 'pending' && "border-2 border-amber-400 bg-amber-50/30",
                                                capExceeded && "border-2 border-rose-400",
                                                !dischargeStatus && !capExceeded && isOccupied && "border-l-4 border-l-blue-500",
                                                !isOccupied && "border-l-4 border-l-slate-200 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-l-emerald-400"
                                            )}
                                        >
                                            {dischargeStatus === 'ready' && (
                                                <div className="absolute top-0 right-0 p-1">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                </div>
                                            )}

                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <Badge variant="outline" className="font-mono text-xs">{bed.label}</Badge>
                                                    {dischargeStatus === 'ready' ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">Ready</Badge>
                                                    ) : dischargeStatus === 'pending' ? (
                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                                                            <Clock className="w-3 h-3 mr-1" />Pending
                                                        </Badge>
                                                    ) : (
                                                        <Badge className={cn("border-none", isOccupied ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
                                                            {isOccupied ? 'Occupied' : 'Avail'}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {isOccupied ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="font-medium text-slate-900 truncate">{bed.patient!.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {bed.patient!.gender.charAt(0)} • {bed.patient!.age}y • {bed.type}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                            {capExceeded ? (
                                                                <Badge variant="destructive" className="h-6 text-[10px] px-1.5 flex gap-1">
                                                                    <AlertTriangle className="w-3 h-3" /> Cap Exceeded
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="h-6 text-[10px] bg-emerald-50 text-emerald-700">
                                                                    ₹ {bed.patient!.currentBill.toLocaleString()}
                                                                </Badge>
                                                            )}
                                                            <span className="text-xs font-medium text-slate-500">{bed.patient!.lengthOfStay}d</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-[74px] flex flex-col items-center justify-center text-xs text-muted-foreground">
                                                        <UserPlus className="w-5 h-5 mb-1 text-slate-300" />
                                                        <span>₹ {bed.dailyRate.toLocaleString()}/day</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Bed Detail Sheet */}
            <Sheet open={!!selectedBed} onOpenChange={(open) => !open && setSelectedBed(null)}>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-blue-600" />
                            Bed {selectedBed?.label}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedBed?.type} • ₹{selectedBed?.dailyRate.toLocaleString()}/day
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {selectedBed?.status === 'occupied' && selectedBed.patient ? (
                            <>
                                {/* Current Patient Info */}
                                <Card className="border-blue-200 bg-blue-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-slate-600">Current Patient</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="font-semibold text-lg text-slate-900">{selectedBed.patient.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {selectedBed.patient.gender} • {selectedBed.patient.age}y
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <Badge variant="outline">LOS: {selectedBed.patient.lengthOfStay} days</Badge>
                                            <Badge className="bg-emerald-100 text-emerald-700">
                                                ₹{selectedBed.patient.currentBill.toLocaleString()}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => navigate(`/patient/${selectedBed.patient!.id}`)}
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        View Patient Record
                                    </Button>

                                    {getDischargeStatus(selectedBed) === 'ready' && (
                                        <Button
                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => handleDischarge(selectedBed)}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Complete Discharge
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Assign Patient */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <UserPlus className="w-4 h-4 text-emerald-600" />
                                            Assign Patient to Bed
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {unassignedPatients.length === 0 ? (
                                            <p className="text-sm text-slate-500 text-center py-4">
                                                No unassigned patients waiting
                                            </p>
                                        ) : (
                                            <>
                                                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a patient..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {unassignedPatients.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name} ({p.age}y {p.gender.charAt(0)}) - {p.triage?.level || 'No triage'}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                                    disabled={!selectedPatientId}
                                                    onClick={handleAssignPatient}
                                                >
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Assign to {selectedBed?.label}
                                                </Button>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default BedManager;
