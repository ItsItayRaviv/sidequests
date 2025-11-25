import { todayISO } from "../state.js";

function buildCurrentWeek(anchorISO) {
  const anchor = new Date(anchorISO);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      dayNum: d.getDate(),
    });
  }
  return days;
}

export function DayStrip(state) {
  const today = todayISO();
  const days = buildCurrentWeek(today);

  const buttons = days
    .map((day) => {
      const isToday = day.iso === today;

      const questCount = (state.quests || []).filter((q => q.dueDate === day.iso)).length;
      const questsLabel = questCount === 0 ? "no quests" 
        : questCount === 1 ? "quest" 
        : "quests";

      day.questsLabel = questsLabel;
      day.questsNumber = questCount === 0 ? "" : questCount;

      return `
        <div class="day-strip__day ${isToday ? "is-today" : ""}">
          <span class="day-strip__day-label">${day.label}</span>
          <span class="day-strip__day-number">${day.dayNum}</span>
          <span class="day-strip__quests-number">${day.questsNumber}</span>
          <span class="day-strip__quests-label">${day.questsLabel}</span>
        </div>
      `;
    })
    .join("");

  return `
    <section class="day-strip">
      <h2 class="day-strip__title">This Week</h2>
      <div class="day-strip__days">
        ${buttons}
      </div>
    </section>
  `;
}
