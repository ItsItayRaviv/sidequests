import { formatDue } from "./state.js";

const NO_OP = () => {};

export function createModal(dom) {
  const host = dom.modalHost || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop hidden";

  const panel = document.createElement("div");
  panel.className = "modal-panel hidden";
  panel.innerHTML = `
    <div class="modal-header">
      <div>
        <div class="modal-kicker">Quests due</div>
        <div class="modal-title" id="modalDateLabel"></div>
      </div>
      <button type="button" class="ghost modal-close" aria-label="Close dialog">Close</button>
    </div>
    <div class="modal-body">
      <div class="modal-quest-list" id="modalQuestList"></div>
      <div class="modal-detail" id="modalDetail"></div>
    </div>
  `;

  host.append(backdrop, panel);

  const refs = {
    dateLabel: panel.querySelector("#modalDateLabel"),
    list: panel.querySelector("#modalQuestList"),
    detail: panel.querySelector("#modalDetail"),
    closeBtn: panel.querySelector(".modal-close"),
  };

  let current = {
    tasks: [],
    selectedIndex: 0,
    onUpdateQuest: NO_OP,
    onSelect: NO_OP,
    onClose: NO_OP,
    selectionChanged: false,
  };

  function close() {
    backdrop.classList.add("hidden");
    panel.classList.add("hidden");
    document.body.classList.remove("no-scroll");
    current.onClose({
      selectionChanged: current.selectionChanged,
      selected: current.tasks[current.selectedIndex],
      tasks: current.tasks,
    });
    current = { tasks: [], selectedIndex: 0, onUpdateQuest: NO_OP, onSelect: NO_OP, onClose: NO_OP, selectionChanged: false };
  }

  function setSelected(index) {
    current.selectedIndex = index;
    current.selectionChanged = true;
    current.onSelect(current.tasks[index]);
    renderDetail();
    renderList();
  }

  function renderList() {
    refs.list.innerHTML = "";
    current.tasks.forEach((task, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `modal-quest ${index === current.selectedIndex ? "active" : ""}`;
      btn.innerHTML = `
        <span class="modal-quest-title">${task.quest.course || "(No course)"}</span>
        <span class="modal-quest-meta">${task.quest.category || "Uncategorized"}</span>
      `;
      btn.addEventListener("click", () => setSelected(index));
      refs.list.appendChild(btn);
    });
  }

  function renderDetail() {
    const entry = current.tasks[current.selectedIndex];
    if (!entry) {
      refs.detail.innerHTML = "<p class=\"empty\">No quests for this day.</p>";
      return;
    }
    const { quest, index } = entry;
    const progress = Math.max(0, Math.min(100, Number(quest.completion) || 0));

    const dueLabel = formatDue(quest.dueDate);

    refs.detail.innerHTML = `
      <div class="modal-section">
        <div class="modal-label">${quest.course || "(No course)"} · ${quest.category || "Uncategorized"}</div>
        <div class="modal-row">
          <span>${dueLabel}</span>
          ${quest.estMinutes ? `<span>Est: ${quest.estMinutes} min</span>` : ""}
          ${quest.filePath ? `<span>File: ${quest.filePath}</span>` : ""}
        </div>
      </div>
      <div class="modal-section">
        <label class="modal-inline">
          <span>Completion</span>
          <input type="range" min="0" max="100" value="${progress}" />
          <span class="modal-progress-label">${progress}%</span>
        </label>
        <label class="modal-inline">
          <input type="checkbox" ${quest.done ? "checked" : ""} />
          <span>Done (ignore)</span>
        </label>
      </div>
      <div class="modal-section modal-notes">
        <div class="modal-label">Notes</div>
        <div class="modal-notes-body">${quest.notes ? quest.notes : "No notes"}</div>
      </div>
      ${
        quest.link
          ? `<div class="modal-section"><a class="link" href="${quest.link}" target="_blank" rel="noreferrer noopener">Open link</a></div>`
          : ""
      }
    `;

    const slider = refs.detail.querySelector('input[type="range"]');
    const sliderLabel = refs.detail.querySelector(".modal-progress-label");
    const checkbox = refs.detail.querySelector('input[type="checkbox"]');

    slider.addEventListener("input", () => {
      sliderLabel.textContent = `${slider.value}%`;
      current.onUpdateQuest(index, { completion: Number(slider.value) });
    });

    checkbox.addEventListener("change", () => {
      current.onUpdateQuest(index, { done: checkbox.checked });
    });
  }

  function openDayModal({
    dateLabel,
    tasks,
    selectedIndex = 0,
    onUpdateQuest = NO_OP,
    onSelect = NO_OP,
    onClose = NO_OP,
  }) {
    current = {
      tasks,
      selectedIndex: Math.max(0, Math.min(tasks.length - 1, selectedIndex)),
      onUpdateQuest,
      onSelect,
      onClose,
      selectionChanged: false,
    };
    refs.dateLabel.textContent = dateLabel;
    renderList();
    renderDetail();
    backdrop.classList.remove("hidden");
    panel.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }

  backdrop.addEventListener("click", close);
  refs.closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.classList.contains("hidden")) {
      close();
    }
  });

  return { openDayModal, close };
}
