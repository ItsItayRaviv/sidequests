// app.js
import { initState } from "./state.js";
import { renderApp } from "./render.js";
import { attachGlobalHandlers } from "./events.js";

async function init() {
  renderApp(); // initial paint (shows loading state)
  await initState(); // sets up state object, selectedDate, fetches Firestore
  renderApp(); // draw with data
  attachGlobalHandlers(); // wires up click handlers (delegated)
}

init();
