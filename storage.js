import { STORAGE_KEYS, ensureDefaults, normalizeData, state, withDefaults } from "./state.js";

function safeParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function readLocalData() {
  const savedQuests = safeParse(localStorage.getItem(STORAGE_KEYS.quests));
  const savedAssignments = safeParse(localStorage.getItem(STORAGE_KEYS.legacyAssignments));
  const savedCourses = safeParse(localStorage.getItem(STORAGE_KEYS.courses)) || [];
  const savedCategories = safeParse(localStorage.getItem(STORAGE_KEYS.categories)) || [];
  return {
    quests: savedQuests ?? savedAssignments ?? [],
    courses: savedCourses,
    categories: savedCategories,
  };
}

export function writeLocalData() {
  localStorage.setItem(STORAGE_KEYS.quests, JSON.stringify(state.quests));
  localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(state.courses));
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(state.categories));
}

export async function fetchBundledData() {
  try {
    const response = await fetch("assignments.json", { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function downloadJson(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "assignments.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function createStorage(options = {}) {
  const { setStatus, filePicker } = options;
  let onDataChanged = null;

  function setOnDataChanged(callback) {
    onDataChanged = callback;
  }

  const notifyDataChanged = () => {
    if (typeof onDataChanged === "function") onDataChanged();
  };

  async function ensureSaveHandle() {
    if (!window.showSaveFilePicker) return null;
    if (state.fileHandle) return state.fileHandle;
    state.fileHandle = await window.showSaveFilePicker({
      suggestedName: "assignments.json",
      types: [
        {
          description: "JSON",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    return state.fileHandle;
  }

  async function saveDataToFile() {
    const payload = { quests: state.quests, courses: state.courses, categories: state.categories };
    if (!window.showSaveFilePicker) {
      downloadJson(payload);
      if (setStatus) setStatus("Saved copy as assignments.json (downloaded).");
      return;
    }
    const handle = await ensureSaveHandle();
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    if (setStatus) setStatus(`Saved to ${handle.name}`);
  }

  async function persistAll({ alsoSaveFile = true } = {}) {
    writeLocalData();
    if (alsoSaveFile && state.fileHandle) {
      try {
        await saveDataToFile();
      } catch {
        if (setStatus) setStatus("Saved in browser; file write failed.");
        state.fileHandle = null;
      }
    } else if (setStatus) {
      setStatus("Saved locally in your browser.");
    }
    notifyDataChanged();
  }

  function applyImportedData(raw, sourceLabel) {
    const normalized = normalizeData(raw);
    state.quests = normalized.quests.map(withDefaults);
    state.courses = normalized.courses;
    state.categories = normalized.categories;
    ensureDefaults(state);
    writeLocalData();
    if (setStatus && sourceLabel) setStatus(sourceLabel);
    notifyDataChanged();
  }

  async function loadDataFromDisk() {
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON",
            accept: { "application/json": [".json"] },
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
      });
      state.fileHandle = handle;
      const file = await handle.getFile();
      const text = await file.text();
      applyImportedData(JSON.parse(text), `Loaded ${file.name}`);
      return;
    }
    if (filePicker) filePicker.click();
  }

  function handleFilePicker(event) {
    const [file] = event.target.files;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyImportedData(JSON.parse(reader.result), `Loaded ${file.name}`);
      } catch {
        alert("Could not read JSON. Please choose a valid file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return {
    applyImportedData,
    handleFilePicker,
    loadDataFromDisk,
    persistAll,
    readLocalData,
    saveDataToFile,
    setOnDataChanged,
    fetchBundledData,
    writeLocalData,
  };
}
