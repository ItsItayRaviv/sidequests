const layout = `
<main class="app-container">
  <header class="topbar">
    <div class="topbar-left">
      <h1 class="app-title">Quest Planner</h1>
      <p class="subtext">Home = calendar, Quests = list, Settings = courses & categories.</p>
      <p class="muted status" id="storageStatus">Connecting to Firebase...</p>
    </div>
    <div class="topbar-right">
      <div id="summaryStatus" class="muted small">Live overview</div>
      <div id="globalStats" class="statline">0 quests | 0 today | 0 overdue</div>
    </div>
  </header>

  <nav class="primary-tabs" role="tablist">
    <button class="tab-button active" data-view="homeView" aria-controls="homeView">
      <span class="icon">📅</span>
      <span>Home</span>
      <span class="tab-underline"></span>
    </button>
    <button class="tab-button" data-view="questsView" aria-controls="questsView">
      <span class="icon">📋</span>
      <span>Quests</span>
      <span class="tab-underline"></span>
    </button>
    <button class="tab-button" data-view="settingsView" aria-controls="settingsView">
      <span class="icon">⚙️</span>
      <span>Settings</span>
      <span class="tab-underline"></span>
    </button>
  </nav>

  <div id="todayRibbon" class="today-ribbon">
    <div id="todayRibbonText">Today: 0 quests · 0 hours estimated · 0 overdue</div>
    <button id="jumpToToday" class="soft-button">Jump to today</button>
  </div>

  <section id="homeView" class="view active" aria-live="polite">
    <div class="panel home-grid">
      <div class="panel calendar-panel">
        <div class="panel-head">
          <div class="month-controls">
            <button type="button" class="circle-btn ghost" id="prevMonth" aria-label="Previous month">‹</button>
            <div class="month-label" id="calendarLabel">Month 2025</div>
            <button type="button" class="circle-btn ghost" id="nextMonth" aria-label="Next month">›</button>
          </div>
          <div class="panel-actions">
            <div class="toggle-group" id="calendarViewToggle">
              <button type="button" class="toggle active" data-mode="month">Month</button>
              <button type="button" class="toggle" data-mode="week">Week</button>
            </div>
            <select id="calendarCourseFilter" class="select">
              <option value="all">Show: All courses</option>
            </select>
          </div>
        </div>
        <div class="weekday-row" id="weekdayRow">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div class="calendar-grid" id="calendarGrid"></div>
      </div>

      <div class="panel day-pane">
        <div class="day-pane-head">
          <div>
            <div id="selectedDateLabel" class="day-title">Monday, November 24, 2025</div>
            <p id="daySummary" class="muted small">0 quests · 0h estimated · 0 overdue</p>
          </div>
          <div class="chip-group" id="dayFilter">
            <button class="chip active" data-filter="all">All</button>
            <button class="chip" data-filter="assignments">Assignments</button>
            <button class="chip" data-filter="tests">Tests</button>
            <button class="chip" data-filter="projects">Projects</button>
            <button class="chip" data-filter="other">Other</button>
          </div>
        </div>
        <div class="day-pane-body">
          <div class="day-list" id="dayQuestList"></div>
        </div>
        <div class="day-pane-footer">
          <button id="addDayQuest" class="link-button">+ Add quest for this day</button>
        </div>
      </div>
    </div>
  </section>

  <section id="questsView" class="view" aria-live="polite">
    <div class="panel">
      <div class="panel-head">
        <div>
          <h2>All Quests</h2>
          <p class="muted small">Filter and browse everything in one cozy place.</p>
        </div>
        <div class="filter-bar">
          <div class="chip-group" id="courseFilterChips"></div>
          <div class="chip-group" id="statusFilter"></div>
          <select id="sortSelect" class="select">
            <option value="date">Sort: By date</option>
            <option value="course">Sort: By course</option>
            <option value="workload">Sort: By workload</option>
          </select>
        </div>
      </div>
      <div id="questGroupList" class="quest-groups"></div>
    </div>
    <aside id="questDrawer" class="quest-drawer hidden" aria-label="Quest details">
      <div class="drawer-header">
        <div>
          <p class="kicker">Quest detail</p>
          <h3 id="drawerTitle"></h3>
          <p id="drawerMeta" class="muted small"></p>
        </div>
        <button id="closeDrawer" class="circle-btn ghost" aria-label="Close details">×</button>
      </div>
      <div id="drawerBody" class="drawer-body"></div>
    </aside>
  </section>

  <section id="settingsView" class="view" aria-live="polite">
    <div class="panel settings">
      <h2>Settings</h2>
      <div class="settings-grid">
        <section class="settings-card">
          <div class="settings-head">
            <h3>Courses</h3>
            <p class="muted small">Choose colors and defaults.</p>
          </div>
          <div class="list" id="courseList"></div>
          <form id="courseForm" class="inline-form">
            <input type="text" id="courseInput" placeholder="Add course" />
            <button type="submit">Add course</button>
          </form>
        </section>
        <section class="settings-card">
          <div class="settings-head">
            <h3>Quest types</h3>
            <p class="muted small">Rename or add your own labels.</p>
          </div>
          <div class="chip-group editable" id="categoryList"></div>
          <form id="categoryForm" class="inline-form">
            <input type="text" id="categoryInput" placeholder="Add type" />
            <button type="submit">Add type</button>
          </form>
        </section>
        <section class="settings-card">
          <div class="settings-head">
            <h3>Display preferences</h3>
            <p class="muted small">Lightweight toggles for the calendar.</p>
          </div>
          <div class="toggle-list">
            <label class="toggle">
              <input type="checkbox" id="prefHeatmap" checked />
              <span>Show workload heatmap in calendar cells</span>
            </label>
            <label class="toggle">
              <input type="checkbox" id="prefRing" checked />
              <span>Show small progress ring in calendar cells</span>
            </label>
            <label class="toggle">
              <input type="checkbox" id="prefCheck" checked />
              <span>Show “all quests completed” checkmark on days</span>
            </label>
            <label class="toggle">
              <span class="select-label">Default calendar view</span>
              <select id="prefDefaultView" class="select">
                <option value="month">Month</option>
                <option value="week">Week</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  </section>
</main>
<div id="modalHost"></div>
`;

function collectRefs(root) {
  const viewIds = ["homeView", "questsView", "settingsView"];

  return {
    main: root.querySelector("main"),
    statusEl: root.querySelector("#storageStatus"),
    summaryStatusEl: root.querySelector("#summaryStatus"),
    globalStatsEl: root.querySelector("#globalStats"),
    tabs: Array.from(root.querySelectorAll(".tab-button")),
    views: viewIds.reduce((acc, id) => {
      acc[id] = root.querySelector(`#${id}`);
      return acc;
    }, {}),
    todayRibbon: root.querySelector("#todayRibbon"),
    todayRibbonText: root.querySelector("#todayRibbonText"),
    jumpToToday: root.querySelector("#jumpToToday"),
    calendarGrid: root.querySelector("#calendarGrid"),
    calendarLabel: root.querySelector("#calendarLabel"),
    prevMonthBtn: root.querySelector("#prevMonth"),
    nextMonthBtn: root.querySelector("#nextMonth"),
    calendarViewToggle: root.querySelector("#calendarViewToggle"),
    calendarCourseFilter: root.querySelector("#calendarCourseFilter"),
    weekdayRow: root.querySelector("#weekdayRow"),
    selectedDateLabel: root.querySelector("#selectedDateLabel"),
    daySummary: root.querySelector("#daySummary"),
    dayFilter: root.querySelector("#dayFilter"),
    dayQuestList: root.querySelector("#dayQuestList"),
    addDayQuest: root.querySelector("#addDayQuest"),
    questGroupList: root.querySelector("#questGroupList"),
    courseFilterChips: root.querySelector("#courseFilterChips"),
    statusFilter: root.querySelector("#statusFilter"),
    sortSelect: root.querySelector("#sortSelect"),
    questDrawer: root.querySelector("#questDrawer"),
    drawerTitle: root.querySelector("#drawerTitle"),
    drawerMeta: root.querySelector("#drawerMeta"),
    drawerBody: root.querySelector("#drawerBody"),
    closeDrawer: root.querySelector("#closeDrawer"),
    courseForm: root.querySelector("#courseForm"),
    categoryForm: root.querySelector("#categoryForm"),
    courseInput: root.querySelector("#courseInput"),
    categoryInput: root.querySelector("#categoryInput"),
    courseListEl: root.querySelector("#courseList"),
    categoryListEl: root.querySelector("#categoryList"),
    prefHeatmap: root.querySelector("#prefHeatmap"),
    prefRing: root.querySelector("#prefRing"),
    prefCheck: root.querySelector("#prefCheck"),
    prefDefaultView: root.querySelector("#prefDefaultView"),
    modalHost: root.querySelector("#modalHost"),
  };
}

export function mountLayout(root = document.body) {
  const target = root || document.body;
  const template = document.createElement("template");
  template.innerHTML = layout.trim();
  target.innerHTML = "";
  target.appendChild(template.content.cloneNode(true));
  return collectRefs(target);
}
