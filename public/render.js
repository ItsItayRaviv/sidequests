import { state } from "./state.js";
import { Header } from "./components/header.js";
import { DayStrip } from "./components/dayStrip.js";
import { QuestList } from "./components/questList.js";

export function renderApp() {
  const root = document.getElementById("appRoot");
  root.innerHTML = `
    <div class="app-shell">
      <h1 class="main-title">SideQuests</h1>
      <p class="subtitle">
        Minimal MVP shell. Core features incoming.
      </p>

      ${Header(state)}
      ${DayStrip(state)}
      ${QuestList(state)}
    </div>
  `;
}
