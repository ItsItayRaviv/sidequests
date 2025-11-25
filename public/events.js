import { renderApp } from "./render.js";
import { state, addQuest, loadStateForUser } from "./state.js";
import { signInWithGoogle } from "./auth.js";

export function attachGlobalHandlers() {
  document.addEventListener("click", async (event) => {
    const action = event.target.dataset.action;
    if (!action) return;

    await handleAction(action, event);

    // After any state change:
    renderApp();
  });
}

async function handleAction(action, event) {
  switch (action) {
    case "new-quest":
      await createTemplateQuest();
      break;
    case "sign-in-google":
      await handleGoogleSignIn();
      break;
    // TODO v0.1: handle select-day
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

  const payload = {
    title: "New Quest",
    course: "General",
    status: "planned",
    dueDate: endOfToday(),
    estimatedMinutes: 60,
    xp: 10,
    coins: 5,
  };

  try {
    await addQuest(payload);
  } catch (err) {
    console.error("Failed to create quest", err);
  }
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
