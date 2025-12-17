import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { FileCheck, Search, Filter } from 'lucide-react';

const TPADesk: React.FC = () => {
    // Mock Data
    const requests = [
        { id: 'tpa-1', patient: 'Rajesh Kumar', provider: 'GIPSA (Star Health)', amount: 125000, status: 'Pending', risk: 'High' },
        { id: 'tpa-2', patient: 'Sarah Khan', provider: 'HDFC Ergo', amount: 45000, status: 'Approved', risk: 'Low' },
        { id: 'tpa-3', patient: 'Amit Patel', provider: 'ICICI Lombard', amount: 85000, status: 'Pending', risk: 'Medium' },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">TPA & Insurance Desk</h1>
                    <p className="text-muted-foreground">Manage pre-auths, claims, and justification requests</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                    <Button><Search className="w-4 h-4 mr-2" /> Search Claims</Button>
                </div>
            </header>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-purple-600" />
                        Pending Justification Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient Name</TableHead>
                                <TableHead>Insurance Provider</TableHead>
                                <TableHead>Claim Amount</TableHead>
                                <TableHead>Risk Level</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No active queries
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.patient}</TableCell>
                                        <TableCell>{req.provider}</TableCell>
                                        <TableCell>₹ {req.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.risk === 'High' ? 'destructive' : req.risk === 'Medium' ? 'outline' : 'secondary'} className={req.risk === 'Medium' ? 'border-amber-500 text-amber-600' : ''}>
                                                {req.risk}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default TPADesk;
