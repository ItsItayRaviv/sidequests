import { ensureUser } from "./auth.js";
import {
  userDoc,
  userQuestsCollection,
  questDoc,
  newUserPayload,
  newQuestPayload,
  touchUpdatedAt,
  firestoreHelpers,
} from "./db.js";

const { getDoc, setDoc, getDocs, query, orderBy } = firestoreHelpers;

export const state = {
  userId: null,
  userDisplayName: "",
  userEmail: "",
  isAnonymous: true,
  quests: [],
  selectedDate: todayISO(),
  totalXP: 0,
  totalCoins: 0,
  timezone: "Asia/Jerusalem",
  theme: "light",
  loading: true,
};

export async function initState() {
  const user = await ensureUser();
  await loadStateForUser(user);
}

export async function loadStateForUser(user) {
  state.loading = true;

  state.userId = user.uid;
  state.userDisplayName = user.displayName || "";
  state.userEmail = user.email || "";
  state.isAnonymous = !!user.isAnonymous;
  setSelectedDate(todayISO());

  const userProfile = await ensureUserDoc(user.uid);
  applyUserToState(userProfile);

  state.quests = await fetchQuests(user.uid);

  state.loading = false;
}

export async function refreshQuests() {
  if (!state.userId) return;
  state.quests = await fetchQuests(state.userId);
}

export async function addQuest(data) {
  if (!state.userId) throw new Error("Missing user context");

  const questId = data?.id || generateId();
  const ref = await questDoc(state.userId, questId);
  const payload = newQuestPayload(normalizeQuestInput(data));
  await setDoc(ref, payload, { merge: true });

  // Pull back the saved doc so state has the server-written timestamps.
  const snap = await getDoc(ref);
  const quest = questFromSnapshot(snap);
  upsertQuestInState(quest);
  return quest;
}

export async function updateQuest(questId, patch) {
  if (!state.userId) throw new Error("Missing user context");
  if (!questId) throw new Error("Missing quest id");

  const ref = await questDoc(state.userId, questId);
  await setDoc(ref, touchUpdatedAt(normalizeQuestInput(patch)), { merge: true });

  const snap = await getDoc(ref);
  const quest = questFromSnapshot(snap);
  upsertQuestInState(quest);
  return quest;
}

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function setSelectedDate(value) {
  const iso = formatDateOnly(value);
  state.selectedDate = iso || todayISO();
}

function applyUserToState(userDocData) {
  const defaults = {
    totalXP: 0,
    totalCoins: 0,
    timezone: "Asia/Jerusalem",
    theme: "light",
  };

  const data = { ...defaults, ...(userDocData || {}) };
  state.totalXP = Number(data.totalXP) || 0;
  state.totalCoins = Number(data.totalCoins) || 0;
  state.timezone = data.timezone || defaults.timezone;
  state.theme = data.theme || defaults.theme;
}

async function ensureUserDoc(userId) {
  const ref = await userDoc(userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, newUserPayload(), { merge: true });
    return {
      totalXP: 0,
      totalCoins: 0,
      timezone: "Asia/Jerusalem",
      theme: "light",
    };
  }

  const data = snap.data() || {};
  const defaults = {
    totalXP: 0,
    totalCoins: 0,
    timezone: "Asia/Jerusalem",
    theme: "light",
  };

  const patch = {};
  for (const key of Object.keys(defaults)) {
    if (data[key] === undefined || data[key] === null) {
      patch[key] = defaults[key];
    }
  }

  if (Object.keys(patch).length) {
    await setDoc(ref, patch, { merge: true });
  }

  return { ...defaults, ...data, ...patch };
}

async function fetchQuests(userId) {
  const ref = await userQuestsCollection(userId);
  const q = query(ref, orderBy("dueDate", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(questFromSnapshot);
}

function questFromSnapshot(snap) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    title: data.title || "",
    status: data.status || "planned",
    dueDate: formatDateOnly(data.dueDate),
    estimatedMinutes: Number(data.estimatedMinutes) || 0,
    xp: Number(data.xp) || 0,
    coins: Number(data.coins) || 0,
    createdAt: formatDateTime(data.createdAt),
    updatedAt: formatDateTime(data.updatedAt),
    // Legacy UI field; may be empty if not stored in Firestore.
    course: data.course || "",
  };
}

function upsertQuestInState(quest) {
  const idx = state.quests.findIndex((q) => q.id === quest.id);
  if (idx >= 0) {
    state.quests[idx] = quest;
  } else {
    state.quests.push(quest);
  }
}

function normalizeQuestInput(data = {}) {
  const normalized = { ...data };

  if (typeof normalized.dueDate === "string") {
    const parsed = new Date(normalized.dueDate);
    if (!isNaN(parsed.getTime())) {
      normalized.dueDate = parsed;
    }
  }

  return normalized;
}

function formatDateOnly(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString().slice(0, 10);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return "";
}

function formatDateTime(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `quest-${Math.random().toString(16).slice(2)}`;
}
