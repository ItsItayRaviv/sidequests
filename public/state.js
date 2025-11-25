export const state = {
  quests: [
    { id: "quest-1",
      title: "Read chapter 3 and summarize key points",
      course: "Biology 201",
      dueDate: todayISO(),
      status: "pending",
    },
    { id: "quest-2",
      title: "Complete problem set 5",
      course: "Calculus II",
      dueDate: todayISO(),
      status: "pending",
    },
    { id: "quest-3",
      title: "Draft outline for research essay",
      course: "History 140",
      dueDate: todayISO(),
      status: "pending",
    },
  ],
  selectedDate: null, // TODO v0.1: default to today
  totalXP: 50,
  totalCoins: 200,
};

export function initState() {
  // TODO v0.1: load from localStorage
  // TODO v0.1: if no data, keep quests = []
  // TODO v0.1: set selectedDate = today
  state.selectedDate = todayISO();
}

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// TODO v0.1: add saveState(), recalcStats(), etc.
