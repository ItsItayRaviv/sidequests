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

export function DayStrip() {
  const today = todayISO();
  const days = buildCurrentWeek(today);

  const buttons = days
    .map((day) => {
      const isToday = day.iso === today;

      return `
        <div class="day-strip__day ${isToday ? "is-today" : ""}">
          <span class="day-strip__day-label">${day.label}</span>
          <span class="day-strip__day-number">${day.dayNum}</span>
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
