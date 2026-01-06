import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Patient } from '../types';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { MultiComplaintWithDuration } from '../components/common/MultiComplaintWithDuration';

const ReceptionPage: React.FC = () => {
    const { addPatient, isLoading, error } = usePatient();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary' | 'overview' | 'results' | 'vitals' | 'handoverSummary'>>({
        name: '',
        age: 0,
        gender: 'Other',
        contact: '',
        chiefComplaints: []
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'age' ? parseInt(value) || 0 : value
        }));
        // Clear error when user types
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    console.log("DEBUG: ReceptionPage rendering");

    const validate = () => {
        console.log("DEBUG: Validating form", formData);
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Full Name is required.";
        if (formData.age <= 0) errors.age = "Please enter a valid age.";
        if (formData.chiefComplaints.length === 0) errors.complaint = "At least one Chief Complaint is required.";
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("DEBUG: handleSubmit called");

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            console.log("DEBUG: Validation errors:", errors);
            setValidationErrors(errors);
            return;
        }

        try {
            console.log("DEBUG: Calling addPatient");
            const newPatient = await addPatient(formData);
            console.log("DEBUG: addPatient success, patient:", newPatient?.id);
            // Navigate to triage queue for seamless workflow
            console.log("DEBUG: Navigating to triage queue");
            navigate('/?view=triage', { replace: true });
        } catch (e) {
            console.error("Registration failed", e);
            console.log("DEBUG: Registration error", e);
            // We do not block flow here as per requirements, but addPatient throws.
            // However, usePatientData.addPatient catches AI errors and proceeds.
            // If addPatient throws, it's a critical error (e.g. DB fail).
            // But user asked "If Gemini fails, DO NOT prevent registration".
            // Since addPatient handles Gemini failure internally, we are good.
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-xl shadow-lg border border-border/50 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-foreground mb-6">New Patient Registration</h2>
            <form data-testid="registration-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            data-testid="patient-name-input"
                            placeholder="e.g. John Doe"
                            className={validationErrors.name ? "border-destructive" : ""}
                        />
                        {validationErrors.name && <p className="text-xs text-destructive font-medium">{validationErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact">Phone Number</Label>
                        <Input
                            type="tel"
                            name="contact"
                            id="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                            type="number"
                            name="age"
                            id="age"
                            value={formData.age > 0 ? formData.age : ''}
                            onChange={handleChange}
                            data-testid="patient-age-input"
                            placeholder="Age"
                            className={validationErrors.age ? "border-destructive" : ""}
                        />
                        {validationErrors.age && <p className="text-xs text-destructive font-medium">{validationErrors.age}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                            name="gender"
                            id="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Chief Complaints</Label>
                    <MultiComplaintWithDuration
                        value={formData.chiefComplaints}
                        onChange={(val) => {
                            setFormData(prev => ({ ...prev, chiefComplaints: val }));
                            if (val.length > 0) setValidationErrors(prev => ({ ...prev, complaint: '' }));
                        }}
                        error={validationErrors.complaint}
                    />
                </div>

                {error && (
                    <div className="my-4 p-3 bg-destructive/10 border-l-4 border-destructive text-destructive rounded-r-md">
                        <p className="font-bold text-sm">Registration Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} data-testid="register-patient-button">
                        {isLoading ? 'Processing...' : 'Register Patient'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ReceptionPage;