import {
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { db, getUserId } from "./firebaseClient.js";
import { ensureDefaults, withDefaults } from "./state.js";

const metadataRef = doc(db, "config", "metadata");
const userId = getUserId();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toTimestamp(dateLike) {
  if (!dateLike) return null;
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
}

function toDateString(value) {
  if (!value) return "";
  if (value instanceof Timestamp) return value.toDate().toISOString().split("T")[0];
  if (value?.toDate) return value.toDate().toISOString().split("T")[0];
  if (typeof value === "string") return value;
  return "";
}

function normalizeReward(reward) {
  const sx = Number(reward?.sx);
  const coins = Number(reward?.coins);
  return {
    sx: Number.isFinite(sx) ? sx : 0,
    coins: Number.isFinite(coins) ? coins : 0,
  };
}

async function ensureMetadata() {
  const snap = await getDoc(metadataRef);
  if (snap.exists()) return snap.data();
  await setDoc(metadataRef, { courses: [], categories: [] });
  return { courses: [], categories: [] };
}

export function createStorage({ setStatus } = {}) {
  let onDataChanged = null;

  function setOnDataChanged(callback) {
    onDataChanged = callback;
  }

  const notify = () => {
    if (typeof onDataChanged === "function") onDataChanged();
  };

  async function loadRemoteData() {
    const [metaSnap, questSnap, progressSnap] = await Promise.all([
      ensureMetadata(),
      getDocs(collection(db, "quests")),
      getDocs(collection(db, "users", userId, "quests")),
    ]);

    const metadata = {
      courses: Array.isArray(metaSnap?.courses) ? metaSnap.courses : [],
      categories: Array.isArray(metaSnap?.categories) ? metaSnap.categories : [],
    };
    ensureDefaults(metadata);
    const { courses, categories } = metadata;

    const progressById = {};
    progressSnap.forEach((docSnap) => {
      progressById[docSnap.id] = docSnap.data();
    });

    const quests = questSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const progress = progressById[docSnap.id] || {};
      return withDefaults({
        id: docSnap.id,
        title: data.title || data.category || "",
        course: data.course || "General",
        category: data.category || "General",
        dueDate: toDateString(data.dueDate),
        dueTime: data.dueTime || "",
        estMinutes: data.estMinutes ?? null,
        link: data.link || "",
        filePath: data.filePath || "",
        notes: data.notes || "",
        reward: normalizeReward(data.reward),
        completion: progress.completion ?? 0,
        done: Boolean(progress.done),
      });
    });

    return { quests, courses, categories, userId };
  }

  async function createQuest(quest) {
    const now = serverTimestamp();
    const reward = normalizeReward(quest.reward);
    const definition = {
      title: quest.title || quest.category || "Quest",
      course: quest.course || "General",
      category: quest.category || "General",
      dueDate: toTimestamp(quest.dueDate),
      dueTime: quest.dueTime || "",
      estMinutes: quest.estMinutes ?? null,
      link: quest.link || "",
      filePath: quest.filePath || "",
      notes: quest.notes || "",
      reward,
      createdAt: now,
      updatedAt: now,
    };

    const questRef = quest.id ? doc(db, "quests", quest.id) : null;
    const docRef = questRef || (await addDoc(collection(db, "quests"), definition));
    if (questRef) {
      await setDoc(docRef, definition, { merge: true });
    }
    const progressRef = doc(db, "users", userId, "quests", docRef.id);
    await setDoc(
      progressRef,
      {
        completion: 0,
        done: false,
        rewardClaimed: false,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    notify();
    return withDefaults({
      ...quest,
      id: docRef.id,
      dueDate: quest.dueDate || "",
      reward,
      completion: 0,
      done: false,
    });
  }

  async function updateQuestProgress(questId, changes) {
    if (!questId) return;
    const payload = {};
    if (typeof changes?.completion === "number") payload.completion = clamp(changes.completion, 0, 100);
    if (typeof changes?.done === "boolean") payload.done = changes.done;
    if (changes?.done === true) payload.completedAt = serverTimestamp();
    if (changes?.done === false) payload.completedAt = null;
    payload.updatedAt = serverTimestamp();

    const ref = doc(db, "users", userId, "quests", questId);
    await setDoc(
      ref,
      {
        completion: 0,
        done: false,
        createdAt: serverTimestamp(),
        ...payload,
      },
      { merge: true }
    );
    notify();
  }

  async function deleteQuest(questId) {
    if (!questId) return;
    await Promise.all([
      deleteDoc(doc(db, "quests", questId)),
      deleteDoc(doc(db, "users", userId, "quests", questId)).catch(() => {}),
    ]);
    notify();
  }

  async function updateMetadataList(key, value, action) {
    const trimmed = value?.trim();
    if (!trimmed) return;
    await setDoc(metadataRef, { [key]: [] }, { merge: true });
    const op = action === "remove" ? arrayRemove(trimmed) : arrayUnion(trimmed);
    await updateDoc(metadataRef, { [key]: op });
    notify();
  }

  const addCourse = (name) => updateMetadataList("courses", name, "add");
  const removeCourse = (name) => updateMetadataList("courses", name, "remove");
  const addCategory = (name) => updateMetadataList("categories", name, "add");
  const removeCategory = (name) => updateMetadataList("categories", name, "remove");

  return {
    addCategory,
    addCourse,
    addQuest: createQuest,
    deleteQuest,
    loadRemoteData,
    removeCategory,
    removeCourse,
    setOnDataChanged,
    updateQuestProgress,
    userId,
  };
}
