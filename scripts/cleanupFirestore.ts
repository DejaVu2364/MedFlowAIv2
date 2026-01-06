/**
 * Firestore Cleanup Script
 * 
 * Removes all patients that are NOT from the Synthea dataset.
 * Run with: npx ts-node scripts/cleanupFirestore.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Valid Synthea patient IDs - these are the 20 curated patients
const VALID_SYNTHEA_IDS = [
    'p-amitabh',
    'p-sania',
    'p-vikram',
    'p-rahul',
    'p-priya',
    'p-karthik',
    'p-meera',
    'p-arjun',
    'p-lakshmi',
    'p-suresh',
    'p-anjali',
    'p-rajesh',
    'p-nandini',
    'p-venkat',
    'p-kavitha',
    'p-ganesh',
    'p-sunita',
    'p-prakash',
    'p-divya',
    'p-deepa',
];

async function cleanupFirestore() {
    console.log('🔧 Starting Firestore cleanup...\n');

    // Check if running in dry-run mode
    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
        console.log('📋 DRY RUN MODE - No changes will be made\n');
    }

    try {
        // Initialize Firebase Admin (requires GOOGLE_APPLICATION_CREDENTIALS env var)
        const app = initializeApp();
        const db = getFirestore(app);

        const patientsRef = db.collection('patients');
        const snapshot = await patientsRef.get();

        console.log(`📊 Found ${snapshot.size} patients in database\n`);

        const patientsToDelete: string[] = [];
        const patientsToKeep: string[] = [];

        snapshot.forEach((doc) => {
            const patientId = doc.id;
            if (VALID_SYNTHEA_IDS.includes(patientId)) {
                patientsToKeep.push(patientId);
            } else {
                patientsToDelete.push(patientId);
            }
        });

        console.log(`✅ Keeping ${patientsToKeep.length} Synthea patients:`);
        patientsToKeep.forEach(id => console.log(`   - ${id}`));

        console.log(`\n❌ Deleting ${patientsToDelete.length} non-Synthea patients:`);
        patientsToDelete.forEach(id => console.log(`   - ${id}`));

        if (!isDryRun && patientsToDelete.length > 0) {
            console.log('\n🗑️ Performing deletion...');

            const batch = db.batch();
            patientsToDelete.forEach(id => {
                batch.delete(patientsRef.doc(id));
            });

            await batch.commit();
            console.log(`\n✅ Successfully deleted ${patientsToDelete.length} patients`);
        } else if (patientsToDelete.length === 0) {
            console.log('\n✅ No cleanup needed - all patients are valid Synthea data');
        }

        console.log('\n🎉 Cleanup complete!');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

// Also export for programmatic use
export { VALID_SYNTHEA_IDS, cleanupFirestore };

// Run if called directly
if (require.main === module) {
    cleanupFirestore();
}
