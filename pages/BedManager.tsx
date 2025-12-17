import React, { useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { allocatePatientsToBeds, calculateTotalRoomRevenue } from '../utils/bedLogic';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { IndianRupee, LayoutGrid, Activity, AlertTriangle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";
import { useNavigate } from 'react-router-dom';

const BedManager: React.FC = () => {
    const { patients } = usePatient();
    const navigate = useNavigate();

    // Compute allocations
    const beds = useMemo(() => allocatePatientsToBeds(patients), [patients]);
    const totalRoomRevenue = useMemo(() => calculateTotalRoomRevenue(beds), [beds]);
    const occupiedCount = beds.filter(b => b.status === 'occupied').length;
    const occupancyRate = Math.round((occupiedCount / beds.length) * 100);

    const wards = ['ICU', 'WARD-A', 'WARD-B'];

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Bed Manager & Financials</h1>
                    <p className="text-muted-foreground">Real-time occupancy and revenue tracking</p>
                </div>
                <div className="flex gap-4">
                    <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 py-2 px-4 flex items-center gap-3">
                        <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase">Active Room Revenue</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">₹ {(totalRoomRevenue / 100000).toFixed(2)} Lakh</p>
                        </div>
                    </Card>
                    <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 py-2 px-4 flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase">Occupancy</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{occupancyRate}%</p>
                        </div>
                    </Card>
                </div>
            </header>

            {wards.map(wardId => {
                const wardBeds = beds.filter(b => b.wardId === wardId);
                const wardName = wardId === 'ICU' ? 'Intensive Care Unit (ICU)' :
                    wardId === 'WARD-A' ? 'Private & Semi-Private Ward' : 'General Ward';

                return (
                    <div key={wardId} className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-slate-500" />
                            {wardName}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {wardBeds.map(bed => {
                                const isOccupied = bed.status === 'occupied' && bed.patient;
                                // Phase 3: "Sania M" Detection (Discharge Signed but still in bed -> BED BLOCK)
                                const isDischargeReady = isOccupied && patients.find(p => p.id === bed.patient?.id)?.dischargeSummary?.status === 'finalized';

                                return (
                                    <Card
                                        key={bed.id}
                                        onClick={() => isOccupied && navigate(`/patient/${bed.patient!.id}`)}
                                        className={`shadow-sm transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${isDischargeReady ? 'border-amber-500 border-2 bg-amber-50/50 animate-pulse ring-2 ring-amber-200 ring-offset-1' :
                                            isOccupied ? 'border-l-4 border-l-blue-500 dark:border-l-blue-400' :
                                                'border-l-4 border-l-slate-200 bg-slate-50/50 dark:bg-slate-800/50'
                                            }`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {bed.label}
                                                </Badge>
                                                {isDischargeReady ? (
                                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 animate-pulse">
                                                        Discharge Ready
                                                    </Badge>
                                                ) : (
                                                    <Badge className={`${isOccupied ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        'bg-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                                                        } border-none`}>
                                                        {isOccupied ? 'Occupied' : 'Avail'}
                                                    </Badge>
                                                )}
                                            </div>

                                            {isOccupied ? (
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate" title={bed.patient!.name}>
                                                            {bed.patient!.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {bed.patient!.gender.charAt(0)} • {bed.patient!.age}y • {bed.type}
                                                        </p>
                                                    </div>

                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                    {/* Financial Badge */}
                                                                    {bed.patient!.insuranceLimit && bed.dailyRate > bed.patient!.insuranceLimit ? (
                                                                        <Badge variant="destructive" className="h-6 text-[10px] px-1.5 flex gap-1">
                                                                            <AlertTriangle className="w-3 h-3" /> Cap Exceeded
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="h-6 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                                            ₹ {bed.patient!.currentBill.toLocaleString()}
                                                                        </Badge>
                                                                    )}

                                                                    <span className="text-xs font-medium text-slate-500">
                                                                        {bed.patient!.lengthOfStay}d
                                                                    </span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Rate: ₹{bed.dailyRate.toLocaleString()}/day</p>
                                                                <p>LOS: {bed.patient!.lengthOfStay} Days</p>
                                                                {bed.patient!.insuranceLimit && (
                                                                    <p className="text-rose-300">Cap: ₹{bed.patient!.insuranceLimit.toLocaleString()}</p>
                                                                )}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            ) : (
                                                <div className="h-[74px] flex items-center justify-center text-xs text-muted-foreground">
                                                    Available
                                                    <br />
                                                    ₹ {bed.dailyRate.toLocaleString()}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BedManager;
