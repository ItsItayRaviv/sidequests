import { renderApp } from "./render.js";
import { state, addQuest, loadStateForUser, setSelectedDate, updateQuest } from "./state.js";
import { signInWithGoogle } from "./auth.js";

export function attachGlobalHandlers() {
  const handle = async (event) => {
    const actionTarget = event.target?.closest?.("[data-action]");
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;

    // Live update label without re-render while dragging slider.
    if (action === "quest-progress" && event.type === "input") {
      syncProgressLabel(actionTarget);
      return;
    }

    // Avoid double-handling range/checkbox clicks; use change/input instead.
    if (event.type === "click" && (action === "quest-progress" || action === "toggle-quest")) {
      return;
    }

    const shouldRender = await handleAction(action, event, actionTarget);

    // After any state change:
    if (shouldRender !== false) {
      renderApp();
    }
  };

  document.addEventListener("click", handle);
  document.addEventListener("input", handle);
  document.addEventListener("change", handle);
}

async function handleAction(action, event, target) {
  switch (action) {
    case "new-quest":
      await createTemplateQuest();
      break;
    case "sign-in-google":
      await handleGoogleSignIn();
      break;
    case "select-day":
      handleSelectDay(target);
      break;
    case "toggle-quest":
      await handleToggleQuest(target);
      break;
    case "quest-progress":
      await handleQuestProgress(target);
      break;
    // TODO v0.1: handle save-quest
    default:
      break;
  }
}

async function createTemplateQuest() {
  if (state.loading || !state.userId) {
    console.warn("Still connecting; cannot create quest yet.");
    return;
  }

  const targetDate = state.selectedDate;

  const payload = {
    title: "New Quest",
    course: "General",
    status: "planned",
    dueDate: endOfDay(targetDate),
    estimatedMinutes: 60,
    xp: 50,
    coins: 200,
  };

  try {
    await addQuest(payload);
  } catch (err) {
    console.error("Failed to create quest", err);
  }
}

function endOfDay(iso) {
  const fallback = endOfToday();
  if (!iso) return fallback;

  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;

  d.setHours(23, 59, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return d;
}

async function handleGoogleSignIn() {
  try {
    const user = await signInWithGoogle();
    await loadStateForUser(user);
  } catch (err) {
    console.error("Google sign-in failed", err);
  }
}

function handleSelectDay(target) {
  const iso = target?.dataset?.day;
  if (!iso) return;
  setSelectedDate(iso);
}

async function handleToggleQuest(target) {
  const questId = target?.dataset?.questId;
  if (!questId) return;

  const completed = !!target.checked;
  const progress = completed ? 100 : 0;
  const status = completed ? "completed" : "planned";

  await updateQuest(questId, { status, progress });
}

async function handleQuestProgress(target) {
  const questId = target?.dataset?.questId;
  if (!questId) return;

  const raw = Number(target.value);
  if (Number.isNaN(raw)) return;

  const progress = Math.min(100, Math.max(0, Math.round(raw)));
  const quest = state.quests.find((q) => q.id === questId);
  let status = quest?.status || "planned";

  if (progress >= 100) {
    status = "completed";
  } else if (status === "completed") {
    status = "planned";
  }

  await updateQuest(questId, { progress, status });
}

function syncProgressLabel(target) {
  const value = Number(target.value);
  if (Number.isNaN(value)) return;
  const label = target.closest(".quest-card__progress")?.querySelector(".quest-card__progress-value");
  if (label) {
    label.textContent = `${value}%`;
  }
}
