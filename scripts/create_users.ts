
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const MOCK_USER_CREDENTIALS = {
    'doctor@medflow.ai': 'password123',
    'intern@medflow.ai': 'password123',
    'admin@medflow.ai': 'admin123'
};

async function seedUsers() {
    console.log('Starting user seeding...');

    for (const [email, password] of Object.entries(MOCK_USER_CREDENTIALS)) {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log(`✅ Created user: ${email}`);
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`ℹ️ User already exists: ${email}`);
            } else {
                console.error(`❌ Failed to create ${email}:`, error.message);
            }
        }
    }
    console.log('Seeding complete.');
    process.exit(0);
}

seedUsers();
