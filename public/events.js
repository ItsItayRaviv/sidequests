export function bindEvents({ dom, actions }) {
  if (dom.form) {
    dom.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const estMinutesValue = dom.fields.estMinutes.value.trim();
      try {
        await actions.addQuest({
          course: dom.courseSelect.value,
          category: dom.categorySelect.value,
          dueDate: dom.fields.dueDate.value,
          estMinutes: estMinutesValue ? Number(estMinutesValue) : null,
          link: dom.fields.link.value.trim(),
          filePath: dom.fields.filePath.value.trim(),
          notes: dom.fields.notes.value.trim(),
          completion: 0,
          done: false,
        });
      } catch (error) {
        console.error("Could not save quest", error);
        alert("Could not save quest to Firebase. Please try again.");
      }
    });
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

  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.view;
      dom.tabs.forEach((t) => t.classList.toggle("active", t === tab));
      Object.entries(dom.views).forEach(([id, node]) => {
        node.classList.toggle("active", id === target);
      });
    });
  });

  if (dom.prevMonthBtn) {
    dom.prevMonthBtn.addEventListener("click", () => actions.setCalendarMonth(-1));
  }

  if (dom.nextMonthBtn) {
    dom.nextMonthBtn.addEventListener("click", () => actions.setCalendarMonth(1));
  }
}
