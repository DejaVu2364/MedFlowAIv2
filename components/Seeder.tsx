import React, { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from '../services/firebase';

const MOCK_USER_CREDENTIALS = {
    'doctor@medflow.ai': 'password123',
    'intern@medflow.ai': 'password123',
    'admin@medflow.ai': 'admin123'
};

const Seeder = () => {
    const [status, setStatus] = useState<string[]>([]);

    useEffect(() => {
        const seed = async () => {
            const auth = getAuthInstance();
            if (!auth) {
                setStatus(prev => [...prev, "Firebase Auth not initialized"]);
                return;
            }

            for (const [email, password] of Object.entries(MOCK_USER_CREDENTIALS)) {
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                    setStatus(prev => [...prev, `✅ Created: ${email}`]);
                } catch (error: any) {
                    if (error.code === 'auth/email-already-in-use') {
                        setStatus(prev => [...prev, `ℹ️ Exists: ${email}`]);
                    } else {
                        setStatus(prev => [...prev, `❌ Failed ${email}: ${error.message}`]);
                    }
                }
            }
            setStatus(prev => [...prev, "DONE"]);
        };
        seed();
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'white', padding: 20, border: '2px solid red', color: 'black' }}>
            <h3>Seeding Users...</h3>
            {status.map((s, i) => <div key={i}>{s}</div>)}
        </div>
    );
};

export default Seeder;
