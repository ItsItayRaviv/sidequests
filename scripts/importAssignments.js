#!/usr/bin/env node
"use strict";

const fs = require("fs/promises");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const DATA_PATH = process.env.ASSIGNMENTS_PATH || path.join(process.cwd(), "assignments.json");
const USER_ID = process.env.FIREBASE_USER_ID || "local-user";
const CREDENTIAL_PATH = process.env.FIREBASE_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!CREDENTIAL_PATH) {
  console.error("Set FIREBASE_CREDENTIALS (or GOOGLE_APPLICATION_CREDENTIALS) to your service account JSON path.");
  process.exit(1);
}

async function loadJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

function toTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
}

function normalizeReward(reward) {
  const sx = Number(reward?.sx);
  const coins = Number(reward?.coins);
  return {
    sx: Number.isFinite(sx) ? sx : 0,
    coins: Number.isFinite(coins) ? coins : 0,
  };
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildQuestId(quest, index) {
  const base = [quest.course, quest.category, quest.dueDate].filter(Boolean).join("-");
  const slug = slugify(base);
  if (slug) return slug;
  const fallback = slugify(`${quest.course || "quest"}-${index}`);
  return fallback || `quest-${index}`;
}

(async () => {
  const [data, credentials] = await Promise.all([loadJson(DATA_PATH), loadJson(CREDENTIAL_PATH)]);

  initializeApp({ credential: cert(credentials) });
  const db = getFirestore();

  const quests = Array.isArray(data.quests) ? data.quests : [];
  const courses = Array.isArray(data.courses) ? data.courses : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];

  await db.doc("config/metadata").set(
    {
      courses,
      categories,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  console.log(`Updated metadata (courses: ${courses.length}, categories: ${categories.length}).`);

  let imported = 0;
  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i];
    const questId = buildQuestId(quest, i + 1);
    const definition = {
      course: quest.course || "General",
      category: quest.category || "General",
      dueDate: toTimestamp(quest.dueDate),
      estMinutes: quest.estMinutes ? Number(quest.estMinutes) || null : null,
      link: quest.link || "",
      filePath: quest.filePath || "",
      notes: quest.notes || "",
      reward: normalizeReward(quest.reward),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const progress = {
      completion: Number.isFinite(Number(quest.completion)) ? Number(quest.completion) : 0,
      done: Boolean(quest.done),
      rewardClaimed: Boolean(quest.rewardClaimed),
      sxEarned: Number.isFinite(Number(quest.sxEarned)) ? Number(quest.sxEarned) : 0,
      coinsEarned: Number.isFinite(Number(quest.coinsEarned)) ? Number(quest.coinsEarned) : 0,
      updatedAt: Timestamp.now(),
    };
    if (progress.done) progress.completedAt = Timestamp.now();

    await db.collection("quests").doc(questId).set(definition, { merge: true });
    await db.collection("users").doc(USER_ID).collection("quests").doc(questId).set(
      {
        ...progress,
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );
    imported++;
  }

  console.log(`Imported ${imported} quests into Firestore for user "${USER_ID}".`);
})().catch((error) => {
  console.error("Failed to import assignments:", error);
  process.exit(1);
});
