import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Patient } from '../types';

const ReceptionPage: React.FC = () => {
    const { addPatient, isLoading, error } = usePatient();
    const navigate = useNavigate();
    // Fix: Corrected the Omit type to match the expected patientData for addPatient.
    const [formData, setFormData] = useState<Omit<Patient, 'id' | 'status' | 'registrationTime' | 'triage' | 'timeline' | 'orders' | 'vitalsHistory' | 'clinicalFile' | 'rounds' | 'dischargeSummary' | 'overview' | 'results' | 'vitals' | 'handoverSummary'>>({
        name: '',
        age: 0,
        gender: 'Other',
        phone: '',
        complaint: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'age' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || formData.age <= 0 || !formData.complaint) {
            alert('Please fill in all required fields: Name, Age, and Complaint.');
            return;
        }
        await addPatient(formData);
        navigate('/');
    };

    return (
        <div className="max-w-2xl mx-auto bg-background-primary p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-text-primary mb-6">New Patient Registration</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Full Name</label>
                        <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} data-testid="patient-name-input" className="mt-1 block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-text-secondary">Phone Number</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text" />
                    </div>
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-text-secondary">Age</label>
                        <input type="number" name="age" id="age" required value={formData.age > 0 ? formData.age : ''} onChange={handleChange} data-testid="patient-age-input" className="mt-1 block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text" />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-text-secondary">Gender</label>
                        <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-border-color bg-background-primary rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm text-input-text">
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="complaint" className="block text-sm font-medium text-text-secondary">Chief Complaint</label>
                    <textarea name="complaint" id="complaint" required rows={4} value={formData.complaint} onChange={handleChange} data-testid="patient-complaint-input" className="mt-1 block w-full px-3 py-2 border border-border-color rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-background-primary text-input-text" placeholder="Describe the patient's main symptoms..."></textarea>
                </div>

                {error && (
                    <div className="my-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                        <p className="font-bold">Registration Failed</p>
                        <p>{error}</p>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/')} className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-tertiary border border-transparent rounded-md hover:bg-border-color focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} data-testid="register-patient-button" className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md shadow-sm hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:bg-gray-400 disabled:cursor-wait">
                        {isLoading ? 'Processing...' : 'Register Patient'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReceptionPage;