// Firebase web SDK (ESM) via gstatic CDN.
import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  serverTimestamp,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const DEFAULT_TIMEZONE = "Asia/Jerusalem";
const DEFAULT_THEME = "light";

let configPromise;
let appPromise;
let dbPromise;

async function loadFirebaseConfig() {
  if (configPromise) return configPromise;

  configPromise = fetch("/__/firebase/init.json").then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to load Firebase config: ${res.status}`);
    }
    return res.json();
  });

  return configPromise;
}

async function initFirestore() {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const app = await initFirebaseApp();
    return getFirestore(app);
  })();

  return dbPromise;
}

export async function initFirebaseApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const firebaseConfig = await loadFirebaseConfig();
    // Avoid duplicate initialization if app already exists (e.g., hot reload).
    const existing = getApps();
    if (existing && existing.length > 0) {
      return existing[0];
    }
    return initializeApp(firebaseConfig);
  })();

  return appPromise;
}

export async function getDb() {
  return initFirestore();
}

export async function userDoc(userId) {
  const db = await initFirestore();
  return doc(db, "users", userId);
}

export async function userQuestsCollection(userId) {
  const db = await initFirestore();
  return collection(db, "users", userId, "quests");
}

export async function questDoc(userId, questId) {
  const db = await initFirestore();
  return doc(db, "users", userId, "quests", questId);
}

export function newUserPayload(overrides = {}) {
  return {
    createdAt: serverTimestamp(),
    displayName: "",
    timezone: DEFAULT_TIMEZONE,
    totalXP: 0,
    totalCoins: 0,
    theme: DEFAULT_THEME,
    ...overrides,
  };
}

export function newQuestPayload(data = {}) {
  const now = serverTimestamp();
  return {
    title: data.title ?? "",
    dueDate: data.dueDate ?? now,
    status: data.status ?? "planned",
    estimatedMinutes: data.estimatedMinutes ?? 0,
    xp: data.xp ?? 0,
    coins: data.coins ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function touchUpdatedAt(payload = {}) {
  return { ...payload, updatedAt: serverTimestamp() };
}

// Re-export commonly used Firestore helpers for convenience.
export const firestoreHelpers = {
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
};
