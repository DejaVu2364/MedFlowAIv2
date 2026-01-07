// ScribePreviewPanel.tsx - Editable preview of AI-extracted clinical data
// Shows extracted fields with inline editing before applying to clinical file

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import {
    Check,
    X,
    Edit2,
    AlertTriangle,
    MessageCircle,
    Plus,
    Trash2,
    Sparkles,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    ClinicalFileSections,
    HistorySectionData,
    GPESectionData,
    SystemicExamSectionData,
    Complaint,
    Allergy
} from '../../types';

interface ScribePreviewPanelProps {
    extractedData: Partial<ClinicalFileSections>;
    missingFields: string[];
    suggestedQuestions: string[];
    confidence: Record<string, number>;
    onApply: (data: Partial<ClinicalFileSections>) => void;
    onDiscard: () => void;
    onAskQuestion: (question: string) => void;
    isProcessing?: boolean;
}

// Editable Complaint Row
const ComplaintRow: React.FC<{
    complaint: Complaint;
    onChange: (c: Complaint) => void;
    onRemove: () => void;
}> = ({ complaint, onChange, onRemove }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                <Input
                    value={complaint.symptom}
                    onChange={(e) => onChange({ ...complaint, symptom: e.target.value })}
                    placeholder="Symptom"
                    className="flex-1"
                />
                <Input
                    value={complaint.duration || ''}
                    onChange={(e) => onChange({ ...complaint, duration: e.target.value })}
                    placeholder="Duration"
                    className="w-24"
                />
                <select
                    value={complaint.severity || ''}
                    onChange={(e) => onChange({ ...complaint, severity: e.target.value })}
                    className="h-9 px-2 rounded-md border border-input text-sm"
                >
                    <option value="">Severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                </select>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                    <Check className="w-4 h-4 text-green-600" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-2 bg-teal-50 rounded-md border border-teal-100">
            <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600" />
                <span className="font-medium">{complaint.symptom}</span>
                {complaint.duration && (
                    <Badge variant="secondary" className="text-xs">{complaint.duration}</Badge>
                )}
                {complaint.severity && (
                    <Badge
                        variant={complaint.severity === 'severe' ? 'destructive' : 'outline'}
                        className="text-xs capitalize"
                    >
                        {complaint.severity}
                    </Badge>
                )}
            </div>
            <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={onRemove}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
            </div>
        </div>
    );
};

// Missing Field Alert
const MissingFieldAlert: React.FC<{
    fieldName: string;
    question: string;
    onAsk: () => void;
    onMarkNKDA?: () => void;
    onSkip: () => void;
}> = ({ fieldName, question, onAsk, onMarkNKDA, onSkip }) => {
    return (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">{fieldName} not mentioned</p>
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        "{question}"
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={onAsk} className="text-xs h-7">
                    Ask Patient
                </Button>
                {onMarkNKDA && (
                    <Button size="sm" variant="outline" onClick={onMarkNKDA} className="text-xs h-7">
                        Mark as NKDA
                    </Button>
                )}
                <Button size="sm" variant="ghost" onClick={onSkip} className="text-xs h-7 text-muted-foreground">
                    Skip
                </Button>
            </div>
        </div>
    );
};

// Main Preview Panel
export const ScribePreviewPanel: React.FC<ScribePreviewPanelProps> = ({
    extractedData,
    missingFields,
    suggestedQuestions,
    confidence,
    onApply,
    onDiscard,
    onAskQuestion,
    isProcessing
}) => {
    const [editedData, setEditedData] = useState<Partial<ClinicalFileSections>>(extractedData);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['complaints', 'hpi']));
    const [dismissedFields, setDismissedFields] = useState<Set<string>>(new Set());

    // Update editedData when extractedData changes
    React.useEffect(() => {
        setEditedData(extractedData);
    }, [extractedData]);

    const toggleSection = (section: string) => {
        const next = new Set(expandedSections);
        if (next.has(section)) {
            next.delete(section);
        } else {
            next.add(section);
        }
        setExpandedSections(next);
    };

    const updateHistory = useCallback((updates: Partial<HistorySectionData>) => {
        setEditedData(prev => ({
            ...prev,
            history: { ...prev?.history, ...updates }
        }));
    }, []);

    const updateComplaints = useCallback((complaints: Complaint[]) => {
        updateHistory({ complaints });
    }, [updateHistory]);

    const addComplaint = () => {
        const current = editedData.history?.complaints || [];
        updateComplaints([...current, { symptom: '', duration: '', severity: '', notes: '' }]);
    };

    const removeComplaint = (index: number) => {
        const current = editedData.history?.complaints || [];
        updateComplaints(current.filter((_, i) => i !== index));
    };

    const updateComplaint = (index: number, updated: Complaint) => {
        const current = editedData.history?.complaints || [];
        const newComplaints = [...current];
        newComplaints[index] = updated;
        updateComplaints(newComplaints);
    };

    // Get confidence color
    const getConfidenceColor = (field: string) => {
        const conf = confidence[field];
        if (conf === undefined) return 'bg-gray-100';
        if (conf >= 0.8) return 'bg-green-100 border-green-200';
        if (conf >= 0.5) return 'bg-yellow-100 border-yellow-200';
        return 'bg-red-100 border-red-200';
    };

    // Get field name for missing field
    const getFieldLabel = (key: string): string => {
        const labels: Record<string, string> = {
            'allergy_history': 'Allergy History',
            'drug_history': 'Current Medications',
            'complaints': 'Chief Complaints',
            'past_medical_history': 'Past Medical History',
        };
        return labels[key] || key.replace(/_/g, ' ');
    };

    const getQuestionForField = (key: string): string => {
        const questions: Record<string, string> = {
            'allergy_history': 'Do you have any known drug allergies?',
            'drug_history': 'What medications are you currently taking?',
            'complaints': 'What brings you in today?',
            'past_medical_history': 'Do you have any existing medical conditions?',
        };
        return questions[key] || suggestedQuestions[0] || 'Could you tell me more?';
    };

    const handleMarkNKDA = () => {
        updateHistory({
            allergy_history: [] // Empty array = NKDA documented
        });
        setDismissedFields(prev => new Set(prev).add('allergy_history'));
    };

    return (
        <Card className="border-2 border-teal-200 shadow-lg">
            <CardHeader className="pb-2 bg-gradient-to-r from-teal-50 to-emerald-50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        Scribe Preview
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {Object.keys(confidence).length} fields extracted
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea className="max-h-[60vh]">
                    <div className="p-4 space-y-4">

                        {/* CHIEF COMPLAINTS */}
                        <div className="space-y-2">
                            <button
                                onClick={() => toggleSection('complaints')}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    📋 Chief Complaints
                                    <Badge variant="secondary" className="text-xs">
                                        {editedData.history?.complaints?.length || 0}
                                    </Badge>
                                </h4>
                                {expandedSections.has('complaints') ?
                                    <ChevronUp className="w-4 h-4" /> :
                                    <ChevronDown className="w-4 h-4" />
                                }
                            </button>

                            {expandedSections.has('complaints') && (
                                <div className="space-y-2 pl-6">
                                    {(editedData.history?.complaints || []).map((c, i) => (
                                        <ComplaintRow
                                            key={i}
                                            complaint={c}
                                            onChange={(updated) => updateComplaint(i, updated)}
                                            onRemove={() => removeComplaint(i)}
                                        />
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addComplaint}
                                        className="text-xs h-7 gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Complaint
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* HPI */}
                        {editedData.history?.hpi && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => toggleSection('hpi')}
                                    className="flex items-center justify-between w-full text-left"
                                >
                                    <h4 className="font-semibold text-sm">📝 History of Present Illness</h4>
                                    {expandedSections.has('hpi') ?
                                        <ChevronUp className="w-4 h-4" /> :
                                        <ChevronDown className="w-4 h-4" />
                                    }
                                </button>

                                {expandedSections.has('hpi') && (
                                    <div className={cn("p-3 rounded-md border", getConfidenceColor('hpi'))}>
                                        <Textarea
                                            value={editedData.history.hpi}
                                            onChange={(e) => updateHistory({ hpi: e.target.value })}
                                            className="min-h-[80px] bg-transparent border-0 p-0 focus-visible:ring-0"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PAST HISTORY */}
                        {(editedData.history?.past_medical_history || editedData.history?.past_surgical_history) && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">🏥 Past History</h4>
                                <div className="space-y-2 pl-6">
                                    {editedData.history?.past_medical_history && (
                                        <div className="p-2 bg-slate-50 rounded-md">
                                            <label className="text-xs text-muted-foreground">Medical History</label>
                                            <Input
                                                value={editedData.history.past_medical_history}
                                                onChange={(e) => updateHistory({ past_medical_history: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                    {editedData.history?.past_surgical_history && (
                                        <div className="p-2 bg-slate-50 rounded-md">
                                            <label className="text-xs text-muted-foreground">Surgical History</label>
                                            <Input
                                                value={editedData.history.past_surgical_history}
                                                onChange={(e) => updateHistory({ past_surgical_history: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* GPE FLAGS */}
                        {editedData.gpe?.flags && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">🩺 General Examination</h4>
                                <div className="flex flex-wrap gap-1 pl-6">
                                    {Object.entries(editedData.gpe.flags).map(([key, value]) => (
                                        value && (
                                            <Badge key={key} variant="outline" className="text-xs capitalize">
                                                {key}
                                            </Badge>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SYSTEMIC EXAM */}
                        {editedData.systemic && Object.keys(editedData.systemic).some(k =>
                            (editedData.systemic as any)?.[k]?.summary
                        ) && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">🫀 Systemic Examination</h4>
                                    <div className="space-y-1 pl-6">
                                        {['cvs', 'rs', 'cns', 'abdomen'].map(sys => {
                                            const data = (editedData.systemic as any)?.[sys];
                                            if (!data?.summary && !data?.auscultation) return null;
                                            return (
                                                <div key={sys} className="p-2 bg-slate-50 rounded-md text-sm">
                                                    <span className="font-medium uppercase text-xs text-muted-foreground">
                                                        {sys}:
                                                    </span>{' '}
                                                    <span>{data.summary || data.auscultation}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        {/* MISSING FIELDS */}
                        {missingFields.filter(f => !dismissedFields.has(f)).length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-700">
                                    <AlertTriangle className="w-4 h-4" />
                                    Missing Information
                                </h4>
                                <div className="space-y-2">
                                    {missingFields
                                        .filter(f => !dismissedFields.has(f))
                                        .map(field => (
                                            <MissingFieldAlert
                                                key={field}
                                                fieldName={getFieldLabel(field)}
                                                question={getQuestionForField(field)}
                                                onAsk={() => onAskQuestion(getQuestionForField(field))}
                                                onMarkNKDA={field === 'allergy_history' ? handleMarkNKDA : undefined}
                                                onSkip={() => setDismissedFields(prev => new Set(prev).add(field))}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={onDiscard}
                        className="text-muted-foreground"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Discard
                    </Button>
                    <Button
                        onClick={() => onApply(editedData)}
                        disabled={isProcessing}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Apply to Clinical File
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ScribePreviewPanel;
