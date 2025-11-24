const layout = `
<main>
  <header class="appbar">
    <div class="top">
      <div>
        <h1>Quest Planner</h1>
        <p class="lead">Home = calendar, Quests = tasks, Settings = courses & categories.</p>
        <p class="status" id="storageStatus">Connecting to Firebase...</p>
      </div>
    </div>
    <div class="navrow">
      <div class="tabs" role="tablist">
        <button class="tab active" data-view="homeView" aria-controls="homeView">Home</button>
        <button class="tab" data-view="questsView" aria-controls="questsView">Quests</button>
        <button class="tab" data-view="settingsView" aria-controls="settingsView">Settings</button>
      </div>
      <div class="status" id="summaryStatus"></div>
    </div>
  </header>

  <section id="homeView" class="view active" aria-live="polite">
    <div class="calendar-shell">
      <div class="calendar-head">
        <div class="inline-list">
          <button type="button" class="ghost" id="prevMonth">&lt;</button>
          <strong id="calendarLabel"></strong>
          <button type="button" class="ghost" id="nextMonth">&gt;</button>
        </div>
        <div class="chiplist" id="calendarLegend"></div>
      </div>
      <div class="calendar-grid" id="calendarGrid"></div>
    </div>
  </section>

  <section id="questsView" class="view" aria-live="polite">
    <form id="questForm">
      <h2>Add quest</h2>
      <label>
        Course
        <select id="courseSelect" name="course" required></select>
      </label>
      <label>
        Quest category
        <select id="categorySelect" name="category" required></select>
      </label>
      <label>
        Due date
        <input type="date" id="dueDate" name="dueDate" />
      </label>
      <label>
        Estimated minutes
        <input type="number" id="estMinutes" name="estMinutes" min="1" step="1" />
      </label>
      <label>
        Link
        <input type="url" id="link" name="link" placeholder="https://example.com" />
      </label>
      <label>
        File path
        <input type="text" id="filePath" name="filePath" placeholder="C:\\path\\to\\file" />
      </label>
      <label style="grid-column: 1 / -1;">
        Notes
        <textarea id="notes" name="notes" placeholder="Description or next steps"></textarea>
      </label>
      <div class="actions">
        <button type="submit">Save quest</button>
      </div>
    </form>

    <section class="list" id="questList"></section>
  </section>

  <section id="settingsView" class="view" aria-live="polite">
    <div class="stack">
      <form id="courseForm">
        <h2>Courses</h2>
        <label style="grid-column: 1 / -1;">
          Add course
          <input type="text" id="courseInput" placeholder="Course name" />
        </label>
        <div class="actions">
          <button type="submit">Add course</button>
        </div>
        <div class="list" id="courseList"></div>
      </form>

      <form id="categoryForm">
        <h2>Quest categories</h2>
        <label style="grid-column: 1 / -1;">
          Add category
          <input type="text" id="categoryInput" placeholder="Category name" />
        </label>
        <div class="actions">
          <button type="submit">Add category</button>
        </div>
        <div class="list" id="categoryList"></div>
      </form>
    </div>
  </section>
</main>
<div id="modalHost"></div>
`;

function collectRefs(root) {
  const viewIds = ["homeView", "questsView", "settingsView"];
  const fields = ["dueDate", "estMinutes", "link", "filePath", "notes"].reduce((acc, id) => {
    acc[id] = root.querySelector(`#${id}`);
    return acc;
  }, {});

  return {
    main: root.querySelector("main"),
    form: root.querySelector("#questForm"),
    listEl: root.querySelector("#questList"),
    statusEl: root.querySelector("#storageStatus"),
    summaryStatusEl: root.querySelector("#summaryStatus"),
    courseSelect: root.querySelector("#courseSelect"),
    categorySelect: root.querySelector("#categorySelect"),
    courseForm: root.querySelector("#courseForm"),
    categoryForm: root.querySelector("#categoryForm"),
    courseInput: root.querySelector("#courseInput"),
    categoryInput: root.querySelector("#categoryInput"),
    courseListEl: root.querySelector("#courseList"),
    categoryListEl: root.querySelector("#categoryList"),
    tabs: Array.from(root.querySelectorAll(".tab")),
    views: viewIds.reduce((acc, id) => {
      acc[id] = root.querySelector(`#${id}`);
      return acc;
    }, {}),
    calendarGrid: root.querySelector("#calendarGrid"),
    calendarLabel: root.querySelector("#calendarLabel"),
    calendarLegend: root.querySelector("#calendarLegend"),
    prevMonthBtn: root.querySelector("#prevMonth"),
    nextMonthBtn: root.querySelector("#nextMonth"),
    modalHost: root.querySelector("#modalHost"),
    fields,
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
