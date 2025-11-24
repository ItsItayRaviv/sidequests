import { ensureDefaults, shiftCalendar, state, todayISO, withDefaults } from "./state.js";
import { renderAll } from "./render.js";

const questIndex = (questRef) =>
  typeof questRef === "number" ? questRef : state.quests.findIndex((q) => q.id === questRef);

export function createActions({ storage, dom, setSummary, modal, setStatus }) {
  const actions = {};

  function refresh() {
    ensureDefaults(state);
    renderAll(dom, state, actions, setSummary, modal);
  }

  async function addQuest(quest, { onSaved } = {}) {
    const base = withDefaults({ ...quest, reward: quest.reward || { sx: 0, coins: 0 } });
    try {
      if (setStatus) setStatus("Saving quest to Firebase...");
      const saved = await storage.addQuest(base);
      const normalized = withDefaults(saved);
      state.quests.push(normalized);
      ensureDefaults(state);
      refresh();
      if (typeof onSaved === "function") onSaved(normalized);
      if (setStatus) setStatus("Quest saved to Firebase.");
      return normalized;
    } catch (error) {
      console.error("Failed to add quest", error);
      if (setStatus) setStatus("Could not save quest to Firebase.");
      return null;
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

  async function updateQuest(questRef, changes) {
    const index = questIndex(questRef);
    if (index < 0) return;
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

  async function removeQuest(questRef) {
    const index = questIndex(questRef);
    if (index < 0) return;
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

  function focusDay(dateString) {
    const target = dateString || todayISO();
    state.ui.selectedDate = target;
    const parsed = new Date(target);
    if (!Number.isNaN(parsed.getTime())) {
      state.calendar.month = parsed.getMonth();
      state.calendar.year = parsed.getFullYear();
    }
    const tasks = state.quests.filter((q) => q.dueDate === target);
    if (tasks.length && state.ui.detailMode !== "new") {
      state.ui.selectedQuestId = tasks[0].id;
      state.ui.detailMode = "view";
    } else if (!tasks.length) {
      state.ui.selectedQuestId = null;
    }
    refresh();
  }

  function setDayFilter(value) {
    state.ui.dayFilter = value;
    refresh();
  }

  function selectQuest(questId) {
    state.ui.selectedQuestId = questId;
    state.ui.detailMode = "view";
    refresh();
  }

  function startNewQuestForDate(dateString) {
    state.ui.selectedDate = dateString || state.ui.selectedDate || todayISO();
    state.ui.detailMode = "new";
    state.ui.selectedQuestId = null;
    refresh();
  }

  function jumpToToday() {
    const iso = todayISO();
    const todayDate = new Date(iso);
    state.calendar.month = todayDate.getMonth();
    state.calendar.year = todayDate.getFullYear();
    focusDay(iso);
  }

  function setCalendarMonth(delta) {
    if (state.calendar.view === "week") {
      const base = state.ui.selectedDate ? new Date(state.ui.selectedDate) : new Date();
      if (!Number.isNaN(base.getTime())) {
        base.setDate(base.getDate() + delta * 7);
        state.calendar.month = base.getMonth();
        state.calendar.year = base.getFullYear();
        state.ui.selectedDate = base.toISOString().split("T")[0];
      }
      refresh();
    } else {
      const currentSelected = state.ui.selectedDate ? new Date(state.ui.selectedDate) : null;
      const fallbackDay = currentSelected?.getDate() || 1;
      shiftCalendar(state, delta);
      const daysInTarget = new Date(state.calendar.year, state.calendar.month + 1, 0).getDate();
      const targetDay = Math.min(fallbackDay, daysInTarget);
      const nextDate = new Date(state.calendar.year, state.calendar.month, targetDay);
      state.ui.selectedDate = nextDate.toISOString().split("T")[0];
      refresh();
    }
  }

  function setCalendarView(mode) {
    state.calendar.view = mode;
    if (mode === "month" && state.ui.selectedDate) {
      const parsed = new Date(state.ui.selectedDate);
      if (!Number.isNaN(parsed.getTime())) {
        state.calendar.month = parsed.getMonth();
        state.calendar.year = parsed.getFullYear();
      }
    }
    if (!state.ui.selectedDate) {
      state.ui.selectedDate = todayISO();
    }
    refresh();
  }

  function setCalendarCourseFilter(value) {
    state.calendar.courseFilter = value;
    refresh();
  }

  function switchView(id) {
    state.ui.activeView = id;
    if (id !== "questsView") state.ui.drawerQuestId = null;
    refresh();
  }

  function setQuestFilters(partial) {
    state.ui.questFilters = { ...state.ui.questFilters, ...partial };
    refresh();
  }

  function openDrawer(questId) {
    state.ui.drawerQuestId = questId;
    refresh();
  }

  function closeDrawer() {
    state.ui.drawerQuestId = null;
    refresh();
  }

  function updatePreference(key, value) {
    state.preferences[key] = value;
    if (key === "defaultCalendarView") {
      state.calendar.view = value;
    }
    refresh();
  }

  Object.assign(actions, {
    addCategory,
    addCourse,
    addQuest,
    closeDrawer,
    focusDay,
    jumpToToday,
    openDrawer,
    refresh,
    removeCategory,
    removeCourse,
    removeQuest,
    selectQuest,
    setCalendarCourseFilter,
    setCalendarMonth,
    setCalendarView,
    setDayFilter,
    setQuestFilters,
    startNewQuestForDate,
    switchView,
    updatePreference,
    updateQuest,
  });

  return actions;
}
