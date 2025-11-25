// Lightweight anonymous auth to obtain a stable Firestore userId.
import { initFirebaseApp } from "./db.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

let authPromise;

async function getAuthClient() {
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const app = await initFirebaseApp();
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    return auth;
  })();

  return authPromise;
}

export async function ensureUser() {
  const auth = await getAuthClient();

  if (auth.currentUser) return auth.currentUser;

  const cred = await signInAnonymously(auth);
  if (cred?.user) return cred.user;

  // Fallback: wait for auth state if credential missing.
  return new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(
      auth,
      (user) => {
        stop();
        resolve(user);
      },
      (err) => {
        stop();
        reject(err);
      }
    );
  });
}

export async function signInWithGoogle() {
  const auth = await getAuthClient();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // If we're anonymous, link to keep the same user record/quests.
  if (auth.currentUser && auth.currentUser.isAnonymous) {
    try {
      const cred = await linkWithPopup(auth.currentUser, provider);
      return cred.user;
    } catch (err) {
      if (err?.code === "auth/credential-already-in-use") {
        // The Google account already exists; sign in to that account instead.
        const cred = await signInWithPopup(auth, provider);
        return cred.user;
      }
      throw err;
    }
  }

  const res = await signInWithPopup(auth, provider);
  return res.user;
}
