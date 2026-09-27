import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { EventModel } from '../types';

export const firebaseConfig = {
  projectId: "gen-lang-client-0843389460",
  appId: "1:288444381836:web:9bdf3e3f07bb5a2fc419a9",
  apiKey: "AIzaSyBVoTs0_7F4ojq7Bu9j1eHzHnGHtE-2tBg",
  authDomain: "gen-lang-client-0843389460.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixexpensoog-282c48ea-f9fe-457f-9240-d020736366f3",
  storageBucket: "gen-lang-client-0843389460.firebasestorage.app",
  messagingSenderId: "288444381836",
  measurementId: "",
  oAuthClientId: "288444381836-v0g4plql8vtjelksagi7j2ctfgldmka2.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Test connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'events', '__test_connection__'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn("Firestore client is offline or network restricted.");
    }
  }
})();

/**
 * Save or update an event in Firestore
 */
export async function saveEventToFirestore(event: EventModel): Promise<void> {
  try {
    const eventRef = doc(db, 'events', event.id);
    await setDoc(eventRef, {
      ...event,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Also store a quick lookup by code in a dedicated lookup or indexed query
    const codeRef = doc(db, 'event_codes', event.code.toUpperCase());
    await setDoc(codeRef, {
      code: event.code.toUpperCase(),
      eventId: event.id,
      name: event.name,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync event to Firestore:', err);
  }
}

/**
 * Fetch an event by its 6-character code
 */
export async function fetchEventByCode(code: string): Promise<EventModel | null> {
  const cleanCode = code.trim().toUpperCase();
  try {
    // 1. Try querying the event_codes lookup table first for fastest access
    const codeDocRef = doc(db, 'event_codes', cleanCode);
    const codeSnap = await getDoc(codeDocRef);
    if (codeSnap.exists()) {
      const { eventId } = codeSnap.data();
      if (eventId) {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          return eventDoc.data() as EventModel;
        }
      }
    }

    // 2. Direct query on events collection where code == cleanCode
    const q = query(collection(db, 'events'), where('code', '==', cleanCode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as EventModel;
    }
  } catch (err) {
    console.error('Error fetching event by code from Firestore:', err);
  }
  return null;
}

/**
 * Fetch an event by its unique ID
 */
export async function fetchEventById(id: string): Promise<EventModel | null> {
  try {
    const eventRef = doc(db, 'events', id);
    const snap = await getDoc(eventRef);
    if (snap.exists()) {
      return snap.data() as EventModel;
    }
  } catch (err) {
    console.error('Error fetching event by ID from Firestore:', err);
  }
  return null;
}

/**
 * Real-time listener for an event
 */
export function subscribeToFirestoreEvent(
  eventId: string,
  onUpdate: (event: EventModel) => void
): Unsubscribe {
  const eventRef = doc(db, 'events', eventId);
  return onSnapshot(
    eventRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as EventModel);
      }
    },
    (error) => {
      console.warn('Firestore subscription error:', error);
    }
  );
}
