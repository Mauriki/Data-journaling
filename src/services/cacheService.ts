// IndexedDB wrapper for offline-first caching
// Provides fast local storage with background sync to Firestore

const DB_NAME = 'JournalAppDB';
const DB_VERSION = 1;
const ENTRIES_STORE = 'entries';
const SETTINGS_STORE = 'settings';

interface CacheEntry {
    id: string;
    data: any;
    timestamp: number;
    synced: boolean;
}

class IndexedDBCache {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create entries store
                if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
                    const entriesStore = db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' });
                    entriesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    entriesStore.createIndex('synced', 'synced', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                }
            };
        });
    }

    async getEntry(id: string): Promise<any | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ENTRIES_STORE], 'readonly');
            const store = transaction.objectStore(ENTRIES_STORE);
            const request = store.get(id);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async setEntry(id: string, data: any, synced: boolean = false): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ENTRIES_STORE], 'readwrite');
            const store = transaction.objectStore(ENTRIES_STORE);
            const cacheEntry: CacheEntry = {
                id,
                data,
                timestamp: Date.now(),
                synced
            };
            const request = store.put(cacheEntry);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllEntries(): Promise<any[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ENTRIES_STORE], 'readonly');
            const store = transaction.objectStore(ENTRIES_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result.map((item: CacheEntry) => item.data);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getUnsyncedEntries(): Promise<CacheEntry[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ENTRIES_STORE], 'readonly');
            const store = transaction.objectStore(ENTRIES_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result.filter((item: CacheEntry) => !item.synced);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async markAsSynced(id: string): Promise<void> {
        if (!this.db) await this.init();

        const entry = await this.getEntry(id);
        if (entry) {
            await this.setEntry(id, entry, true);
        }
    }

    async getSetting(key: string): Promise<any | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
            const store = transaction.objectStore(SETTINGS_STORE);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async setSetting(key: string, value: any): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE);
            const request = store.put({ key, value });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([ENTRIES_STORE, SETTINGS_STORE], 'readwrite');

            transaction.objectStore(ENTRIES_STORE).clear();
            transaction.objectStore(SETTINGS_STORE).clear();

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
}

// Singleton instance
export const dbCache = new IndexedDBCache();

// Initialize on module load
if (typeof window !== 'undefined') {
    dbCache.init().catch(console.error);
}
