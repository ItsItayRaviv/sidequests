import { daysUntil, ensureDefaults, formatDue, state } from "./state.js";

function renderCourseSelect(dom, state) {
  const inUse = state.quests.map((a) => a.course).filter(Boolean);
  const options = Array.from(new Set([...state.courses, ...inUse]));
  if (!options.length) options.push("General");
  dom.courseSelect.innerHTML = options.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function renderCategorySelect(dom, state) {
  const inUse = state.quests.map((a) => a.category).filter(Boolean);
  const options = Array.from(new Set([...state.categories, ...inUse]));
  if (!options.length) options.push("General");
  dom.categorySelect.innerHTML = options.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function renderCourseList(dom, state, actions) {
  if (!dom.courseListEl) return;
  dom.courseListEl.innerHTML = "";
  if (!state.courses.length) {
    dom.courseListEl.innerHTML = '<div class="empty">No courses yet.</div>';
    return;
  }
  state.courses.forEach((course, index) => {
    const row = document.createElement("div");
    row.className = "card";
    row.innerHTML = `
      <div class="meta" style="justify-content: space-between; width: 100%; align-items: center;">
        <span>${course}</span>
        <button type="button" class="danger" data-index="${index}">Delete</button>
      </div>
    `;
    row.querySelector("button").addEventListener("click", () => actions.removeCourse(index));
    dom.courseListEl.appendChild(row);
  });
}

function renderCategoryList(dom, state, actions) {
  if (!dom.categoryListEl) return;
  dom.categoryListEl.innerHTML = "";
  if (!state.categories.length) {
    dom.categoryListEl.innerHTML = '<div class="empty">No categories yet.</div>';
    return;
  }
  state.categories.forEach((cat, index) => {
    const row = document.createElement("div");
    row.className = "card";
    row.innerHTML = `
      <div class="meta" style="justify-content: space-between; width: 100%; align-items: center;">
        <span>${cat}</span>
        <button type="button" class="danger" data-index="${index}">Delete</button>
      </div>
    `;
    row.querySelector("button").addEventListener("click", () => actions.removeCategory(index));
    dom.categoryListEl.appendChild(row);
  });
}

function buildQuestCard(quest, index, actions) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.index = String(index);

  const headerEl = document.createElement("header");
  const title = document.createElement("p");
  title.className = "course";
  title.textContent = quest.course || "Untitled course";
  headerEl.appendChild(title);

  const due = document.createElement("span");
  due.className = "meta";
  due.textContent = formatDue(quest.dueDate);
  headerEl.appendChild(due);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <span class="pill">${quest.category || "Uncategorized"}</span>
    <span>Est: ${quest.estMinutes || "?"} min</span>
    <span>Completion: ${quest.completion || 0}%</span>
    ${quest.filePath ? `<span>File: ${quest.filePath}</span>` : ""}
    ${
      quest.link
        ? `<a class="link" href="${quest.link}" target="_blank" rel="noreferrer noopener">Link</a>`
        : ""
    }
  `;

  const notes = document.createElement("p");
  notes.className = "notes";
  notes.textContent = quest.notes || "";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => actions.removeQuest(index));

  card.append(headerEl, meta);
  if (quest.notes) card.appendChild(notes);
  card.appendChild(deleteBtn);
  return card;
}

function renderList(dom, state, actions) {
  const sorted = state.quests
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((a, b) => new Date(a.item.dueDate || 0) - new Date(b.item.dueDate || 0));

  dom.listEl.innerHTML = "";

  if (!sorted.length) {
    dom.listEl.innerHTML = '<div class="empty">No quests yet. Add one above.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  sorted.forEach(({ item, originalIndex }) => {
    fragment.appendChild(buildQuestCard(item, originalIndex, actions));
  });
  dom.listEl.appendChild(fragment);
}

function renderLegend(dom, state) {
  const courseSet = Array.from(new Set(state.quests.map((a) => a.course).filter(Boolean)));
  dom.calendarLegend.innerHTML = "";
  courseSet.slice(0, 6).forEach((course) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = course;
    dom.calendarLegend.appendChild(pill);
  });
  if (!courseSet.length) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = "No courses yet";
    dom.calendarLegend.appendChild(pill);
  }
}

function buildCalendarTask(quest) {
  const task = document.createElement("div");
  task.className = "cal-task";
  if (quest.done) task.classList.add("done");
  const progress = Math.max(0, Math.min(100, Number(quest.completion) || 0));
  task.style.setProperty("--p", `${progress}%`);

  task.innerHTML = `
    <div class="label">${quest.course || "(No course)"}</div>
    <div class="tiny">${quest.category || "Uncategorized"}${quest.estMinutes ? ` | ${quest.estMinutes} min` : ""}</div>
  `;

  return task;
}

function renderCalendar(dom, state, actions, modal) {
  const { year, month } = state.calendar;
  const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long" });
  dom.calendarLabel.textContent = `${monthName} ${year}`;

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasksByDate = state.quests.reduce((acc, item, index) => {
    if (!item.dueDate) return acc;
    acc[item.dueDate] = acc[item.dueDate] || [];
    acc[item.dueDate].push({ quest: item, index });
    return acc;
  }, {});

  dom.calendarGrid.innerHTML = "";
  for (let i = 0; i < startDay; i++) {
    const pad = document.createElement("div");
    dom.calendarGrid.appendChild(pad);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const iso = date.toISOString().split("T")[0];
    const cell = document.createElement("div");
    cell.className = "cal-cell";
    if (date.getTime() === today.getTime()) cell.classList.add("today");

    const dayLabel = document.createElement("div");
    dayLabel.className = "day";
    dayLabel.textContent = day;
    cell.appendChild(dayLabel);

    const dayTasks = (tasksByDate[iso] || []).slice().sort((a, b) => {
      if (a.quest.done === b.quest.done) return Number(a.quest.completion) - Number(b.quest.completion);
      return a.quest.done ? 1 : -1;
    });

    const visibleTasks = (() => {
      const open = dayTasks.filter((t) => !t.quest.done);
      return open.length ? open : dayTasks;
    })();

    const choosePrimary = (tasks, savedIndex) => {
      if (!tasks.length) return null;
      if (Number.isInteger(savedIndex)) {
        const found = tasks.find((t) => t.index === savedIndex);
        if (found) return found;
      }
      return tasks.slice().sort((a, b) => Number(b.quest.completion || 0) - Number(a.quest.completion || 0))[0];
    };

    if (visibleTasks.length) {
      cell.classList.add("has-quests");
      const savedIndex = state.calendarSelection?.[iso];
      const primary = choosePrimary(visibleTasks, savedIndex);
      const built = buildCalendarTask(primary.quest);
      cell.appendChild(built);
      const extra = visibleTasks.length - 1;
      if (extra > 0) {
        const more = document.createElement("div");
        more.className = "cal-more";
        more.textContent = `+${extra} more quest${extra === 1 ? "" : "s"}`;
        cell.appendChild(more);
      }
      cell.addEventListener("click", () => {
        if (!modal || !modal.openDayModal) return;
        const selectedIndex = visibleTasks.findIndex((t) => t.index === primary.index);
        modal.openDayModal({
          dateLabel: `${monthName} ${day}, ${year}`,
          tasks: visibleTasks,
          selectedIndex: selectedIndex >= 0 ? selectedIndex : 0,
          onUpdateQuest: actions.updateQuest,
          onSelect: (entry) => {
            state.calendarSelection[iso] = entry.index;
          },
          onClose: ({ selectionChanged }) => {
            if (!selectionChanged) {
              const fallback = choosePrimary(visibleTasks, null);
              if (fallback) state.calendarSelection[iso] = fallback.index;
            }
            actions.refresh();
          },
        });
      });
    }

    dom.calendarGrid.appendChild(cell);
  }

  renderLegend(dom, state);
}

function updateSummary(dom, state, setSummary) {
  const total = state.quests.length;
  const dueToday = state.quests.filter((a) => daysUntil(a.dueDate) === 0 && !a.done).length;
  const overdue = state.quests.filter((a) => {
    const diff = daysUntil(a.dueDate);
    return diff !== null && diff < 0 && !a.done;
  }).length;
  const summary = `${total} quests | ${dueToday} today | ${overdue} overdue`;
  if (typeof setSummary === "function") {
    setSummary(summary);
  } else if (dom.summaryStatusEl) {
    dom.summaryStatusEl.textContent = summary;
  }
}

export function renderAll(dom, state, actions, setSummary, modal) {
  ensureDefaults(state);
  renderCourseSelect(dom, state);
  renderCategorySelect(dom, state);
  renderCourseList(dom, state, actions);
  renderCategoryList(dom, state, actions);
  renderList(dom, state, actions);
  renderCalendar(dom, state, actions, modal);
  updateSummary(dom, state, setSummary);
}
