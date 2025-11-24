const FIREBASE_VERSION = "10.13.1";

import { initializeApp } from `https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js`;
import { getFirestore } from `https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js`;

function readConfigFromDom() {
  const script = document.getElementById("firebase-config");
  if (script) {
    try {
      return JSON.parse(script.textContent);
    } catch (error) {
      console.error("Could not parse Firebase config JSON in #firebase-config", error);
    }
  }
  if (window.firebaseConfig) return window.firebaseConfig;
  return null;
}

const firebaseConfig = readConfigFromDom();

const hasPlaceholder =
  firebaseConfig &&
  Object.values(firebaseConfig).some(
    (value) => typeof value === "string" && value.toUpperCase().includes("REPLACE_WITH")
  );

if (!firebaseConfig || !firebaseConfig.apiKey || hasPlaceholder) {
  throw new Error("Firebase config is missing. Add it to #firebase-config in index.html.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_STORAGE_KEY = "sqUserId";

function getUserId() {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (stored) return stored;
  const generated =
    firebaseConfig.defaultUserId ||
    `local-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(USER_STORAGE_KEY, generated);
  return generated;
}

export { FIREBASE_VERSION, app, db, firebaseConfig, getUserId };
