import { ensureDefaults, shiftCalendar, state, withDefaults } from "../state.js";
import { renderAll } from "../render.js";

export function createActions({ storage, dom, setSummary, modal }) {
  const actions = {};

  function refresh() {
    renderAll(dom, state, actions, setSummary, modal);
  }

  function clearForm() {
    if (dom.form) dom.form.reset();
    if (dom.courseSelect) dom.courseSelect.focus();
  }

  function addQuest(quest) {
    state.quests.push(withDefaults(quest));
    storage.persistAll();
    clearForm();
    refresh();
  }

  function addCourse(name) {
    const value = name.trim();
    if (!value) return;
    if (!state.courses.includes(value)) state.courses.push(value);
    storage.persistAll({ alsoSaveFile: false });
    refresh();
  }

  function addCategory(name) {
    const value = name.trim();
    if (!value) return;
    if (!state.categories.includes(value)) state.categories.push(value);
    storage.persistAll({ alsoSaveFile: false });
    refresh();
  }

  function updateQuest(index, changes) {
    state.quests[index] = withDefaults({ ...state.quests[index], ...changes });
    storage.persistAll({ alsoSaveFile: false });
    refresh();
  }

  function removeQuest(index) {
    state.quests.splice(index, 1);
    storage.persistAll();
    refresh();
  }

  function removeCourse(index) {
    state.courses.splice(index, 1);
    ensureDefaults(state);
    storage.persistAll({ alsoSaveFile: false });
    refresh();
  }

  function removeCategory(index) {
    state.categories.splice(index, 1);
    ensureDefaults(state);
    storage.persistAll({ alsoSaveFile: false });
    refresh();
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
