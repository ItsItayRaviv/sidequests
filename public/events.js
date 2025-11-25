import { renderApp } from "./render.js";
import { state, addQuest, loadStateForUser, setSelectedDate } from "./state.js";
import { signInWithGoogle } from "./auth.js";

export function attachGlobalHandlers() {
  document.addEventListener("click", async (event) => {
    const actionTarget = event.target?.closest?.("[data-action]");
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;

    await handleAction(action, event, actionTarget);

    // After any state change:
    renderApp();
  });
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
    // TODO v0.1: handle toggle-quest
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
