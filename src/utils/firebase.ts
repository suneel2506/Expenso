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
  deleteDoc,
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

// Test connection on boot (avoid reserved double-underscore document IDs in Firestore)
(async function testConnection() {
  try {
    await getDoc(doc(db, 'events', 'init_connection_check'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn("Firestore client is offline or network restricted.");
    }
  }
})();

/**
 * Cleanly extract an event code from any format:
 * - Direct codes: "X7K9P2", "ivpnd6", "  X7K9P2  "
 * - Share messages: "Join \"College Fest\" on Expenso using event code: X7K9P2"
 * - URLs: "https://.../?join=X7K9P2" or "?code=X7K9P2"
 * - Prefixed labels: "code: X7K9P2", "#X7K9P2"
 */
export function extractEventCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // 1. If it's a URL or contains query parameters
  if (trimmed.includes('?') && (trimmed.includes('join=') || trimmed.includes('code='))) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://expenso.app/${trimmed.startsWith('?') ? trimmed : '?' + trimmed}`);
      const codeParam = url.searchParams.get('join') || url.searchParams.get('code');
      if (codeParam) return codeParam.trim().toUpperCase();
    } catch {
      // fallback regex
    }
  }

  // 2. Explicit code label: e.g. 'code: X7K9P2', 'code=X7K9P2', 'code - X7K9P2', 'join: X7K9P2'
  const explicitMatch = trimmed.match(/(?:code|join|id)[\s:=#\-]+([A-Za-z0-9]{4,10})/i);
  if (explicitMatch) {
    return explicitMatch[1].trim().toUpperCase();
  }

  // 3. If trimmed input is already a single word/code token (e.g. 'X7K9P2' or 'ivpnd6' or '#X7K9P2')
  const singleToken = trimmed.replace(/[^A-Za-z0-9]/g, '');
  if (singleToken.length >= 4 && singleToken.length <= 10 && !trimmed.includes(' ') && !trimmed.includes('\n')) {
    return singleToken.toUpperCase();
  }

  // 4. Look for an uppercase/alphanumeric code token in text (often mixed letters & numbers, e.g. X7K9P2, IVPND6)
  const tokenMatches = trimmed.match(/\b([A-Z0-9]{4,8})\b/gi);
  if (tokenMatches && tokenMatches.length > 0) {
    // Prefer tokens that contain at least one digit or all uppercase
    const withDigits = tokenMatches.find(t => /\d/.test(t));
    if (withDigits) return withDigits.toUpperCase();
    return tokenMatches[tokenMatches.length - 1].toUpperCase();
  }

  return singleToken.toUpperCase();
}

/**
 * Ensure an event loaded from Firestore or API has all expected arrays defined
 */
export function sanitizeLoadedEvent(data: any): EventModel {
  return {
    ...data,
    teams: Array.isArray(data.teams) ? data.teams : [],
    members: Array.isArray(data.members) ? data.members : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    incomeRecords: Array.isArray(data.incomeRecords) ? data.incomeRecords : [],
    budgets: Array.isArray(data.budgets) ? data.budgets : [],
    advances: Array.isArray(data.advances) ? data.advances : [],
    reimbursements: Array.isArray(data.reimbursements) ? data.reimbursements : [],
    vendors: Array.isArray(data.vendors) ? data.vendors : [],
    settlements: Array.isArray(data.settlements) ? data.settlements : [],
    auditLogs: Array.isArray(data.auditLogs) ? data.auditLogs : [],
  } as EventModel;
}

/**
 * Save or update an event in Firestore (stripping any undefined fields that cause Firestore errors)
 */
export async function saveEventToFirestore(event: EventModel): Promise<void> {
  try {
    // Strip undefined values which cause setDoc to throw errors in Firestore
    const cleanData = JSON.parse(JSON.stringify(event));
    const eventRef = doc(db, 'events', event.id);
    await setDoc(eventRef, {
      ...cleanData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Also store a quick lookup by code in a dedicated lookup collection
    const cleanCode = (event.code || '').trim().toUpperCase();
    if (cleanCode) {
      const codeRef = doc(db, 'event_codes', cleanCode);
      await setDoc(codeRef, {
        code: cleanCode,
        eventId: event.id,
        name: event.name,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('Failed to sync event to Firestore:', err);
  }
}

/**
 * Fetch an event by its 6-character code
 */
export async function fetchEventByCode(code: string): Promise<EventModel | null> {
  const cleanCode = extractEventCode(code);
  if (!cleanCode) return null;

  try {
    // 1. Try querying the event_codes lookup table first for fastest access
    const codeDocRef = doc(db, 'event_codes', cleanCode);
    const codeSnap = await getDoc(codeDocRef);
    if (codeSnap.exists()) {
      const { eventId } = codeSnap.data();
      if (eventId) {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          return sanitizeLoadedEvent(eventDoc.data());
        }
      }
    }

    // 2. Direct query on events collection where code == cleanCode
    const q = query(collection(db, 'events'), where('code', '==', cleanCode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return sanitizeLoadedEvent(querySnapshot.docs[0].data());
    }

    // 3. Fallback: Scan events collection in case indexing or casing differed
    const allSnap = await getDocs(collection(db, 'events'));
    for (const d of allSnap.docs) {
      const data = d.data();
      if (data?.code && data.code.trim().toUpperCase() === cleanCode) {
        return sanitizeLoadedEvent(data);
      }
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
      return sanitizeLoadedEvent(snap.data());
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
        onUpdate(sanitizeLoadedEvent(snapshot.data()));
      }
    },
    (error) => {
      console.warn('Firestore subscription error:', error);
    }
  );
}

/**
 * Permanently delete an event from Firestore
 */
export async function deleteEventFromFirestore(eventId: string, code?: string): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
    if (code) {
      const codeRef = doc(db, 'event_codes', code.toUpperCase());
      await deleteDoc(codeRef);
    }
  } catch (err) {
    console.warn('Failed to delete event from Firestore:', err);
  }
}
