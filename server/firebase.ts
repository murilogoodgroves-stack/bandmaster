import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK for server usage
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
