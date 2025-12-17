import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Mic, FileText, Sparkles, Activity, Loader2, History, ShoppingCart, Package, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { generateSOAPDraft, SOAPDraftResponse } from '../../services/geminiService';
import { usePatient } from '../../contexts/PatientContext';
import { useParams } from 'react-router-dom';
import { ScrollArea } from '../ui/scroll-area';

interface ScribeSidePanelProps {
    onDraftGenerated?: (draft: SOAPDraftResponse) => void;
}

export const ScribeSidePanel: React.FC<ScribeSidePanelProps> = ({ onDraftGenerated }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastDraft, setLastDraft] = useState<SOAPDraftResponse | null>(null);

    const { id: patientId } = useParams<{ id: string }>();
    const { patients } = usePatient();
    const patient = patients.find(p => p.id === patientId);

    const handleToggleListening = () => {
        setIsListening(!isListening);
        if (!isListening) {
            console.log("Processing Scribe: Started Listening...");
            setTranscript("Doctor: Hello, tell me about your chest pain.\nPatient: It started about 2 hours ago...");
        } else {
            console.log("Processing Scribe: Stopped Listening.");
        }
    };

    const handleProcessDraft = async () => {
        setIsProcessing(true);
        try {
            const draft = await generateSOAPDraft(transcript || "Mock Transcript");
            setLastDraft(draft);
            if (onDraftGenerated) {
                onDraftGenerated(draft);
            }
        } catch (error) {
            console.error("Failed to process draft", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Get patient orders for Orders tab
    const draftOrders = patient?.orders.filter(o => o.status === 'draft') || [];
    const activeOrders = patient?.orders.filter(o => o.status !== 'draft' && o.status !== 'cancelled') || [];

    return (
        <div className="flex flex-col h-full">
            <Tabs defaultValue="scribe" className="flex flex-col h-full">
                <div className="flex-none p-4 border-b bg-slate-50/80 dark:bg-background/80 backdrop-blur-sm">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="scribe" className="text-xs">
                            <Mic className="w-3 h-3 mr-1" />
                            Scribe
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs">
                            <History className="w-3 h-3 mr-1" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="text-xs">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Orders
                            {draftOrders.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px] rounded-full">
                                    {draftOrders.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ============ SCRIBE TAB ============ */}
                <TabsContent value="scribe" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-6">
                            {/* Microphone Section */}
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                <Button
                                    onClick={handleToggleListening}
                                    className={cn(
                                        "h-16 w-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
                                        isListening ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200" : "bg-teal-600 hover:bg-teal-700"
                                    )}
                                >
                                    <Mic className="w-8 h-8 text-white" />
                                </Button>
                                <div className="text-center">
                                    <p className={cn("font-medium", isListening ? "text-red-600" : "text-muted-foreground")}>
                                        {isListening ? "Listening..." : "Start Session"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">AI Scribe Active</p>
                                </div>
                            </div>

                            {/* Live Transcript */}
                            {(isListening || transcript) && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Transcript</h3>
                                        {isListening ? (
                                            <Badge variant="outline" className="animate-pulse bg-red-50 text-red-600 border-red-200 py-0 h-5">REC</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs py-0 h-5">PAUSED</Badge>
                                        )}
                                    </div>
                                    <Card className="border-none shadow-inner bg-white dark:bg-muted/50">
                                        <CardContent className="p-3 text-sm text-muted-foreground min-h-[80px] whitespace-pre-wrap">
                                            {transcript || "Listening for medical conversation..."}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Draft Output Area */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extracted Clinical Data</h3>
                                </div>

                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 text-sm space-y-2">
                                    <p className="font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> Draft Vitals
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 pl-5 text-amber-800 dark:text-amber-200/80">
                                        <span>BP: <span className="font-mono font-semibold">{lastDraft ? "160/90" : "--/--"}</span></span>
                                        <span>HR: <span className="font-mono font-semibold">{lastDraft ? "98" : "--"}</span></span>
                                    </div>

                                    <div className="h-px bg-amber-200/50 dark:bg-amber-800/30 my-2" />

                                    <p className="font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Draft Notes
                                    </p>
                                    <p className="text-amber-800 dark:text-amber-200/80 pl-5 italic opacity-60">
                                        {lastDraft ? `${lastDraft.subjective.substring(0, 50)}...` : "No data extracted yet."}
                                    </p>
                                </div>

                                <Button
                                    disabled={isProcessing}
                                    onClick={handleProcessDraft}
                                    className={cn(
                                        "w-full border-dashed",
                                        lastDraft ? "bg-teal-600 text-white hover:bg-teal-700" : "text-muted-foreground hover:text-primary hover:border-primary"
                                    )}
                                    variant={lastDraft ? "default" : "outline"}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        lastDraft ? "Draft Ready (Process Again)" : "Process Drafts"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* ============ HISTORY TAB ============ */}
                <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient Timeline</h3>
                            </div>

                            {patient?.timeline && patient.timeline.length > 0 ? (
                                <div className="space-y-3">
                                    {patient.timeline.slice(0, 10).map((event, idx) => (
                                        <Card key={event.id || idx} className="border-slate-100">
                                            <CardContent className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Badge variant="outline" className="text-[10px] shrink-0">
                                                                {event.type === 'SOAP' ? 'SOAP Note' : event.type === 'TeamNote' ? 'Team Note' : 'Checklist'}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                {new Date(event.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {event.type === 'SOAP' ? event.s : event.type === 'TeamNote' ? event.content : event.title}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground/60 mt-1">by {event.author}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <History className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground">No timeline events yet</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Notes and events will appear here</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* ============ ORDERS TAB ============ */}
                <TabsContent value="orders" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-4">
                            {/* Draft Orders Section */}
                            {draftOrders.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pending Drafts ({draftOrders.length})</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {draftOrders.map(order => (
                                            <Card key={order.orderId} className="border-amber-200 bg-amber-50/50">
                                                <CardContent className="p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-amber-900 truncate">{order.label}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                                                                    {order.category}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                                                                    {order.priority}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active Orders Section */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Orders ({activeOrders.length})</h3>
                                </div>

                                {activeOrders.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeOrders.slice(0, 8).map(order => (
                                            <Card key={order.orderId} className="border-slate-100">
                                                <CardContent className="p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{order.label}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="secondary" className="text-[10px]">
                                                                    {order.category}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[10px]">
                                                                    {order.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm text-muted-foreground">No active orders</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">Orders will appear here once created</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};

