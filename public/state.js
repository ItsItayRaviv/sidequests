export const STORAGE_KEYS = {
  quests: "quests",
  courses: "courses",
  categories: "categories",
  legacyAssignments: "assignments",
};

export const state = {
  quests: [],
  courses: [],
  categories: [],
  subtasks: {},
  userId: null,
  fileHandle: null,
  calendar: {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    view: "month",
    courseFilter: "all",
  },
  calendarSelection: {},
  ui: {
    activeView: "homeView",
    selectedDate: null,
    selectedQuestId: null,
    dayFilter: "all",
    detailMode: "view",
    newQuestDraft: null,
    drawerQuestId: null,
    questFilters: {
      courses: [],
      status: "All",
      sort: "date",
    },
  },
  preferences: {
    showHeatmap: true,
    showProgressRing: true,
    showCompletionCheck: true,
    defaultCalendarView: "month",
  },
};

export function ensureDefaults(current = state) {
  if (!current.preferences) {
    current.preferences = {
      showHeatmap: true,
      showProgressRing: true,
      showCompletionCheck: true,
      defaultCalendarView: "month",
    };
  }

  if (!current.calendar) {
    const now = new Date();
    current.calendar = {
      month: now.getMonth(),
      year: now.getFullYear(),
      view: current.preferences.defaultCalendarView || "month",
      courseFilter: "all",
    };
  }
  if (typeof current.calendar.month !== "number") current.calendar.month = new Date().getMonth();
  if (typeof current.calendar.year !== "number") current.calendar.year = new Date().getFullYear();
  if (!current.calendar.view) current.calendar.view = current.preferences.defaultCalendarView || "month";
  if (!current.calendar.courseFilter) current.calendar.courseFilter = "all";

  if (!current.courses.length) current.courses = ["General"];
  if (!current.categories.length) current.categories = ["General"];
  current.courses = Array.from(new Set(current.courses));
  current.categories = Array.from(new Set(current.categories));

  if (!current.ui) {
    current.ui = { activeView: "homeView" };
  }
  if (!current.ui.activeView) current.ui.activeView = "homeView";
  if (!current.ui.selectedDate) current.ui.selectedDate = todayISO();
  if (!current.ui.dayFilter) current.ui.dayFilter = "all";
  if (!current.ui.questFilters) {
    current.ui.questFilters = { courses: [], status: "All", sort: "date" };
  }
  if (!current.subtasks) current.subtasks = {};
}

export function withDefaults(quest) {
  const parsedCompletion = Number(quest?.completion);
  const completion = Number.isFinite(parsedCompletion) ? Math.max(0, Math.min(100, parsedCompletion)) : 0;
  const parsedMinutes = Number(quest?.estMinutes);
  const estMinutes = Number.isFinite(parsedMinutes) && parsedMinutes > 0 ? Math.round(parsedMinutes) : null;
  const reward = {
    sx: Number.isFinite(Number(quest?.reward?.sx)) ? Number(quest.reward.sx) : 0,
    coins: Number.isFinite(Number(quest?.reward?.coins)) ? Number(quest.reward.coins) : 0,
  };
  const title = typeof quest?.title === "string" ? quest.title : "";
  const dueTime = typeof quest?.dueTime === "string" ? quest.dueTime : "";

  return {
    ...quest,
    completion,
    estMinutes,
    title,
    dueTime,
    done: Boolean(quest?.done),
    reward,
  };
}

export function daysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateString);
  if (Number.isNaN(due.getTime())) return null;
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

export function formatDue(dateString) {
  if (!dateString) return "No date";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  const daysLeft = daysUntil(dateString);
  if (daysLeft === null) return "Invalid date";
  const absoluteDays = Math.abs(daysLeft);
  const label =
    daysLeft === 0
      ? "Due today"
      : `${absoluteDays} day${absoluteDays === 1 ? "" : "s"} ${daysLeft >= 0 ? "left" : "overdue"}`;
  return `${d.toISOString().split("T")[0]} - ${label}`;
}

export function normalizeData(raw) {
  if (!raw) return { quests: [], courses: [], categories: [] };
  if (Array.isArray(raw)) return { quests: raw, courses: [], categories: [] };
  return {
    quests: Array.isArray(raw.quests) ? raw.quests : Array.isArray(raw.assignments) ? raw.assignments : [],
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    categories: Array.isArray(raw.categories) ? raw.categories : [],
  };
}

export function shiftCalendar(current = state, delta) {
  current.calendar.month += delta;
  if (current.calendar.month < 0) {
    current.calendar.month = 11;
    current.calendar.year -= 1;
  }
  if (current.calendar.month > 11) {
    current.calendar.month = 0;
    current.calendar.year += 1;
  }
}

export function todayISO() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
}
