// server/firebase.ts
import admin from 'firebase-admin';
import {initializeApp, cert, getApps} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import * as serviceAccount from './serviceAccount.json';

/**
 * Initialize Firebase Admin SDK if no apps exist
 */
if (!getApps().length) {
  initializeApp({
    // Type assertion needed as service account JSON doesn't match TypeScript types exactly
    credential: cert(serviceAccount as any),
  });
}

/** Firebase Firestore database instance */
export const db = admin.firestore();
/** Firebase Auth Admin instance */
export const authAdmin = admin.auth();
/** Firestore FieldValue for atomic operations */
export const FieldValue = admin.firestore.FieldValue;