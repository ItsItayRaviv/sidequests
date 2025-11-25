export function QuestList(state) {
  const items = (state.quests || [])
    .map((q) => {
      return `
        <li class="quest-card">
          <div class="quest-card__row">
            <div class="quest-card__text">
              <div class="quest-card__title">${q.title}</div>
              <div class="quest-card__course">${q.course}</div>
            </div>
            <div class="quest-card__meta">
              <div class="quest-card__date">${q.dueDate}</div>
              <div class="quest-card__status">${q.status}</div>
            </div>
          </div>
        </li>
      `;
    })
    .join("");

  return `
    <section class="quest-list">
      <h2 class="quest-list__title">Quests</h2>
      <ul class="quest-list__items">${items || ""}</ul>
    </section>
  `;
}
