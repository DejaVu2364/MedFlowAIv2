import React, { useState, useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { runRevenueAudit, RevenueRisk } from '../utils/revenueGuardLogic';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { IndianRupee, AlertTriangle, CheckCircle, Clock, Copy, ArrowRight, BrainCircuit, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const RevenueDashboard: React.FC = () => {
    const { patients } = usePatient();
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Run Logic
    const risks = useMemo(() => runRevenueAudit(patients), [patients]);

    // Stats
    const totalLeakage = risks.reduce((sum, r) => sum + r.potentialLoss, 0);
    const recovered = 45000; // Static demo value
    const dischargeTAT = 4.5;

    // Chart Data
    const chartData = useMemo(() => {
        const categories = { 'Pharmacy': 0, 'Consumables': 0, 'Room Rent': 0, 'Diagnostics': 0 };
        risks.forEach(r => {
            if (r.category === 'Consumable Leak') categories['Consumables'] += r.potentialLoss;
            if (r.category === 'TPA Rejection Risk') categories['Pharmacy'] += r.potentialLoss; // Usually drugs
            if (r.category === 'Room Rent Mismatch') categories['Room Rent'] += r.potentialLoss;
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [risks]);

    // TPA Justifier State
    const [selectedRisk, setSelectedRisk] = useState<RevenueRisk | null>(null);
    const [isJustifierOpen, setIsJustifierOpen] = useState(false);

    const handleOpenJustifier = (risk: RevenueRisk) => {
        if (risk.category === 'TPA Rejection Risk') {
            setSelectedRisk(risk);
            setIsJustifierOpen(true);
        }
    };

    const handleCopyNote = () => {
        if (selectedRisk) {
            const note = `Patient ${selectedRisk.patientId.slice(0, 8)} diagnosed with suspected Sepsis (SOFA score > 2). High-grade fever and raised Procalcitonin markers necessitated escalation to broad-spectrum antibiotics as per standard antimicrobial stewardship protocol. De-escalation planned pending culture sensitivity reports (48h).`;
            navigator.clipboard.writeText(note);
            addToast('Justification copied to clipboard!', 'success');
        }
        setIsJustifierOpen(false);
    };

    // CSV Export function
    const handleExportCSV = () => {
        if (risks.length === 0) {
            addToast('No data to export', 'info');
            return;
        }

        const headers = ['Patient ID', 'Risk Category', 'Description', 'Potential Loss (₹)'];
        const rows = risks.map(r => [
            r.patientId.slice(0, 8).toUpperCase(),
            r.category,
            `"${r.description.replace(/"/g, '""')}"`,
            r.potentialLoss
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `revenue-audit-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        addToast('CSV exported successfully!', 'success');
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Revenue Assurance & TPA Desk</h1>
                    <p className="text-muted-foreground">Medical Superintendent View</p>
                </div>
                <div className="flex gap-3">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
                        <CheckCircle className="w-3 h-3 mr-1.5" /> NABH Compliant
                    </Badge>
                </div>
            </header>

            {/* Ticker Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-rose-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Potential Leakage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-1" />
                            {(totalLeakage / 100000).toFixed(2)} Lakh
                        </div>
                        <p className="text-xs text-rose-600/80 mt-1 font-medium">Action Required Immediately</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Recovered via Audit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 flex items-center">
                            <IndianRupee className="w-5 h-5 mr-1" />
                            {(recovered / 1000).toFixed(0)},000
                        </div>
                        <p className="text-xs text-emerald-600/80 mt-1 font-medium">This Month</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Discharge TAT</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 flex items-center">
                            <Clock className="w-5 h-5 mr-2" />
                            {dischargeTAT} Hrs
                        </div>
                        <p className="text-xs text-amber-600/80 mt-1 font-medium">Target: 2.0 Hrs</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Leakage Chart */}
                <Card className="lg:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Leakage Sources</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                <Tooltip
                                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Leakage']}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Pharmacy' ? '#f43f5e' : '#64748b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Right: Audit Findings Table */}
                <Card className="lg:col-span-2 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>Live Audit Findings</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-normal">{risks.length} Issues Found</Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={handleExportCSV}
                                >
                                    <Download className="w-3 h-3 mr-1" />
                                    Export CSV
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="w-[120px]">Patient ID</TableHead>
                                    <TableHead className="w-[100px]">Risk Type</TableHead>
                                    <TableHead>Finding</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[140px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {risks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No revenue risks detected.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    risks.map((risk) => (
                                        <TableRow key={risk.id} className="group">
                                            <TableCell className="font-mono text-xs font-medium text-slate-600">
                                                {risk.patientId.slice(0, 8).toUpperCase()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        risk.category === 'Consumable Leak' ? "bg-orange-100 text-orange-700 hover:bg-orange-100 border-none" :
                                                            risk.category === 'TPA Rejection Risk' ? "bg-rose-100 text-rose-700 hover:bg-rose-100 border-none" :
                                                                "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                                                    }
                                                >
                                                    {risk.category === 'Consumable Leak' ? 'Leakage' :
                                                        risk.category === 'TPA Rejection Risk' ? 'TPA Risk' : 'Rent Cap'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-700 max-w-[300px]">
                                                {risk.description}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-slate-900">
                                                ₹ {risk.potentialLoss.toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell>
                                                {risk.category === 'TPA Rejection Risk' ? (
                                                    <Button
                                                        size="sm" variant="outline"
                                                        className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                                                        onClick={() => handleOpenJustifier(risk)}
                                                    >
                                                        <BrainCircuit className="w-3 h-3 mr-1.5" />
                                                        AI Justify
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm" variant="outline"
                                                        className="h-7 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        onClick={() => navigate(`/patient-v2/${risk.patientId}`)}
                                                    >
                                                        Review
                                                        <ArrowRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* TPA Justifier Dialog */}
            <Dialog open={isJustifierOpen} onOpenChange={setIsJustifierOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-indigo-900">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                            AI Medical Necessity Note
                        </DialogTitle>
                        <DialogDescription>
                            Generated justification for high-value medication usage to prevent TPA deductions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 text-sm leading-relaxed text-slate-800 font-medium">
                            {selectedRisk && (
                                <p>
                                    Patient {selectedRisk.patientId.slice(0, 8)} diagnosed with suspected Sepsis (SOFA score &gt; 2).
                                    Attributes of <span className="bg-yellow-200/50 px-1 rounded text-yellow-900">High-grade fever (102°F)</span> and
                                    <span className="bg-yellow-200/50 px-1 rounded text-yellow-900 ml-1">raised Procalcitonin</span> markers
                                    necessitated escalation to broad-spectrum antibiotics (Meropenem) as per standard antimicrobial stewardship protocol.
                                    De-escalation planned pending culture sensitivity reports (48h).
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsJustifierOpen(false)}>Close</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={handleCopyNote}>
                            <Copy className="w-4 h-4" />
                            Copy for Insurance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RevenueDashboard;
