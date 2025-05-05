// server/firebase.ts
import admin from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as serviceAccount from "./serviceAccount.json";

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

export const db        = admin.firestore();
export const authAdmin = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
