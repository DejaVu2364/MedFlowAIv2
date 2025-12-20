import React, { useState, useMemo } from 'react';
import { usePatient } from '../contexts/PatientContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    FileCheck,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Sparkles,
    Copy,
    ExternalLink,
    Loader2,
    IndianRupee
} from 'lucide-react';
import {
    generateMockTPARequests,
    generatePreAuthLetter,
    TPARequest,
    PreAuthLetter
} from '../services/tpaService';
import { useToast } from '../contexts/ToastContext';
import { cn } from '../lib/utils';

const TPADesk: React.FC = () => {
    const { patients } = usePatient();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<TPARequest | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLetter, setGeneratedLetter] = useState<PreAuthLetter | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    // Generate mock TPA requests from actual patients
    const tpaRequests = useMemo(() => {
        return generateMockTPARequests(patients);
    }, [patients]);

    // Filter requests based on search and tab
    const filteredRequests = useMemo(() => {
        let filtered = tpaRequests;

        // Tab filter
        if (activeTab !== 'all') {
            filtered = filtered.filter(req => {
                if (activeTab === 'pending') return req.status === 'Pending';
                if (activeTab === 'approved') return req.status === 'Approved' || req.status === 'Partially Approved';
                if (activeTab === 'rejected') return req.status === 'Rejected';
                if (activeTab === 'urgent') return req.urgencyLevel === 'High';
                return true;
            });
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(req =>
                req.patientName.toLowerCase().includes(query) ||
                req.insuranceProvider.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [tpaRequests, searchQuery, activeTab]);

    // Calculate aging buckets
    const agingBuckets = useMemo(() => {
        const now = Date.now();
        const pending = tpaRequests.filter(r => r.status === 'Pending');

        return {
            '0-7d': pending.filter(r => (now - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24) <= 7),
            '8-15d': pending.filter(r => {
                const days = (now - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
                return days > 7 && days <= 15;
            }),
            '16-30d': pending.filter(r => {
                const days = (now - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
                return days > 15 && days <= 30;
            }),
            '30d+': pending.filter(r => (now - r.submittedAt.getTime()) / (1000 * 60 * 60 * 24) > 30)
        };
    }, [tpaRequests]);

    // Handle AI letter generation
    const handleGenerateLetter = async (req: TPARequest) => {
        const patient = patients.find(p => p.id === req.patientId);
        if (!patient) {
            addToast('Patient not found', 'error');
            return;
        }

        setSelectedRequest(req);
        setIsGenerating(true);
        setGeneratedLetter(null);

        try {
            const letter = await generatePreAuthLetter(patient);
            setGeneratedLetter(letter);
            addToast('Pre-auth letter generated!', 'success');
        } catch (error) {
            addToast('Failed to generate letter', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Copy letter to clipboard
    const handleCopyLetter = () => {
        if (generatedLetter?.letterContent) {
            navigator.clipboard.writeText(generatedLetter.letterContent);
            addToast('Letter copied to clipboard!', 'success');
        }
    };

    // Stats
    const stats = useMemo(() => ({
        total: tpaRequests.length,
        pending: tpaRequests.filter(r => r.status === 'Pending').length,
        approved: tpaRequests.filter(r => r.status === 'Approved' || r.status === 'Partially Approved').length,
        rejected: tpaRequests.filter(r => r.status === 'Rejected').length,
        urgent: tpaRequests.filter(r => r.urgencyLevel === 'High').length,
        totalPendingAmount: tpaRequests.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.requestedAmount, 0)
    }), [tpaRequests]);

    // Get days since submission
    const getDaysSince = (date: Date) => {
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <FileCheck className="w-7 h-7 text-purple-600" />
                        TPA & Insurance Desk
                    </h1>
                    <p className="text-muted-foreground">
                        Manage pre-authorizations, claims, and TPA queries
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient or insurer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                        />
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <p className="text-xs text-slate-500 uppercase">Total Requests</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className={cn("border-0 shadow-sm", stats.pending > 0 ? "bg-amber-50" : "bg-white")}>
                    <CardContent className="p-4">
                        <p className="text-xs text-amber-600 uppercase">Pending</p>
                        <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-emerald-50">
                    <CardContent className="p-4">
                        <p className="text-xs text-emerald-600 uppercase">Approved</p>
                        <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <p className="text-xs text-slate-500 uppercase">Pending Amount</p>
                        <p className="text-xl font-bold text-slate-900">₹{(stats.totalPendingAmount / 100000).toFixed(1)}L</p>
                    </CardContent>
                </Card>
                <Card className={cn("border-0 shadow-sm", stats.urgent > 0 ? "bg-rose-50" : "bg-white")}>
                    <CardContent className="p-4">
                        <p className="text-xs text-rose-600 uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Urgent (&gt;24hrs)
                        </p>
                        <p className="text-2xl font-bold text-rose-700">{stats.urgent}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Aging Buckets */}
            <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Pending Aging</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        {[
                            { label: '0-7 days', data: agingBuckets['0-7d'], color: 'bg-emerald-100 text-emerald-700' },
                            { label: '8-15 days', data: agingBuckets['8-15d'], color: 'bg-amber-100 text-amber-700' },
                            { label: '16-30 days', data: agingBuckets['16-30d'], color: 'bg-orange-100 text-orange-700' },
                            { label: '30+ days', data: agingBuckets['30d+'], color: 'bg-rose-100 text-rose-700' }
                        ].map(bucket => (
                            <div key={bucket.label} className={cn("flex-1 p-3 rounded-lg", bucket.color)}>
                                <p className="text-xs font-medium">{bucket.label}</p>
                                <p className="text-xl font-bold">{bucket.data.length}</p>
                                <p className="text-xs opacity-70">
                                    ₹{(bucket.data.reduce((sum, r) => sum + r.requestedAmount, 0) / 1000).toFixed(0)}K
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Request List */}
                <Card className="lg:col-span-2 border-0 shadow-sm bg-white overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <CardHeader className="pb-0">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="approved">Approved</TabsTrigger>
                                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                                <TabsTrigger value="urgent">Urgent</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Insurance</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No requests found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRequests.map((req) => (
                                            <TableRow
                                                key={req.id}
                                                className={cn(
                                                    "cursor-pointer hover:bg-slate-50",
                                                    selectedRequest?.id === req.id && "bg-purple-50"
                                                )}
                                                onClick={() => setSelectedRequest(req)}
                                            >
                                                <TableCell className="font-medium">{req.patientName}</TableCell>
                                                <TableCell className="text-sm text-slate-600">{req.insuranceProvider}</TableCell>
                                                <TableCell className="tabular-nums">₹{(req.requestedAmount / 1000).toFixed(0)}K</TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "text-xs font-medium",
                                                        getDaysSince(req.submittedAt) > 3 && "text-amber-600",
                                                        getDaysSince(req.submittedAt) > 7 && "text-rose-600"
                                                    )}>
                                                        {getDaysSince(req.submittedAt)}d
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={req.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/patient-v2/${req.patientId}`);
                                                        }}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Tabs>
                </Card>

                {/* Detail Panel */}
                <Card className="border-0 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            AI Pre-Auth Generator
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedRequest ? (
                            <>
                                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                                    <p className="font-medium text-slate-900">{selectedRequest.patientName}</p>
                                    <p className="text-sm text-slate-500">{selectedRequest.insuranceProvider}</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <IndianRupee className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium">₹{selectedRequest.requestedAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleGenerateLetter(selectedRequest)}
                                    disabled={isGenerating}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate Pre-Auth Letter
                                        </>
                                    )}
                                </Button>

                                {generatedLetter && (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-xs font-medium text-emerald-700">Generated Letter</p>
                                                <Button size="sm" variant="ghost" onClick={handleCopyLetter}>
                                                    <Copy className="w-3 h-3 mr-1" />
                                                    Copy
                                                </Button>
                                            </div>
                                            <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-6">
                                                {generatedLetter.letterContent}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2 bg-slate-50 rounded">
                                                <p className="text-slate-500">Diagnosis</p>
                                                <p className="font-medium truncate">{generatedLetter.diagnosis}</p>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded">
                                                <p className="text-slate-500">Est. LOS</p>
                                                <p className="font-medium">{generatedLetter.expectedLOS} days</p>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded col-span-2">
                                                <p className="text-slate-500">Est. Cost</p>
                                                <p className="font-medium">₹{generatedLetter.estimatedCost.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Select a request to generate AI pre-auth letter</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: TPARequest['status'] }> = ({ status }) => {
    const config = {
        'Pending': { icon: Clock, className: 'bg-amber-100 text-amber-700 border-amber-200' },
        'Approved': { icon: CheckCircle, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        'Partially Approved': { icon: CheckCircle, className: 'bg-blue-100 text-blue-700 border-blue-200' },
        'Rejected': { icon: XCircle, className: 'bg-rose-100 text-rose-700 border-rose-200' },
        'Query': { icon: AlertTriangle, className: 'bg-purple-100 text-purple-700 border-purple-200' }
    };

    const { icon: Icon, className } = config[status];

    return (
        <Badge variant="outline" className={cn("text-xs", className)}>
            <Icon className="w-3 h-3 mr-1" />
            {status}
        </Badge>
    );
};

export default TPADesk;
