import { JournalEntry } from '../types';
import { encryptData, decryptData } from './securityService';

const STORAGE_KEY = 'data_journaling_entries_secure_v1';

// We now store a string that is the encrypted JSON of the array
export const saveEntry = async (entry: JournalEntry): Promise<void> => {
  const entries = await getEntries();
  const index = entries.findIndex(e => e.date === entry.date);
  
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  
  const jsonString = JSON.stringify(entries);
  const encrypted = await encryptData(jsonString);
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const getEntries = async (): Promise<JournalEntry[]> => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  
  try {
    // Try to decrypt
    const decryptedJson = await decryptData(raw);
    if (!decryptedJson) return [];
    
    const parsed = JSON.parse(decryptedJson);
    return parsed.sort((a: JournalEntry, b: JournalEntry) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to load/decrypt journal entries", e);
    return [];
  }
};

export const getEntryByDate = async (dateStr: string): Promise<JournalEntry | undefined> => {
  const entries = await getEntries();
  return entries.find(e => e.date === dateStr);
};

export const deleteEntry = async (id: string): Promise<void> => {
  const entries = await getEntries();
  const filtered = entries.filter(e => e.id !== id);
  
  const jsonString = JSON.stringify(filtered);
  const encrypted = await encryptData(jsonString);
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const getStreak = async (): Promise<number> => {
  const entries = await getEntries();
  if (entries.length === 0) return 0;

  const sorted = entries.sort((a, b) => b.date.localeCompare(a.date)); // Newest first

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastEntryDate = new Date(sorted[0].date);
  lastEntryDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - lastEntryDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays > 1) return 0; 

  streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i].date);
    const next = new Date(sorted[i+1].date);
    
    current.setHours(0,0,0,0);
    next.setHours(0,0,0,0);

    const diff = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};