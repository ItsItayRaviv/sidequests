import { renderApp } from "./render.js";
import { state } from "./state.js";

export function attachGlobalHandlers() {
  document.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (!action) return;

    switch (action) {
      // TODO v0.1: handle select-day
      // TODO v0.1: handle toggle-quest
      // TODO v0.1: handle save-quest
      default:
        break;
    }

    // After any state change:
    renderApp();
  });
}
