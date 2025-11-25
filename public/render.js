
import { daysUntil, ensureDefaults, formatDue, todayISO } from "./state.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COURSE_COLORS = ["#8ba6ff", "#ffc9a3", "#c0d7a7", "#f2a1b5", "#a5c8ff", "#e5c3ff", "#9ad7d4", "#ffd9a8"];

const TYPE_LABELS = {
  assignments: "Assignments",
  tests: "Tests",
  projects: "Projects",
  other: "Other",
};

const STATUS_OPTIONS = ["All", "Today", "This week", "Overdue", "Completed"];

const SEGMENTS = [0, 25, 50, 75, 100];

function pad(value) {
  return String(value).padStart(2, "0");
}

function courseColor(course) {
  if (!course) return COURSE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < course.length; i++) {
    hash = course.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
}

function questTitle(quest) {
  return quest?.title?.trim() || quest?.category || "Untitled quest";
}

function questType(quest) {
  const raw = (quest?.category || quest?.type || "").toLowerCase();
  if (raw.includes("assign")) return TYPE_LABELS.assignments;
  if (raw.includes("test") || raw.includes("exam")) return TYPE_LABELS.tests;
  if (raw.includes("project") || raw.includes("lab")) return TYPE_LABELS.projects;
  return TYPE_LABELS.other;
}

function dueTimeLabel(quest) {
  if (quest?.dueTime) return quest.dueTime;
  return "All day";
}

function formatDateLong(dateString) {
  if (!dateString) return "No date selected";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "No date selected";
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function hoursFromMinutes(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round((value / 60) * 10) / 10;
}

function setText(el, text) {
  if (el) el.textContent = text;
}

function computeDayStats(questsForDay = []) {
  const count = questsForDay.length;
  const overdue = questsForDay.filter((q) => {
    const diff = daysUntil(q.dueDate);
    return diff !== null && diff < 0 && !q.done;
  }).length;
  const estimatedMinutes = questsForDay.reduce((sum, q) => sum + (Number(q.estMinutes) || 0), 0);
  const estimatedHours = estimatedMinutes ? Math.round((estimatedMinutes / 60) * 10) / 10 : 0;
  return { count, overdue, estimatedHours };
}

function renderTabs(dom, currentState) {
  const activeView = currentState.ui.activeView || "homeView";
  dom.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === activeView));
  Object.entries(dom.views).forEach(([id, node]) => {
    if (!node) return;
    node.classList.toggle("active", id === activeView);
  });
  if (dom.todayRibbon) {
    dom.todayRibbon.style.display = activeView === "homeView" || activeView === "questsView" ? "flex" : "none";
  }
}

function renderStats(dom, currentState, setSummary) {
  const total = currentState.quests.length;
  const todayCount = currentState.quests.filter((q) => daysUntil(q.dueDate) === 0 && !q.done).length;
  const overdue = currentState.quests.filter((q) => {
    const diff = daysUntil(q.dueDate);
    return diff !== null && diff < 0 && !q.done;
  }).length;
  const text = `${total} quests | ${todayCount} today | ${overdue} overdue`;
  setText(dom.globalStatsEl, text);
  if (typeof setSummary === "function") setSummary(text);
}

function renderTodayRibbon(dom, currentState) {
  if (!dom.todayRibbonText) return;
  const today = todayISO();
  const todayQuests = currentState.quests.filter((q) => q.dueDate === today);
  const stats = computeDayStats(todayQuests);
  dom.todayRibbonText.textContent = `Today: ${stats.count} quests - ${stats.estimatedHours}h estimated - ${stats.overdue} overdue`;
}
function buildDayPill(entry) {
  const pill = document.createElement("div");
  pill.className = "pill";
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.style.background = courseColor(entry.course);
  pill.appendChild(dot);
  const label = document.createElement("span");
  label.textContent = questTitle(entry);
  pill.appendChild(label);
  return pill;
}

function buildCalendarCell({ iso, displayDay, currentState, actions, tasksByDate, today }) {
  const cell = document.createElement("div");
  cell.className = "day-cell";
  const isToday = iso === today;
  if (isToday) cell.classList.add("today");
  if (iso === currentState.ui.selectedDate) cell.classList.add("selected");

  const top = document.createElement("div");
  top.className = "day-top";
  const dayNumber = document.createElement("span");
  dayNumber.className = "day-number";
  dayNumber.textContent = displayDay;
  top.appendChild(dayNumber);
  if (isToday) {
    const dot = document.createElement("span");
    dot.className = "today-dot";
    top.appendChild(dot);
  }
  cell.appendChild(top);

  const questsForDay = tasksByDate[iso] || [];
  const pillStack = document.createElement("div");
  pillStack.className = "pill-stack";

  const sorted = questsForDay.slice().sort((a, b) => Number(b.completion) - Number(a.completion));
  const visible = sorted.slice(0, 2);
  visible.forEach((entry) => pillStack.appendChild(buildDayPill(entry)));
  if (questsForDay.length > 2) {
    const more = document.createElement("div");
    more.className = "more-link";
    more.textContent = `+${questsForDay.length - 2} more`;
    pillStack.appendChild(more);
  }
  cell.appendChild(pillStack);

  const progress = questsForDay.length
    ? Math.round(questsForDay.reduce((sum, q) => sum + (Number(q.completion) || 0), 0) / questsForDay.length)
    : 0;

  if (currentState.preferences.showProgressRing && questsForDay.length) {
    const ring = document.createElement("div");
    ring.className = "ring";
    ring.style.setProperty("--p", progress);
    cell.appendChild(ring);
  } else if (questsForDay.length) {
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    const fill = document.createElement("span");
    fill.style.width = `${progress}%`;
    bar.appendChild(fill);
    cell.appendChild(bar);
  }

  const workloadIntensity = (() => {
    if (!currentState.preferences.showHeatmap) return null;
    const estMinutes = questsForDay.reduce((sum, q) => sum + (Number(q.estMinutes) || 0), 0);
    const weight = questsForDay.length + estMinutes / 120;
    const ratio = Math.min(1, weight / 6);
    const lightness = 248 - ratio * 16;
    return `hsl(224, 58%, ${lightness}%)`;
  })();
  if (workloadIntensity) cell.style.background = workloadIntensity;

  const overdue = questsForDay.some((q) => {
    const diff = daysUntil(q.dueDate);
    return diff !== null && diff < 0 && !q.done;
  });
  if (overdue) cell.classList.add("overdue-underline");

  const tooltip = questsForDay
    .map((q) => `${q.course || "Course"} | ${questTitle(q)} | ${questType(q)} | ${q.completion}%`)
    .join("\n");
  if (tooltip) cell.title = tooltip;

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "circle-btn day-add";
  addBtn.textContent = "+";
  addBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    actions.startNewQuestForDate(iso);
  });
  cell.appendChild(addBtn);

  cell.addEventListener("click", () => actions.focusDay(iso));
  return cell;
}

function renderCalendar(dom, currentState, actions) {
  const { year, month, view } = currentState.calendar;
  if (!dom.calendarGrid) return;
  if (dom.calendarViewToggle) {
    dom.calendarViewToggle.querySelectorAll("button[data-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === currentState.calendar.view);
    });
  }
  if (dom.calendarCourseFilter) {
    const options = ["all", ...currentState.courses];
    dom.calendarCourseFilter.innerHTML = options
      .map((c) => `<option value="${c}">${c === "all" ? "Show: All courses" : c}</option>`)
      .join("");
    dom.calendarCourseFilter.value = currentState.calendar.courseFilter || "all";
  }
  const today = todayISO();
  const filterCourse = currentState.calendar.courseFilter;
  const tasksByDate = currentState.quests.reduce((acc, quest) => {
    if (!quest.dueDate) return acc;
    if (filterCourse !== "all" && quest.course !== filterCourse) return acc;
    acc[quest.dueDate] = acc[quest.dueDate] || [];
    acc[quest.dueDate].push(quest);
    return acc;
  }, {});

  const renderWeek = () => {
    const selectedISO = currentState.ui.selectedDate || today;
    const selected = new Date(selectedISO);
    const base = Number.isNaN(selected.getTime()) ? new Date() : selected;
    const start = new Date(base);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setText(
      dom.calendarLabel,
      `Week of ${MONTH_NAMES[start.getMonth()]} ${start.getDate()} - ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
    );
    dom.calendarGrid.innerHTML = "";
    for (let offset = 0; offset < 7; offset++) {
      const current = new Date(start);
      current.setDate(start.getDate() + offset);
      const iso = current.toISOString().split("T")[0];
      const cell = buildCalendarCell({
        iso,
        displayDay: current.getDate(),
        currentState,
        actions,
        tasksByDate,
        today,
      });
      dom.calendarGrid.appendChild(cell);
    }
  };

  const renderMonth = () => {
    const monthName = MONTH_NAMES[month];
    setText(dom.calendarLabel, `${monthName} ${year}`);
    dom.calendarGrid.innerHTML = "";
    const firstDay = new Date(year, month, 1);
    const startIndex = firstDay.getDay(); // Sunday as first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < startIndex; i++) {
      dom.calendarGrid.appendChild(document.createElement("div"));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
      const cell = buildCalendarCell({
        iso,
        displayDay: day,
        currentState,
        actions,
        tasksByDate,
        today,
      });
      dom.calendarGrid.appendChild(cell);
    }
  };

  if (view === "week") {
    renderWeek();
  } else {
    renderMonth();
  }
}
function renderDayFilter(dom, currentState) {
  if (!dom.dayFilter) return;
  dom.dayFilter.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentState.ui.dayFilter);
  });
}

function renderDayList(dom, currentState, actions) {
  if (!dom.dayQuestList) return;
  dom.dayQuestList.innerHTML = "";
  const selectedDate = currentState.ui.selectedDate || todayISO();
  const questsForDay = currentState.quests.filter((q) => q.dueDate === selectedDate);
  const filter = currentState.ui.dayFilter;

  const filtered = questsForDay.filter((q) => {
    const type = questType(q);
    if (filter === "assignments") return type === TYPE_LABELS.assignments;
    if (filter === "tests") return type === TYPE_LABELS.tests;
    if (filter === "projects") return type === TYPE_LABELS.projects;
    if (filter === "other") return type === TYPE_LABELS.other;
    return true;
  });

  if (!filtered.length) {
    if (currentState.ui.detailMode === "new") {
      const frag = document.createDocumentFragment();
      frag.appendChild(buildNewQuestCard(currentState, actions, selectedDate));
      dom.dayQuestList.appendChild(frag);
    } else {
      dom.dayQuestList.innerHTML =
        '<div class="empty">No quests for this date. Add one to start planning.</div>';
    }
    return;
  }

  if (currentState.ui.detailMode !== "new" && filtered.length && !filtered.find((q) => q.id === currentState.ui.selectedQuestId)) {
    currentState.ui.selectedQuestId = filtered[0].id;
  }

  const frag = document.createDocumentFragment();
  const sorted = filtered
    .slice()
    .sort((a, b) => Number(a.done) - Number(b.done) || Number(b.completion) - Number(a.completion));

  sorted.forEach((quest) => {
    const isExpanded = currentState.ui.selectedQuestId === quest.id && currentState.ui.detailMode !== "new";
    const card = document.createElement("article");
    card.className = `day-card ${isExpanded ? "selected" : ""}`;
    const strip = document.createElement("div");
    strip.className = "course-strip";
    strip.style.background = courseColor(quest.course);
    card.appendChild(strip);

    const header = document.createElement("div");
    header.className = "card-header";
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = quest.course || "Course";
    header.appendChild(title);

    const caret = document.createElement("span");
    caret.className = "caret";
    caret.textContent = isExpanded ? "▴" : "▾";

    const progress = document.createElement("div");
    progress.className = "small-progress";
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    const fill = document.createElement("span");
    fill.style.width = `${quest.completion || 0}%`;
    bar.appendChild(fill);
    const pct = document.createElement("span");
    pct.className = "muted small";
    pct.textContent = `${quest.completion || 0}%`;
    progress.append(bar, pct);
    header.append(progress, caret);
    card.appendChild(header);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${questTitle(quest)} · ${questType(quest)} · due ${dueTimeLabel(quest)}`;
    card.appendChild(meta);

    const iconRow = document.createElement("div");
    iconRow.className = "icon-row";
    if (quest.notes) iconRow.append("🗒");
    if (quest.link) iconRow.append("🔗");
    const overdue = daysUntil(quest.dueDate);
    if (overdue !== null && overdue < 0 && !quest.done) iconRow.append("⚠");
    if (quest.done) iconRow.append("✅");
    if (iconRow.childNodes.length) card.appendChild(iconRow);

    if (isExpanded) {
      renderExpandedBlocks(card, quest, currentState, actions);
    }

    card.addEventListener("click", () => actions.toggleQuestCard(quest.id));
    frag.appendChild(card);
  });

  if (currentState.ui.detailMode === "new") {
    frag.appendChild(buildNewQuestCard(currentState, actions, selectedDate));
  }

  dom.dayQuestList.appendChild(frag);
}
function renderSubtasks(container, quest, currentState, actions) {
  container.innerHTML = "";
  const list = currentState.subtasks[quest.id] || [];
  const block = document.createElement("div");
  block.className = "detail-block expanded-block";
  const label = document.createElement("div");
  label.className = "detail-label";
  label.textContent = "Subtasks";
  block.appendChild(label);

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "muted small";
    empty.textContent = "No subtasks - Add one";
    block.appendChild(empty);
  } else {
    const ul = document.createElement("div");
    ul.className = "day-list";
    list.forEach((item) => {
      const row = document.createElement("label");
      row.className = "meta";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(item.done);
      checkbox.addEventListener("change", (event) => {
        event.stopPropagation();
        item.done = checkbox.checked;
        const percent = Math.round((list.filter((i) => i.done).length / list.length) * 100);
        actions.updateQuest(quest.id, { completion: percent, done: percent === 100 });
      });
      const text = document.createElement("span");
      text.textContent = item.text;
      row.prepend(checkbox);
      row.appendChild(text);
      ul.appendChild(row);
    });
    block.appendChild(ul);
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "link-button";
  addBtn.textContent = "+ Add subtask";
  addBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const text = prompt("New subtask");
    if (!text) return;
    const updated = [...list, { text, done: false }];
    currentState.subtasks[quest.id] = updated;
    actions.refresh();
  });
  block.appendChild(addBtn);
  container.appendChild(block);
}

function renderProgressBlock(container, quest, actions) {
  const completion = Math.max(0, Math.min(100, Number(quest.completion) || 0));
  const block = document.createElement("div");
  block.className = "detail-block expanded-block";
  const label = document.createElement("div");
  label.className = "detail-label";
  label.textContent = "Progress";
  block.appendChild(label);

  const segments = document.createElement("div");
  segments.className = "segment-group small";
  SEGMENTS.forEach((value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `segment ${value === completion ? "active" : ""}`;
    btn.textContent = `${value}%`;
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const done = quest.done && value === 100 ? true : value === 100;
      if (value < 100 && quest.done) {
        actions.updateQuest(quest.id, { completion: value, done: false });
      } else {
        actions.updateQuest(quest.id, { completion: value, done });
      }
    });
    segments.appendChild(btn);
  });
  block.appendChild(segments);

  const doneRow = document.createElement("label");
  doneRow.className = "meta";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = quest.done;
  checkbox.addEventListener("change", (event) => {
    event.stopPropagation();
    const nextCompletion = checkbox.checked ? 100 : completion;
    actions.updateQuest(quest.id, { done: checkbox.checked, completion: nextCompletion });
  });
  doneRow.prepend(checkbox);
  const doneText = document.createElement("span");
  doneText.textContent = "Mark as done";
  doneRow.appendChild(doneText);
  block.appendChild(doneRow);

  container.appendChild(block);
}

function renderResources(container, quest) {
  const block = document.createElement("div");
  block.className = "detail-block expanded-block";
  const label = document.createElement("div");
  label.className = "detail-label";
  label.textContent = "Resources";
  block.appendChild(label);

  const chips = document.createElement("div");
  chips.className = "chip-group";
  if (quest.link) {
    const link = document.createElement("a");
    link.href = quest.link;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.className = "chip-badge";
    link.textContent = "Link";
    chips.appendChild(link);
  }
  if (quest.filePath) {
    const file = document.createElement("span");
    file.className = "chip-badge";
    file.textContent = "Attachment";
    chips.appendChild(file);
  }
  if (!chips.childNodes.length) {
    const empty = document.createElement("span");
    empty.className = "muted small";
    empty.textContent = "No resources yet.";
    chips.appendChild(empty);
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "link-button";
  addBtn.textContent = "+ Add link/file";
  addBtn.addEventListener("click", (event) => event.stopPropagation());
  block.append(chips, addBtn);
  container.appendChild(block);
}

function renderNotesBlock(container, quest, actions) {
  const block = document.createElement("div");
  block.className = "detail-block expanded-block";
  const label = document.createElement("div");
  label.className = "detail-label";
  label.textContent = "Notes";
  const textarea = document.createElement("textarea");
  textarea.className = "textarea";
  textarea.placeholder = "Add notes about this quest...";
  textarea.value = quest.notes || "";
  textarea.addEventListener("click", (event) => event.stopPropagation());
  textarea.addEventListener("blur", () => actions.updateQuest(quest.id, { notes: textarea.value }));
  block.append(label, textarea);
  container.appendChild(block);
}

function renderExpandedBlocks(card, quest, currentState, actions) {
  renderProgressBlock(card, quest, actions);
  renderSubtasks(card, quest, currentState, actions);
  renderNotesBlock(card, quest, actions);
  renderResources(card, quest);
  const meta = document.createElement("div");
  meta.className = "muted small expanded-block";
  meta.textContent = "Created recently - Last updated moments ago.";
  card.appendChild(meta);
}

function buildNewQuestCard(currentState, actions, selectedDate) {
  const card = document.createElement("article");
  card.className = "day-card selected";
  const strip = document.createElement("div");
  strip.className = "course-strip";
  strip.style.background = courseColor("New");
  card.appendChild(strip);

  const form = document.createElement("form");
  form.className = "detail-block expanded-block";
  form.innerHTML = `
    <div class="detail-label">New Quest</div>
    <label class="detail-block">
      <span class="muted small">Course</span>
      <select class="select" name="course">${currentState.courses
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("")}</select>
    </label>
    <label class="detail-block">
      <span class="muted small">Quest title</span>
      <input class="select" name="title" placeholder="Quest title" />
    </label>
    <label class="detail-block">
      <span class="muted small">Quest type</span>
      <select class="select" name="type">
        ${currentState.categories.map((c) => `<option value="${c}">${c}</option>`).join("")}
      </select>
    </label>
    <label class="detail-block">
      <span class="muted small">Due time (optional)</span>
      <input class="select" type="time" name="dueTime" />
    </label>
    <label class="detail-block">
      <span class="muted small">Estimated duration (hours)</span>
      <input class="select" type="number" step="0.25" min="0" name="estHours" placeholder="e.g. 1.5" />
    </label>
    <label class="detail-block">
      <span class="muted small">Notes</span>
      <textarea class="textarea" name="notes" placeholder="Add notes about this quest..."></textarea>
    </label>
    <label class="detail-block">
      <span class="muted small">Resource link</span>
      <input class="select" type="url" name="link" placeholder="https://example.com" />
    </label>
    <div class="panel-actions" style="justify-content: flex-end;">
      <button type="button" class="link-button" data-role="cancel">Cancel</button>
      <button type="submit" class="soft-button">Save</button>
    </div>
  `;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const data = new FormData(form);
    const hours = Number(data.get("estHours"));
    const estMinutes = Number.isFinite(hours) ? Math.round(hours * 60) : null;
    const payload = {
      course: data.get("course") || "General",
      title: data.get("title") || "",
      category: data.get("type") || "General",
      dueDate: selectedDate,
      dueTime: data.get("dueTime") || "",
      estMinutes,
      notes: data.get("notes") || "",
      link: data.get("link") || "",
      completion: 0,
      done: false,
    };
    const saved = await actions.addQuest(payload);
    if (saved) {
      currentState.ui.detailMode = "view";
      actions.focusDay(saved.dueDate || selectedDate);
      actions.selectQuest(saved.id);
    }
  });

  form.querySelector('[data-role="cancel"]').addEventListener("click", (event) => {
    event.stopPropagation();
    actions.cancelNewQuest();
  });
  form.addEventListener("click", (event) => event.stopPropagation());
  card.appendChild(form);
  return card;
}
function renderDayPane(dom, currentState, actions) {
  const selectedDate = currentState.ui.selectedDate || todayISO();
  setText(dom.selectedDateLabel, formatDateLong(selectedDate));

  const questsForDay = currentState.quests.filter((q) => q.dueDate === selectedDate);
  const stats = computeDayStats(questsForDay);
  setText(dom.daySummary, `${stats.count} quests - ${stats.estimatedHours}h estimated - ${stats.overdue} overdue`);

  renderDayFilter(dom, currentState);
  renderDayList(dom, currentState, actions);
}
function renderCourseFilter(dom, currentState, actions) {
  if (!dom.courseFilterChips) return;
  dom.courseFilterChips.innerHTML = "";
  const frag = document.createDocumentFragment();
  const selectedCourses = currentState.ui.questFilters.courses || [];
  if (dom.sortSelect) {
    dom.sortSelect.value = currentState.ui.questFilters.sort || "date";
  }

  const allChip = document.createElement("button");
  allChip.type = "button";
  allChip.className = `chip ${!selectedCourses.length ? "active" : ""}`;
  allChip.textContent = "All courses";
  allChip.addEventListener("click", () => actions.setQuestFilters({ courses: [] }));
  frag.appendChild(allChip);

  currentState.courses.forEach((course) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `chip ${selectedCourses.includes(course) ? "active" : ""}`;
    chip.textContent = course;
    chip.addEventListener("click", () => {
      const exists = selectedCourses.includes(course);
      const next = exists ? selectedCourses.filter((c) => c !== course) : [...selectedCourses, course];
      actions.setQuestFilters({ courses: next });
    });
    frag.appendChild(chip);
  });
  dom.courseFilterChips.appendChild(frag);
}

function renderStatusFilter(dom, currentState, actions) {
  if (!dom.statusFilter) return;
  dom.statusFilter.innerHTML = "";
  STATUS_OPTIONS.forEach((label) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `chip ${currentState.ui.questFilters.status === label ? "active" : ""}`;
    chip.textContent = label;
    chip.addEventListener("click", () => actions.setQuestFilters({ status: label }));
    dom.statusFilter.appendChild(chip);
  });
}

function questMatchesFilters(quest, filters) {
  if (filters.courses?.length && !filters.courses.includes(quest.course)) return false;
  const diff = daysUntil(quest.dueDate);
  if (filters.status === "Today") return diff === 0;
  if (filters.status === "This week") return diff !== null && diff >= 0 && diff <= 6;
  if (filters.status === "Overdue") return diff !== null && diff < 0 && !quest.done;
  if (filters.status === "Completed") return quest.done;
  return true;
}

function sortQuests(quests, sort) {
  if (sort === "course") {
    return quests.slice().sort((a, b) => (a.course || "").localeCompare(b.course || ""));
  }
  if (sort === "workload") {
    return quests
      .slice()
      .sort((a, b) => (Number(b.estMinutes) || 0) - (Number(a.estMinutes) || 0));
  }
  return quests
    .slice()
    .sort((a, b) => new Date(a.dueDate || "9999-12-31") - new Date(b.dueDate || "9999-12-31"));
}
function renderQuestGroups(dom, currentState, actions) {
  if (!dom.questGroupList) return;
  dom.questGroupList.innerHTML = "";
  const filters = currentState.ui.questFilters;
  const filtered = currentState.quests.filter((q) => questMatchesFilters(q, filters));
  const sorted = sortQuests(filtered, filters.sort);

  if (!sorted.length) {
    dom.questGroupList.innerHTML = '<div class="empty">No quests match these filters.</div>';
    return;
  }

  const groups = sorted.reduce((acc, quest) => {
    const date = quest.dueDate ? new Date(quest.dueDate) : null;
    const label = date
      ? `${DAY_NAMES[date.getDay()].slice(0, 3)}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
      : "No date";
    acc[label] = acc[label] || [];
    acc[label].push(quest);
    return acc;
  }, {});

  Object.entries(groups).forEach(([label, quests]) => {
    const group = document.createElement("div");
    group.className = "quest-group";
    const header = document.createElement("div");
    header.className = "group-header";
    const stats = computeDayStats(quests);
    header.innerHTML = `<strong>${label}</strong><span class="muted small">${stats.count} quests - ${stats.estimatedHours}h estimated</span>`;
    group.appendChild(header);

    quests.forEach((quest) => {
      const card = document.createElement("article");
      card.className = "quest-card";
      const strip = document.createElement("div");
      strip.className = "course-strip";
      strip.style.background = courseColor(quest.course);
      card.appendChild(strip);

      const headerRow = document.createElement("div");
      headerRow.className = "card-header";
      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = `${quest.course || "Course"} - ${questTitle(quest)}`;
      headerRow.appendChild(title);
      const pct = document.createElement("span");
      pct.className = "muted small";
      pct.textContent = `${quest.completion || 0}%`;
      headerRow.appendChild(pct);
      card.appendChild(headerRow);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${questType(quest)} - ${dueTimeLabel(quest)}`;
      card.appendChild(meta);

      const bar = document.createElement("div");
      bar.className = "progress-bar";
      const fill = document.createElement("span");
      fill.style.width = `${quest.completion || 0}%`;
      bar.appendChild(fill);
      card.appendChild(bar);

      const icons = document.createElement("div");
      icons.className = "icon-row";
      if (quest.notes) icons.append("note");
      if (quest.link) icons.append("link");
      const diff = daysUntil(quest.dueDate);
      if (diff !== null && diff < 0 && !quest.done) icons.append("overdue");
      if (icons.childNodes.length) card.appendChild(icons);

      card.addEventListener("click", () => actions.openDrawer(quest.id));
      group.appendChild(card);
    });

    dom.questGroupList.appendChild(group);
  });
}
function renderDrawer(dom, currentState, actions) {
  if (!dom.questDrawer) return;
  if (currentState.ui.activeView !== "questsView") {
    dom.questDrawer.classList.add("hidden");
    return;
  }
  const quest = currentState.quests.find((q) => q.id === currentState.ui.drawerQuestId);
  if (!quest) {
    dom.questDrawer.classList.add("hidden");
    return;
  }
  const completion = Math.max(0, Math.min(100, Number(quest.completion) || 0));
  dom.drawerTitle.textContent = `${quest.course || "Course"} / ${questTitle(quest)}`;
  dom.drawerMeta.textContent = `${formatDue(quest.dueDate)} - ${questType(quest)} - ${quest.completion || 0}%`;
  dom.drawerBody.innerHTML = "";

  const info = document.createElement("div");
  info.className = "meta";
  info.textContent = `Due ${dueTimeLabel(quest)} - Est. ${hoursFromMinutes(quest.estMinutes) || "?"}h`;
  dom.drawerBody.appendChild(info);

  const progress = document.createElement("div");
  progress.className = "progress-line";
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  const fill = document.createElement("span");
  fill.style.width = `${completion}%`;
  bar.appendChild(fill);
  const pct = document.createElement("span");
  pct.className = "muted small";
  pct.textContent = `${completion}%`;
  progress.append(bar, pct);
  dom.drawerBody.appendChild(progress);

  const controls = document.createElement("div");
  controls.className = "drawer-controls";
  const sliderRow = document.createElement("div");
  sliderRow.className = "progress-slider";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.value = completion;
  const sliderValue = document.createElement("span");
  sliderValue.className = "progress-value";
  sliderValue.textContent = `${completion}%`;
  slider.addEventListener("input", () => {
    const value = Number(slider.value);
    sliderValue.textContent = `${value}%`;
    if (value < 100 && quest.done) {
      actions.updateQuest(quest.id, { completion: value, done: false });
    } else {
      actions.updateQuest(quest.id, { completion: value, done: value === 100 });
    }
  });
  sliderRow.append(slider, sliderValue);

  const doneRow = document.createElement("label");
  doneRow.className = "meta";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = quest.done;
  checkbox.addEventListener("change", () => {
    const nextCompletion = checkbox.checked ? 100 : completion;
    actions.updateQuest(quest.id, { done: checkbox.checked, completion: nextCompletion });
  });
  const doneText = document.createElement("span");
  doneText.textContent = "Mark as done";
  doneRow.prepend(checkbox);
  doneRow.appendChild(doneText);

  controls.append(sliderRow, doneRow);
  dom.drawerBody.appendChild(controls);

  if (quest.notes) {
    const notes = document.createElement("p");
    notes.className = "muted small";
    notes.textContent = quest.notes;
    dom.drawerBody.appendChild(notes);
  }

  dom.questDrawer.classList.remove("hidden");
  if (dom.closeDrawer) {
    dom.closeDrawer.onclick = () => actions.closeDrawer();
  }
}

function renderSettings(dom, currentState, actions) {
  if (dom.courseListEl) {
    dom.courseListEl.innerHTML = "";
    if (!currentState.courses.length) {
      dom.courseListEl.innerHTML = '<div class="empty">No courses yet.</div>';
    } else {
      currentState.courses.forEach((course, index) => {
        const row = document.createElement("div");
        row.className = "quest-card";
        const strip = document.createElement("div");
        strip.className = "course-strip";
        strip.style.background = courseColor(course);
        row.appendChild(strip);
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = course;
        row.appendChild(meta);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "link-button danger";
        btn.textContent = "Remove";
        btn.addEventListener("click", () => actions.removeCourse(index));
        row.appendChild(btn);
        dom.courseListEl.appendChild(row);
      });
    }
  }

  if (dom.categoryListEl) {
    dom.categoryListEl.innerHTML = "";
    currentState.categories.forEach((cat, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = cat;
      chip.title = "Click to remove";
      chip.addEventListener("click", () => actions.removeCategory(index));
      dom.categoryListEl.appendChild(chip);
    });
  }

  if (dom.prefHeatmap) dom.prefHeatmap.checked = currentState.preferences.showHeatmap;
  if (dom.prefRing) dom.prefRing.checked = currentState.preferences.showProgressRing;
  if (dom.prefCheck) dom.prefCheck.checked = currentState.preferences.showCompletionCheck;
  if (dom.prefDefaultView) dom.prefDefaultView.value = currentState.preferences.defaultCalendarView;
}

export function renderAll(dom, currentState, actions, setSummary, modal) {
  ensureDefaults(currentState);
  renderTabs(dom, currentState);
  renderStats(dom, currentState, setSummary);
  renderTodayRibbon(dom, currentState);
  renderCalendar(dom, currentState, actions, modal);
  renderDayPane(dom, currentState, actions);
  renderCourseFilter(dom, currentState, actions);
  renderStatusFilter(dom, currentState, actions);
  renderQuestGroups(dom, currentState, actions);
  renderDrawer(dom, currentState, actions);
  renderSettings(dom, currentState, actions);
}
