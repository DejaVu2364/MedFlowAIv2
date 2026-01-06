import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { Patient, OrderCategory, OrderPriority } from '../types';
import {
    Activity,
    FileText,
    Pill,
    Stethoscope,
    ClipboardList,
    Search,
    Plus,
    Send,
    Beaker,
    Image as ImageIcon,
    Syringe,
    Scissors,
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TriageBadge } from '../components/common/TriageBadge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

// External Components
import ClinicalFileV2 from '../components/clinical/ClinicalFileV2';
import MedViewRedesigned from '../components/medview/MedViewRedesigned';
import { VitalsRedesigned } from '../components/vitals/VitalsRedesigned';
import { RoundsRedesigned } from '../components/rounds/RoundsRedesigned';
import { PatientJourney } from '../components/patient/PatientJourney';


// --- PATIENT HEADER ---

const PatientHeader: React.FC<{ patient: Patient; onTabChange: (tab: any) => void; navigate: any }> = React.memo(({ patient, onTabChange, navigate }) => {
    const vitals = patient.vitals;

    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                {/* Left: Patient Info */}
                <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                        {patient.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{patient.name}</h1>
                            <TriageBadge level={patient.triage.level} className="text-[10px] uppercase tracking-wider font-bold" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{patient.age}y</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-medium text-foreground">{patient.gender}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-mono text-xs">MRN: {patient.id.slice(0, 8).toUpperCase()}</span>
                            {patient.bedAssignment && (
                                <>
                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                    <span className="text-primary font-semibold">{patient.bedAssignment.wardId}, Bed {patient.bedAssignment.bedLabel}</span>
                                </>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {patient.chiefComplaints?.map((c, i) => (
                                <Badge key={i} variant="secondary" className="text-xs font-normal bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                                    {c.complaint} <span className="opacity-50 ml-1">({c.durationValue}{c.durationUnit.charAt(0)})</span>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Vitals at a Glance */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex flex-col items-center px-3 py-1.5 bg-muted/50 rounded-lg border min-w-[60px]">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">HR</span>
                        <span className={cn("text-sm font-bold", vitals?.pulse && vitals.pulse > 100 ? "text-destructive" : "text-foreground")}>{vitals?.pulse || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 bg-muted/50 rounded-lg border min-w-[70px]">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">BP</span>
                        <span className="text-sm font-bold text-foreground">{vitals?.bp_sys || '--'}/{vitals?.bp_dia || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 bg-muted/50 rounded-lg border min-w-[60px]">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">SpO2</span>
                        <span className={cn("text-sm font-bold", vitals?.spo2 && vitals.spo2 < 95 ? "text-destructive" : "text-foreground")}>{vitals?.spo2 || '--'}%</span>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 bg-muted/50 rounded-lg border min-w-[50px]">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Temp</span>
                        <span className={cn("text-sm font-bold", vitals?.temp_c && vitals.temp_c > 38 ? "text-destructive" : "text-foreground")}>{vitals?.temp_c?.toFixed(1) || '--'}°</span>
                    </div>
                </div>
            </div>
            <Separator />
        </div>
    );
});


// --- CLINICAL CONTEXT BAR (Persistent across all tabs) ---
// Doctor's Quick Glance: Active Problems, Pending Actions, Key Metrics

const ClinicalContextBar: React.FC<{ patient: Patient }> = React.memo(({ patient }) => {
    // Calculate days since admission
    const daysSinceAdmission = patient.admissionDate
        ? Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Count pending orders
    const pendingOrders = patient.orders?.filter(o => o.status === 'draft').length || 0;
    const urgentOrders = patient.orders?.filter(o => o.priority === 'STAT' || o.priority === 'urgent').length || 0;

    // Clinical file status
    const clinicalFileStatus = patient.clinicalFile?.status || 'draft';

    // Active problems (show top 3)
    const activeProblems = patient.activeProblems?.slice(0, 3) || [];

    // Check if any vitals are concerning
    const vitals = patient.vitals;
    const concerningVitals = vitals && (
        (vitals.spo2 && vitals.spo2 < 94) ||
        (vitals.pulse && vitals.pulse > 110) ||
        (vitals.temp_c && vitals.temp_c > 38.5) ||
        (vitals.bp_sys && vitals.bp_sys < 90)
    );

    return (
        <div className="flex items-center gap-3 py-2 px-4 bg-gradient-to-r from-slate-50 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-lg border border-border/30 mb-4 overflow-x-auto">
            {/* Active Problems */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Problems:</span>
                {activeProblems.length > 0 ? (
                    <div className="flex gap-1">
                        {activeProblems.map(prob => (
                            <Badge
                                key={prob.id}
                                variant="secondary"
                                className={cn(
                                    "text-[10px] font-medium py-0.5",
                                    prob.status === 'urgent' && "bg-rose-100 text-rose-700 border-rose-200",
                                    prob.status === 'improving' && "bg-emerald-100 text-emerald-700 border-emerald-200",
                                    prob.status === 'monitor' && "bg-amber-100 text-amber-700 border-amber-200"
                                )}
                            >
                                {prob.description.length > 25 ? prob.description.slice(0, 22) + '...' : prob.description}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                )}
            </div>

            <div className="h-4 w-px bg-border/50" />

            {/* Pending Orders */}
            <div className="flex items-center gap-1.5 shrink-0">
                <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                {pendingOrders > 0 ? (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-semibold py-0.5">
                        {pendingOrders} pending
                    </Badge>
                ) : (
                    <span className="text-xs text-emerald-600 font-medium">✓ Orders sent</span>
                )}
                {urgentOrders > 0 && (
                    <Badge variant="destructive" className="text-[10px] py-0.5">
                        {urgentOrders} urgent
                    </Badge>
                )}
            </div>

            <div className="h-4 w-px bg-border/50" />

            {/* Length of Stay */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">LOS:</span>
                <span className={cn(
                    "text-xs font-bold",
                    daysSinceAdmission > 5 ? "text-amber-600" : "text-foreground"
                )}>
                    {daysSinceAdmission}d
                </span>
            </div>

            <div className="h-4 w-px bg-border/50" />

            {/* Clinical File Status */}
            <div className="flex items-center gap-1.5 shrink-0">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                {clinicalFileStatus === 'signed' ? (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Signed
                    </span>
                ) : (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-medium py-0.5">
                        File: Draft
                    </Badge>
                )}
            </div>

            {/* Vital Alert */}
            {concerningVitals && (
                <>
                    <div className="h-4 w-px bg-border/50" />
                    <Badge variant="destructive" className="text-[10px] py-0.5 animate-pulse">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Vitals Alert
                    </Badge>
                </>
            )}
        </div>
    );
});


// --- ORDERS TAB (Legacy Logic Wrapped) ---

const CATALOG_ITEMS: Record<OrderCategory, string[]> = {
    investigation: [
        'Complete Blood Count (CBC)', 'Basic Metabolic Panel (BMP)', 'Comprehensive Metabolic Panel (CMP)',
        'Liver Function Tests (LFT)', 'Lipid Panel', 'Thyroid Stimulating Hormone (TSH)',
        'Hemoglobin A1c', 'Urinalysis', 'Urine Culture', 'Coagulation Profile (PT/INR/PTT)',
        'Troponin I', 'D-Dimer', 'Blood Culture x2', 'Serum Lactate', 'Procalcitonin',
        'Arterial Blood Gas (ABG)', 'Serum Electrolytes', 'Iron Studies', 'Vitamin B12 / Folate',
        'C-Reactive Protein (CRP)', 'ESR', 'Dengue Serology (NS1, IgM, IgG)', 'Peripheral Smear for MP',
        'Widal Test', 'Rapid Malaria Antigen', 'Stool Routine & Microscopy', 'Renal Function Test (Urea/Creat)'
    ],
    radiology: [
        'CXR - PA View', 'CXR - AP View', 'CXR - Lateral', 'CT Head Non-Contrast', 'CT Head w/ Contrast',
        'CT Abdomen/Pelvis w/ Contrast', 'CT Chest Pulmonary Angiogram', 'MRI Brain', 'MRI Spine',
        'Ultrasound Abdomen', 'Ultrasound KUB', 'Ultrasound Doppler Lower Limb', 'X-Ray Left Arm',
        'X-Ray Right Arm', 'X-Ray Left Leg', 'X-Ray Right Leg', 'Echocardiogram'
    ],
    medication: [
        'Paracetamol 500mg PO', 'Paracetamol 1g IV', 'Ibuprofen 400mg PO', 'Morphine 2mg IV',
        'Fentanyl 50mcg IV', 'Ondansetron 4mg IV', 'Metoclopramide 10mg IV', 'Pantoprazole 40mg IV',
        'Ceftriaxone 1g IV', 'Amoxicillin 500mg PO', 'Piperacillin-Tazobactam 4.5g IV', 'Vancomycin 1g IV',
        'Azithromycin 500mg PO', 'Furosemide 40mg IV', 'Metoprolol 25mg PO', 'Amlodipine 5mg PO',
        'Normal Saline 500ml Bolus', 'Lactated Ringers 1L', 'D5W 1L', 'Insulin Regular', 'Insulin Glargine',
        'Atorvastatin 40mg PO', 'Aspirin 75mg PO', 'Ceftriaxone 2g IV BD', 'Doxycycline 100mg PO'
    ],
    procedure: [
        'Peripheral IV Cannulation', 'Urinary Catheterization', 'Nasogastric Tube Insertion',
        'ECG (12 Lead)', 'Wound Dressing', 'Suturing', 'Blood Transfusion', 'Central Line Insertion',
        'Lumbar Puncture', 'Paracentesis', 'Thoracentesis', 'Splint Application', 'Cast Application'
    ],
    nursing: [
        'Vitals Monitoring q4h', 'Vitals Monitoring q1h', 'Strict I/O Charting', 'Fall Risk Precautions',
        'Bed Rest', 'Ambulate with Assistance', 'Diabetic Diet', 'NPO', 'Clear Liquid Diet', 'Neurological Obs q1h'
    ],
    referral: [
        'Cardiology Consult', 'General Surgery Consult', 'Orthopedics Consult', 'Neurology Consult',
        'Gastroenterology Consult', 'Nephrology Consult', 'Infectious Disease Consult', 'Physiotherapy', 'Dietician'
    ]
};

// AI Order Suggestion Helper - maps conditions to common orders
const getSuggestedOrders = (condition: string): { label: string; category: OrderCategory }[] => {
    const c = condition.toLowerCase();
    if (c.includes('fever') || c.includes('infection')) {
        return [
            { label: 'Complete Blood Count (CBC)', category: 'investigation' },
            { label: 'C-Reactive Protein (CRP)', category: 'investigation' },
            { label: 'Blood Culture x2', category: 'investigation' },
        ];
    }
    if (c.includes('chest pain') || c.includes('cardiac') || c.includes('stemi') || c.includes('mi')) {
        return [
            { label: 'Troponin I', category: 'investigation' },
            { label: 'ECG (12 Lead)', category: 'procedure' },
            { label: 'CXR - PA View', category: 'radiology' },
        ];
    }
    if (c.includes('breath') || c.includes('copd') || c.includes('asthma') || c.includes('dyspnea')) {
        return [
            { label: 'Arterial Blood Gas (ABG)', category: 'investigation' },
            { label: 'CXR - PA View', category: 'radiology' },
            { label: 'Nebulization - Salbutamol + Ipratropium', category: 'medication' },
        ];
    }
    if (c.includes('diabetes') || c.includes('dm') || c.includes('sugar')) {
        return [
            { label: 'Hemoglobin A1c', category: 'investigation' },
            { label: 'Renal Function Test (Urea/Creat)', category: 'investigation' },
        ];
    }
    if (c.includes('head') || c.includes('injury') || c.includes('trauma')) {
        return [
            { label: 'CT Head Non-Contrast', category: 'radiology' },
            { label: 'Complete Blood Count (CBC)', category: 'investigation' },
        ];
    }
    // Default suggestions
    return [
        { label: 'Complete Blood Count (CBC)', category: 'investigation' },
        { label: 'Basic Metabolic Panel (BMP)', category: 'investigation' },
    ];
};

const OrdersTab: React.FC<{ patient: Patient }> = React.memo(({ patient }) => {
    const { updateOrder, addOrderToPatient, sendAllDrafts } = usePatient();
    const [activeCategory, setActiveCategory] = useState<OrderCategory>('investigation');
    const [searchTerm, setSearchTerm] = useState('');

    const categories: { key: OrderCategory; label: string; icon: any }[] = [
        { key: 'investigation', label: 'Labs', icon: Beaker },
        { key: 'radiology', label: 'Imaging', icon: ImageIcon },
        { key: 'medication', label: 'Meds', icon: Syringe },
        { key: 'procedure', label: 'Procedures', icon: Scissors },
    ];

    const filteredOrders = useMemo(() => patient.orders.filter(o => o.category === activeCategory), [patient.orders, activeCategory]);

    const filteredCatalog = useMemo(() => {
        const items = CATALOG_ITEMS[activeCategory] || [];
        if (!searchTerm) return items;
        return items.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeCategory, searchTerm]);

    const handleCatalogClick = (itemLabel: string) => {
        addOrderToPatient(patient.id, {
            category: activeCategory,
            label: itemLabel,
            priority: 'routine',
            instructions: activeCategory === 'medication' ? 'Review dosage before admin' : '',
            payload: {},
            subType: 'generic'
        });
        setSearchTerm('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
            {/* Catalog Sidebar */}
            <div className="lg:col-span-4 flex flex-col border border-border/50 dark:border-white/5 rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b border-border/50 dark:border-white/5 bg-muted/30">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={`Search ${activeCategory}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 h-9 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex gap-1 mt-3 overflow-x-auto pb-1 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                                    activeCategory === cat.key
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-background hover:bg-muted text-muted-foreground"
                                )}
                            >
                                <cat.icon className="w-3.5 h-3.5" /> {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                        {filteredCatalog.map((item) => (
                            <button
                                key={item}
                                onClick={() => handleCatalogClick(item)}
                                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors flex items-center justify-between group"
                            >
                                {item}
                                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Orders */}
            <div className="lg:col-span-8 flex flex-col border border-border/50 dark:border-white/5 rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b border-border/50 dark:border-white/5 flex justify-between items-center bg-muted/30">
                    <h3 className="font-semibold text-sm">Active Orders ({filteredOrders.length})</h3>
                    <Button
                        size="sm"
                        onClick={() => sendAllDrafts(patient.id, activeCategory)}
                        disabled={filteredOrders.filter(o => o.status === 'draft').length === 0}
                    >
                        <Send className="w-3.5 h-3.5 mr-2" />
                        Sign & Send
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <div
                            key={order.orderId}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border shadow-sm transition-all duration-200",
                                order.status === 'draft'
                                    ? "bg-draft border-draft-foreground/30 shadow-[0_2px_8px_rgba(251,191,36,0.05)]"
                                    : "bg-background border-border/50 hover:shadow-md hover:border-border/80"
                            )}
                        >
                            <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("font-medium text-sm", order.status === 'draft' ? "text-draft-foreground font-semibold" : "text-foreground")}>
                                        {order.label}
                                    </span>
                                    {order.status === 'draft' && (
                                        <Badge variant="outline" className="text-[10px] bg-draft-foreground/10 text-draft-foreground border-draft-foreground/20 font-medium px-2">
                                            Draft
                                        </Badge>
                                    )}
                                </div>
                                {order.category === 'medication' && (
                                    <Input
                                        type="text"
                                        placeholder="Add instructions..."
                                        value={order.instructions || ''}
                                        onChange={(e) => updateOrder(patient.id, order.orderId, { instructions: e.target.value })}
                                        className="mt-1 w-full h-8 text-xs bg-white/50 border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={order.priority}
                                    onChange={e => updateOrder(patient.id, order.orderId, { priority: e.target.value as OrderPriority })}
                                    className="h-8 text-xs bg-transparent border-0 rounded-md px-2 py-1 focus:outline-none cursor-pointer font-medium text-muted-foreground hover:text-foreground hover:bg-black/5"
                                >
                                    <option value="routine">Routine</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="STAT">STAT</option>
                                </select>
                                <Button
                                    size="sm"
                                    variant={order.status === 'draft' ? 'default' : 'secondary'}
                                    className={cn(
                                        "h-8 px-4 text-xs font-semibold shadow-sm",
                                        order.status === 'draft' && "bg-draft-foreground hover:bg-draft-foreground/90 text-white border-0"
                                    )}
                                    onClick={() => updateOrder(patient.id, order.orderId, { status: 'sent' })}
                                >
                                    {order.status === 'draft' ? 'Sign & Send' : 'Update'}
                                </Button>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                            <div className="p-4 rounded-full bg-indigo-50 mb-4">
                                <Sparkles className="w-8 h-8 text-indigo-500" />
                            </div>
                            <p className="text-sm font-semibold text-foreground mb-2">No orders yet</p>
                            <p className="text-xs text-muted-foreground mb-4 text-center max-w-xs">
                                Based on this patient's presentation, consider:
                            </p>
                            {/* AI-Suggested Quick Orders */}
                            <div className="flex flex-col gap-3 max-w-md">
                                {patient.chiefComplaints?.slice(0, 1).map(c => {
                                    const suggestions = getSuggestedOrders(c.complaint);
                                    return (
                                        <div key={c.complaint} className="flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase">
                                                From Complaint: {c.complaint}
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestions.map(s => (
                                                    <Button
                                                        key={s.label}
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-8 gap-1.5 bg-indigo-50/50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                                                        onClick={() => handleCatalogClick(s.label)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        {s.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {patient.activeProblems?.slice(0, 1).map(p => {
                                    const suggestions = getSuggestedOrders(p.description);
                                    return (
                                        <div key={p.id} className="flex flex-col gap-2">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                                From Problem: {p.description.slice(0, 30)}
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestions.slice(0, 2).map(s => (
                                                    <Button
                                                        key={s.label}
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-8 gap-1.5 bg-emerald-50/50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                                                        onClick={() => handleCatalogClick(s.label)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        {s.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

// --- MAIN PAGE COMPONENT ---

const PatientDetailPage: React.FC = () => {
    const { id, tab } = useParams<{ id: string; tab?: string }>();
    const navigate = useNavigate();
    const { patients, isLoading } = usePatient();
    const { currentUser } = useAuth();

    // Default to medview if no tab specified
    const activeTab = tab || 'medview';

    // Reset scroll on tab change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);

    const handleTabChange = (value: string) => {
        if (value === 'discharge') {
            navigate(`/patient/${id}/discharge`);
            return;
        }
        navigate(`/patient/${id}/${value}`);
    };

    const patient = useMemo(() => patients.find(p => p.id === id), [patients, id]);

    if (!patient) {
        if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
        return <div className="flex items-center justify-center h-screen">Patient not found</div>;
    }

    const tabs = [
        { id: 'medview', label: 'MedView', icon: Pill },
        { id: 'clinical', label: 'Clinical File', icon: FileText },
        { id: 'orders', label: 'Orders', icon: ClipboardList },
        { id: 'vitals', label: 'Vitals', icon: Activity },
        { id: 'rounds', label: 'Rounds', icon: Stethoscope },
        { id: 'discharge', label: 'Discharge', icon: FileText },
    ] as const;

    return (
        <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
            <PatientHeader patient={patient} onTabChange={handleTabChange} navigate={navigate} />
            <ClinicalContextBar patient={patient} />

            <div className="w-full px-6">
                {/* Tabs - v0 Style */}
                <div className="border-b border-border mb-6">
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleTabChange(t.id)}
                                className={cn(
                                    "flex items-center gap-2 pb-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === t.id
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                                {activeTab === t.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[500px]">
                    {activeTab === 'clinical' && <ClinicalFileV2 patient={patient} />}
                    {activeTab === 'orders' && <OrdersTab patient={patient} />}
                    {activeTab === 'vitals' && <VitalsRedesigned patient={patient} />}
                    {activeTab === 'medview' && <MedViewRedesigned patient={patient} />}
                    {activeTab === 'rounds' && <RoundsRedesigned patient={patient} />}
                    {activeTab === 'discharge' && <div className="p-4 text-center">Redirecting to Discharge Module...</div>}
                </div>
            </div>
        </div>
    );
};

export default PatientDetailPage;
