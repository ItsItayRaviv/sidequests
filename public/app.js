// app.js
import { initState } from "./state.js";
import { renderApp } from "./render.js";
import { attachGlobalHandlers } from "./events.js";

function init() {
  initState();       // sets up state object, selectedDate, etc.
  renderApp();       // draws the UI
  attachGlobalHandlers(); // wires up click handlers (delegated)
}

init();