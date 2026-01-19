// IndexedDB storage for large data (images)
// localStorage has ~5MB limit, IndexedDB can store much more

const DB_NAME = 'openllmpix-db';
const DB_VERSION = 1;
const JOBS_STORE = 'jobs';
const CHAT_STORE = 'chat-sessions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store for generation jobs
      if (!db.objectStoreNames.contains(JOBS_STORE)) {
        db.createObjectStore(JOBS_STORE, { keyPath: 'id' });
      }

      // Store for chat sessions
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        db.createObjectStore(CHAT_STORE, { keyPath: 'imageId' });
      }
    };
  });
}

// ===== Jobs Storage =====

export async function saveJobs(jobs: unknown[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(JOBS_STORE, 'readwrite');
    const store = tx.objectStore(JOBS_STORE);

    // Clear existing and add all
    store.clear();
    for (const job of jobs) {
      store.put(job);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (error) {
    console.error('Failed to save jobs to IndexedDB:', error);
  }
}

export async function loadJobs<T>(): Promise<T[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(JOBS_STORE, 'readonly');
    const store = tx.objectStore(JOBS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        // Sort by timestamp descending (newest first)
        const jobs = request.result as T[];
        jobs.sort((a: unknown, b: unknown) => {
          const aTime = (a as { timestamp?: number }).timestamp || 0;
          const bTime = (b as { timestamp?: number }).timestamp || 0;
          return bTime - aTime;
        });
        resolve(jobs);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to load jobs from IndexedDB:', error);
    return [];
  }
}

export async function clearJobs(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(JOBS_STORE, 'readwrite');
    const store = tx.objectStore(JOBS_STORE);
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear jobs from IndexedDB:', error);
  }
}

// ===== Chat Sessions Storage =====

export interface ChatSession {
  imageId: string;
  messages: unknown[];
  contextImages: string[];
  displayImage: string;
  activeImage: unknown;
  timestamp: number;
}

export async function saveChatSession(session: ChatSession): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(CHAT_STORE, 'readwrite');
    const store = tx.objectStore(CHAT_STORE);
    store.put(session);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (error) {
    console.error('Failed to save chat session:', error);
  }
}

export async function loadChatSession(imageId: string): Promise<ChatSession | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(CHAT_STORE, 'readonly');
    const store = tx.objectStore(CHAT_STORE);
    const request = store.get(imageId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to load chat session:', error);
    return null;
  }
}

export async function clearAllChatSessions(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(CHAT_STORE, 'readwrite');
    const store = tx.objectStore(CHAT_STORE);
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear chat sessions:', error);
  }
}
