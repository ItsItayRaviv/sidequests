export function bindEvents({ dom, actions }) {
  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.view;
      actions.switchView(target);
    });
  });

  if (dom.prevMonthBtn) {
    dom.prevMonthBtn.addEventListener("click", () => actions.setCalendarMonth(-1));
  }

  if (dom.nextMonthBtn) {
    dom.nextMonthBtn.addEventListener("click", () => actions.setCalendarMonth(1));
  }

  if (dom.calendarViewToggle) {
    dom.calendarViewToggle.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-mode]");
      if (!btn) return;
      actions.setCalendarView(btn.dataset.mode);
    });
  }

  if (dom.calendarCourseFilter) {
    dom.calendarCourseFilter.addEventListener("change", (event) =>
      actions.setCalendarCourseFilter(event.target.value)
    );
  }

  if (dom.dayFilter) {
    dom.dayFilter.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-filter]");
      if (!btn) return;
      actions.setDayFilter(btn.dataset.filter);
    });
  }

  if (dom.addDayQuest) {
    dom.addDayQuest.addEventListener("click", () => actions.startNewQuestForDate());
  }

  if (dom.jumpToToday) {
    dom.jumpToToday.addEventListener("click", () => actions.jumpToToday());
  }

  if (dom.sortSelect) {
    dom.sortSelect.addEventListener("change", (event) =>
      actions.setQuestFilters({ sort: event.target.value })
    );
  }

  if (dom.courseForm) {
    dom.courseForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await actions.addCourse(dom.courseInput.value);
        dom.courseInput.value = "";
      } catch (error) {
        console.error("Could not add course", error);
      }
    });
  }

  if (dom.categoryForm) {
    dom.categoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await actions.addCategory(dom.categoryInput.value);
        dom.categoryInput.value = "";
      } catch (error) {
        console.error("Could not add category", error);
      }
    });
  }

  if (dom.prefHeatmap) {
    dom.prefHeatmap.addEventListener("change", (event) => actions.updatePreference("showHeatmap", event.target.checked));
  }
  if (dom.prefRing) {
    dom.prefRing.addEventListener("change", (event) => actions.updatePreference("showProgressRing", event.target.checked));
  }
  if (dom.prefCheck) {
    dom.prefCheck.addEventListener("change", (event) => actions.updatePreference("showCompletionCheck", event.target.checked));
  }
  if (dom.prefDefaultView) {
    dom.prefDefaultView.addEventListener("change", (event) =>
      actions.updatePreference("defaultCalendarView", event.target.value)
    );
  }
}
