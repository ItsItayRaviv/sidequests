import { createActions } from "./actions.js";
import { bindEvents } from "./events.js";
import { mountLayout } from "./layout.js";
import { ensureDefaults, state, withDefaults } from "./state.js";
import { createStorage } from "./storage.js";
import { createModal } from "./modal.js";

const host = document.getElementById("appRoot") || document.body;
const dom = mountLayout(host);

const setStatus = (text) => {
  if (dom.statusEl) dom.statusEl.textContent = text;
};

const setSummary = (text) => {
  if (dom.summaryStatusEl) dom.summaryStatusEl.textContent = text;
};

const storage = createStorage({ setStatus });
const modal = createModal(dom);
const actions = createActions({ storage, dom, setSummary, modal, setStatus });

storage.setOnDataChanged(() => actions.refresh());
bindEvents({ dom, actions });

async function bootstrap() {
  setStatus("Loading data from Firebase...");
  try {
    const remote = await storage.loadRemoteData();
    state.quests = remote.quests.map(withDefaults);
    state.courses = remote.courses;
    state.categories = remote.categories;
    state.userId = remote.userId;
    ensureDefaults(state);
    actions.refresh();
    setStatus(`Synced with Firebase${remote.userId ? ` (user ${remote.userId})` : ""}.`);
  } catch (error) {
    console.error(error);
    setStatus("Could not load data from Firebase. Check your config and network.");
  }
}

bootstrap();
