import { JournalEntry } from '../types';
import { encryptData, decryptData } from './securityService';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

const OLD_STORAGE_KEY = 'data_journaling_entries_secure_v1';
const MANIFEST_KEY = 'dj_manifest_v1';
const ENTRY_PREFIX = 'dj_entry_';

// --- LOCAL STORAGE HELPERS (For Guest Mode) ---

async function getLocalManifest(): Promise<string[]> {
  const raw = localStorage.getItem(MANIFEST_KEY);
  if (!raw) return [];
  try {
    const decrypted = await decryptData(raw);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

async function addToLocalManifest(date: string) {
  const dates = await getLocalManifest();
  if (!dates.includes(date)) {
    dates.push(date);
    dates.sort((a, b) => b.localeCompare(a)); 
    const encrypted = await encryptData(JSON.stringify(dates));
    localStorage.setItem(MANIFEST_KEY, encrypted);
  }
}

async function removeFromLocalManifest(date: string) {
  const dates = await getLocalManifest();
  const newDates = dates.filter(d => d !== date);
  const encrypted = await encryptData(JSON.stringify(newDates));
  localStorage.setItem(MANIFEST_KEY, encrypted);
}

// --- MIGRATION (Local -> Cloud) ---

export const migrateLocalToCloud = async (uid: string) => {
  const dates = await getLocalManifest();
  if (dates.length === 0) return;

  console.log("Migrating local data to cloud...");
  
  for (const date of dates) {
    const raw = localStorage.getItem(ENTRY_PREFIX + date);
    if (raw) {
      try {
        const decrypted = await decryptData(raw);
        const entry: JournalEntry = JSON.parse(decrypted);
        
        // Save to Firestore
        await setDoc(doc(db, "users", uid, "entries", date), entry);
        
        // Clean up local
        localStorage.removeItem(ENTRY_PREFIX + date);
      } catch (e) {
        console.error("Failed to migrate entry", date, e);
      }
    }
  }
  
  // Clear manifest
  localStorage.removeItem(MANIFEST_KEY);
  console.log("Migration complete.");
};

// --- PUBLIC API (Hybrid) ---

export const runMigration = async () => {
  // This handles the legacy V1 monolithic blob -> Atomic migration (Local only)
  // Cloud migration is handled in migrateLocalToCloud called by AuthContext
  const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldRaw) return;

  try {
    const decryptedJson = await decryptData(oldRaw);
    if (!decryptedJson) return;

    const entries: JournalEntry[] = JSON.parse(decryptedJson);
    
    for (const entry of entries) {
      const encryptedEntry = await encryptData(JSON.stringify(entry));
      localStorage.setItem(ENTRY_PREFIX + entry.date, encryptedEntry);
      await addToLocalManifest(entry.date);
    }
    localStorage.removeItem(OLD_STORAGE_KEY);
  } catch (e) {
    console.error("Local V1 Migration failed", e);
  }
};

export const saveEntry = async (entry: JournalEntry): Promise<void> => {
  const user = auth.currentUser;

  if (user) {
    // CLOUD MODE
    try {
      // Firestore saves objects directly, but we keep structure clean
      await setDoc(doc(db, "users", user.uid, "entries", entry.date), entry);
    } catch (e) {
      console.error("Cloud save failed", e);
      throw e;
    }
  } else {
    // GUEST MODE (Local + Encrypted)
    const jsonString = JSON.stringify(entry);
    const encrypted = await encryptData(jsonString);
    localStorage.setItem(ENTRY_PREFIX + entry.date, encrypted);
    await addToLocalManifest(entry.date);
  }
};

export const getEntryByDate = async (dateStr: string): Promise<JournalEntry | undefined> => {
  const user = auth.currentUser;

  if (user) {
    // CLOUD MODE
    const docRef = doc(db, "users", user.uid, "entries", dateStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as JournalEntry;
    }
    return undefined;
  } else {
    // GUEST MODE
    const raw = localStorage.getItem(ENTRY_PREFIX + dateStr);
    if (!raw) return undefined;
    try {
      const decrypted = await decryptData(raw);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error(`Failed to load entry for ${dateStr}`, e);
      return undefined;
    }
  }
};

export const getEntries = async (): Promise<JournalEntry[]> => {
  const user = auth.currentUser;

  if (user) {
    // CLOUD MODE
    const entriesRef = collection(db, "users", user.uid, "entries");
    const q = query(entriesRef, orderBy("date", "desc")); // Assuming simple string date sort YYYY-MM-DD works
    const querySnapshot = await getDocs(q);
    
    const entries: JournalEntry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push(doc.data() as JournalEntry);
    });
    return entries;
  } else {
    // GUEST MODE
    const dates = await getLocalManifest();
    const promises = dates.map(async (date) => {
      return await getEntryByDate(date);
    });
    const results = await Promise.all(promises);
    const validEntries = results.filter((e): e is JournalEntry => e !== undefined);
    return validEntries.sort((a, b) => b.timestamp - a.timestamp);
  }
};

export const deleteEntry = async (dateId: string): Promise<void> => {
  const user = auth.currentUser;
  if (user) {
    await deleteDoc(doc(db, "users", user.uid, "entries", dateId));
  } else {
    await removeFromLocalManifest(dateId);
    localStorage.removeItem(ENTRY_PREFIX + dateId);
  }
};

export const getStreak = async (): Promise<number> => {
  // For streak, we need the dates.
  let dates: string[] = [];
  
  const user = auth.currentUser;
  if (user) {
    // Cloud streak calculation
    const entriesRef = collection(db, "users", user.uid, "entries");
    const snapshot = await getDocs(entriesRef);
    snapshot.forEach(doc => dates.push(doc.id)); // ID is date
  } else {
    dates = await getLocalManifest();
  }

  if (dates.length === 0) return 0;

  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if last entry was today or yesterday
  const lastEntryDate = new Date(sortedDates[0]);
  lastEntryDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - lastEntryDate.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays > 1) return 0; 

  streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i+1]);
    current.setHours(0,0,0,0);
    next.setHours(0,0,0,0);
    const diff = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};