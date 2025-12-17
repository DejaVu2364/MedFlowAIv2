import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, setDoc, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Patient, AuditEvent } from '../types';

// ------------------------------------------------------------------
// ⚠️ FIREBASE SETUP INSTRUCTIONS
// 1. Go to Firebase Console > Project Settings > General > Your Apps
// 2. Select the Web App (</>)
// 3. Copy the 'apiKey' and 'appId' and paste them below.
// ------------------------------------------------------------------

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medflowai-19269.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medflowai-19269",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medflowai-19269.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

let db: any = null;
let auth: any = null;
let isFirebaseInitialized = false;

try {
    // We check if the apiKey has been configured (not the default placeholder)
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && !firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // Enable Offline Persistence (Non-blocking)
        enableMultiTabIndexedDbPersistence(db).catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Persistence failed: Multiple tabs open');
            } else if (err.code == 'unimplemented') {
                console.warn('Persistence is not available in this browser');
            }
        });

        isFirebaseInitialized = true;
        console.log("✅ Firebase initialized successfully");
    } else {
        console.warn("⚠️ Firebase keys missing or placeholder used. Running in LOCAL DEMO MODE.");
    }
} catch (e) {
    console.error("❌ Firebase initialization failed:", e);
}

export const getIsFirebaseInitialized = () => isFirebaseInitialized;
export const getAuthInstance = () => auth;

export const subscribeToPatients = (callback: (patients: Patient[]) => void) => {
    if (!isFirebaseInitialized || !db) return () => { };

    const q = query(collection(db, 'patients'), orderBy('registrationTime', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const patients = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Patient));
        callback(patients);
    }, (error) => {
        console.error("Error fetching patients:", error);
    });
};

// Helper to remove undefined values (Firestore doesn't like them)
const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);

    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value === undefined) {
                newObj[key] = null;
            } else {
                newObj[key] = sanitizeForFirestore(value);
            }
        }
    }
    return newObj;
};

export const savePatient = async (patient: Patient) => {
    if (!isFirebaseInitialized || !db) return;
    try {
        // Use setDoc to preserve the ID we generated locally
        const sanitizedPatient = sanitizeForFirestore(patient);
        await setDoc(doc(db, 'patients', patient.id), sanitizedPatient);
    } catch (e) {
        console.error("Error saving patient:", e);
    }
};

export const updatePatientInDb = async (patientId: string, updates: Partial<Patient>) => {
    if (!isFirebaseInitialized || !db) return;
    try {
        const docRef = doc(db, 'patients', patientId);
        const sanitizedUpdates = sanitizeForFirestore(updates);
        await updateDoc(docRef, sanitizedUpdates);
    } catch (e) {
        console.error("Error updating patient:", e);
    }
};

export const logAuditToDb = async (event: AuditEvent) => {
    if (!isFirebaseInitialized || !db) return;
    try {
        await addDoc(collection(db, 'audit_logs'), event);
    } catch (e) {
        // Silent fail for logs
    }
};

export const seedDatabase = async () => {
    if (!isFirebaseInitialized || !db) throw new Error("Firebase not initialized");

    // Dynamic import to avoid circular dependencies if any, though api.ts seems fine
    const { seedPatients } = await import('./api');
    const patients = await seedPatients();

    let count = 0;
    for (const patient of patients) {
        try {
            await savePatient(patient);
            count++;
        } catch (e) {
            console.error(`Failed to seed patient ${patient.id}`, e);
        }
    }
    return count;
};