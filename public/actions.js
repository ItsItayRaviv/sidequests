import { ensureDefaults, shiftCalendar, state, withDefaults } from "./state.js";
import { renderAll } from "./render.js";

export function createActions({ storage, dom, setSummary, modal, setStatus }) {
  const actions = {};

  function refresh() {
    renderAll(dom, state, actions, setSummary, modal);
  }

  function clearForm() {
    if (dom.form) dom.form.reset();
    if (dom.courseSelect) dom.courseSelect.focus();
  }

  async function addQuest(quest) {
    const base = withDefaults({ ...quest, reward: quest.reward || { sx: 0, coins: 0 } });
    try {
      if (setStatus) setStatus("Saving quest to Firebase...");
      const saved = await storage.addQuest(base);
      state.quests.push(withDefaults(saved));
      ensureDefaults(state);
      clearForm();
      refresh();
      if (setStatus) setStatus("Quest saved to Firebase.");
    } catch (error) {
      console.error("Failed to add quest", error);
      if (setStatus) setStatus("Could not save quest to Firebase.");
    }
  }

  async function addCourse(name) {
    const value = name.trim();
    if (!value) return;
    if (state.courses.includes(value)) return;
    state.courses.push(value);
    refresh();
    try {
      await storage.addCourse(value);
      ensureDefaults(state);
      if (setStatus) setStatus("Course saved to Firebase.");
    } catch (error) {
      console.error("Failed to add course", error);
      state.courses = state.courses.filter((c) => c !== value);
      refresh();
      if (setStatus) setStatus("Could not save course to Firebase.");
    }
  }

  async function addCategory(name) {
    const value = name.trim();
    if (!value) return;
    if (state.categories.includes(value)) return;
    state.categories.push(value);
    refresh();
    try {
      await storage.addCategory(value);
      ensureDefaults(state);
      if (setStatus) setStatus("Category saved to Firebase.");
    } catch (error) {
      console.error("Failed to add category", error);
      state.categories = state.categories.filter((c) => c !== value);
      refresh();
      if (setStatus) setStatus("Could not save category to Firebase.");
    }
  }

  async function updateQuest(index, changes) {
    const existing = state.quests[index];
    if (!existing) return;
    const updated = withDefaults({ ...existing, ...changes });
    state.quests[index] = updated;
    refresh();
    try {
      await storage.updateQuestProgress(updated.id, {
        completion: updated.completion,
        done: updated.done,
      });
      if (setStatus) setStatus("Progress saved to Firebase.");
    } catch (error) {
      console.error("Failed to update quest", error);
      state.quests[index] = existing;
      refresh();
      if (setStatus) setStatus("Could not save progress to Firebase.");
    }
  }

  async function removeQuest(index) {
    const [removed] = state.quests.splice(index, 1);
    refresh();
    if (!removed) return;
    try {
      await storage.deleteQuest(removed.id);
      if (setStatus) setStatus("Quest deleted from Firebase.");
    } catch (error) {
      console.error("Failed to delete quest", error);
      state.quests.splice(index, 0, removed);
      refresh();
      if (setStatus) setStatus("Could not delete quest from Firebase.");
    }
  }

  async function removeCourse(index) {
    const [removed] = state.courses.splice(index, 1);
    ensureDefaults(state);
    refresh();
    if (!removed) return;
    try {
      await storage.removeCourse(removed);
      if (setStatus) setStatus("Course removed in Firebase.");
    } catch (error) {
      console.error("Failed to remove course", error);
      state.courses.splice(index, 0, removed);
      refresh();
      if (setStatus) setStatus("Could not remove course from Firebase.");
    }
  }

  async function removeCategory(index) {
    const [removed] = state.categories.splice(index, 1);
    ensureDefaults(state);
    refresh();
    if (!removed) return;
    try {
      await storage.removeCategory(removed);
      if (setStatus) setStatus("Category removed in Firebase.");
    } catch (error) {
      console.error("Failed to remove category", error);
      state.categories.splice(index, 0, removed);
      refresh();
      if (setStatus) setStatus("Could not remove category from Firebase.");
    }
  }

  function setCalendarMonth(delta) {
    shiftCalendar(state, delta);
    refresh();
  }

  Object.assign(actions, {
    addCategory,
    addCourse,
    addQuest,
    refresh,
    removeCategory,
    removeCourse,
    removeQuest,
    setCalendarMonth,
    updateQuest,
  });

  return actions;
}
