export function bindEvents({ dom, actions, storage }) {
  if (dom.form) {
    dom.form.addEventListener("submit", (event) => {
      event.preventDefault();
      actions.addQuest({
        course: dom.courseSelect.value,
        category: dom.categorySelect.value,
        dueDate: dom.fields.dueDate.value,
        estMinutes: dom.fields.estMinutes.value.trim(),
        link: dom.fields.link.value.trim(),
        filePath: dom.fields.filePath.value.trim(),
        notes: dom.fields.notes.value.trim(),
        completion: 0,
        done: false,
      });
    });
  }

  if (dom.courseForm) {
    dom.courseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      actions.addCourse(dom.courseInput.value);
      dom.courseInput.value = "";
    });
  }

  if (dom.categoryForm) {
    dom.categoryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      actions.addCategory(dom.categoryInput.value);
      dom.categoryInput.value = "";
    });
  }

  if (dom.loadBtn) {
    dom.loadBtn.addEventListener("click", () => {
      storage.loadDataFromDisk().catch(() => {
        alert("Could not open that file. Please try again with a JSON file.");
      });
    });
  }

  if (dom.saveBtn) {
    dom.saveBtn.addEventListener("click", () => {
      storage.saveDataToFile().catch(() => {
        alert("Could not save to file. The browser may have blocked access.");
      });
    });
  }

  if (dom.filePicker) {
    dom.filePicker.addEventListener("change", (event) => storage.handleFilePicker(event));
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
