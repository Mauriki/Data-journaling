import { JournalEntry } from '../types';
import { encryptData, decryptData } from './securityService';

const OLD_STORAGE_KEY = 'data_journaling_entries_secure_v1';
const MANIFEST_KEY = 'dj_manifest_v1';
const ENTRY_PREFIX = 'dj_entry_';

// --- Internal Helpers ---

// Get the list of all dates that have entries
async function getManifest(): Promise<string[]> {
  const raw = localStorage.getItem(MANIFEST_KEY);
  if (!raw) return [];
  try {
    const decrypted = await decryptData(raw);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

// Update the manifest with a new date
async function addToManifest(date: string) {
  const dates = await getManifest();
  if (!dates.includes(date)) {
    dates.push(date);
    // Keep sorted for easier history viewing
    dates.sort((a, b) => b.localeCompare(a)); 
    const encrypted = await encryptData(JSON.stringify(dates));
    localStorage.setItem(MANIFEST_KEY, encrypted);
  }
}

// Remove a date from the manifest
async function removeFromManifest(date: string) {
  const dates = await getManifest();
  const newDates = dates.filter(d => d !== date);
  const encrypted = await encryptData(JSON.stringify(newDates));
  localStorage.setItem(MANIFEST_KEY, encrypted);
}

// --- Public API ---

export const runMigration = async () => {
  const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldRaw) return; // No migration needed

  try {
    // Decrypt the old monolithic blob
    const decryptedJson = await decryptData(oldRaw);
    if (!decryptedJson) return;

    const entries: JournalEntry[] = JSON.parse(decryptedJson);
    
    // Save each entry individually (Atomic Storage)
    const dates: string[] = [];
    for (const entry of entries) {
      const encryptedEntry = await encryptData(JSON.stringify(entry));
      localStorage.setItem(ENTRY_PREFIX + entry.date, encryptedEntry);
      dates.push(entry.date);
    }

    // Create the new manifest
    dates.sort((a, b) => b.localeCompare(a));
    const encryptedManifest = await encryptData(JSON.stringify(dates));
    localStorage.setItem(MANIFEST_KEY, encryptedManifest);

    // Cleanup old data
    localStorage.removeItem(OLD_STORAGE_KEY);
  } catch (e) {
    console.error("Migration failed", e);
  }
};

export const saveEntry = async (entry: JournalEntry): Promise<void> => {
  // 1. Encrypt the individual entry (Fast, small payload)
  const jsonString = JSON.stringify(entry);
  const encrypted = await encryptData(jsonString);
  
  // 2. Save to atomic key
  localStorage.setItem(ENTRY_PREFIX + entry.date, encrypted);
  
  // 3. Update manifest (only if new date)
  await addToManifest(entry.date);
};

export const getEntryByDate = async (dateStr: string): Promise<JournalEntry | undefined> => {
  const raw = localStorage.getItem(ENTRY_PREFIX + dateStr);
  if (!raw) return undefined;
  
  try {
    const decrypted = await decryptData(raw);
    return JSON.parse(decrypted);
  } catch (e) {
    console.error(`Failed to load entry for ${dateStr}`, e);
    return undefined;
  }
};

export const getEntries = async (): Promise<JournalEntry[]> => {
  const dates = await getManifest();
  
  // Parallel retrieval and decryption
  // This is much faster than serializing one giant JSON blob
  const promises = dates.map(async (date) => {
    return await getEntryByDate(date);
  });
  
  const results = await Promise.all(promises);
  const validEntries = results.filter((e): e is JournalEntry => e !== undefined);
  
  return validEntries.sort((a, b) => b.timestamp - a.timestamp);
};

export const deleteEntry = async (id: string): Promise<void> => {
  // In our architecture, ID corresponds to the date
  await removeFromManifest(id);
  localStorage.removeItem(ENTRY_PREFIX + id);
};

export const getStreak = async (): Promise<number> => {
  // Optimization: We only read the manifest (list of dates).
  // We DO NOT decrypt the journal body contents.
  // This makes streak calculation instant (O(N) on just dates, not content).
  const dates = await getManifest();
  if (dates.length === 0) return 0;

  // Dates are stored in YYYY-MM-DD format.
  // We ensure they are sorted descending.
  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if the last entry was today or yesterday
  const lastEntryDate = new Date(sortedDates[0]);
  lastEntryDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - lastEntryDate.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

  // If last entry was older than yesterday, streak is broken (unless it is 0 days ago)
  if (diffDays > 1) return 0; 

  streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i+1]);
    
    current.setHours(0,0,0,0);
    next.setHours(0,0,0,0);

    const diff = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};