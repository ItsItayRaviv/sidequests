import { createActions } from "./actions.js";
import { bindEvents } from "./events.js";
import { mountLayout } from "../layout.js";
import { ensureDefaults, normalizeData, state, withDefaults } from "../state.js";
import { createStorage } from "../storage.js";
import { createModal } from "../modal.js";

const host = document.getElementById("appRoot") || document.body;
const dom = mountLayout(host);

const setStatus = (text) => {
  if (dom.statusEl) dom.statusEl.textContent = text;
};

const setSummary = (text) => {
  if (dom.summaryStatusEl) dom.summaryStatusEl.textContent = text;
};

const storage = createStorage({ setStatus, filePicker: dom.filePicker });
const modal = createModal(dom);
const actions = createActions({ storage, dom, setSummary, modal });

storage.setOnDataChanged(() => actions.refresh());
bindEvents({ dom, actions, storage });

async function bootstrap() {
  const local = storage.readLocalData();
  const normalizedLocal = normalizeData(local);
  state.quests = normalizedLocal.quests.map(withDefaults);
  state.courses = normalizedLocal.courses;
  state.categories = normalizedLocal.categories;

  if (!state.quests.length) {
    const bundled = await storage.fetchBundledData();
    const normalizedBundled = normalizeData(bundled);
    state.quests = normalizedBundled.quests.map(withDefaults);
    state.courses = state.courses.length ? state.courses : normalizedBundled.courses;
    state.categories = state.categories.length ? state.categories : normalizedBundled.categories;
    if (state.quests.length) {
      ensureDefaults(state);
      storage.writeLocalData();
      setStatus("Loaded bundled assignments.json");
    }
  }

  ensureDefaults(state);
  actions.refresh();
  if (!state.quests.length) setStatus("Ready to save quests to file or browser storage.");
}

bootstrap();
