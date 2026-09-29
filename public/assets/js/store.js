// Local persistence. Everything lives in this browser only; nothing is sent anywhere except SunoAPI.

const NS = "hookline.";
const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(NS + k);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(NS + k, JSON.stringify(v));
  } catch {
    /* storage full or blocked: the app still works for this session */
  }
};

const listeners = new Map();
export const on = (evt, fn) => {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
};
export const emit = (evt, payload) => listeners.get(evt)?.forEach((fn) => fn(payload));

// ---- API key -------------------------------------------------------------
export function loadKey() {
  try {
    return sessionStorage.getItem(NS + "key") || localStorage.getItem(NS + "key") || "";
  } catch {
    return "";
  }
}
export function saveKey(key, remember) {
  try {
    sessionStorage.setItem(NS + "key", key);
    if (remember) localStorage.setItem(NS + "key", key);
    else localStorage.removeItem(NS + "key");
  } catch {}
}
export function forgetKey() {
  try {
    sessionStorage.removeItem(NS + "key");
    localStorage.removeItem(NS + "key");
  } catch {}
}

// ---- Theme ---------------------------------------------------------------
export function getTheme() {
  try {
    return localStorage.getItem(NS + "theme") || "system";
  } catch {
    return "system";
  }
}
export function setTheme(t) {
  try {
    if (t === "system") localStorage.removeItem(NS + "theme");
    else localStorage.setItem(NS + "theme", t);
  } catch {}
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  emit("theme", t);
}

// ---- Tracks --------------------------------------------------------------
// Track shape: { id (audioId), taskId, title, tags, lyrics, image, audio, stream, duration, model,
//   kind, createdAt, pending, fav, extras: { wav, video, stems, covers, parentTitle } }
let tracks = read("tracks", []);
export const getTracks = () => tracks;
export const getTrack = (id) => tracks.find((t) => t.id === id);
function saveTracks() {
  write("tracks", tracks);
  emit("tracks", tracks);
}
export function upsertTracks(list) {
  // Reverse so that new takes keep their original order (take 1 above take 2).
  for (const t of [...list].reverse()) {
    const i = tracks.findIndex((x) => x.id === t.id);
    if (i === -1) tracks.unshift(t);
    else tracks[i] = { ...tracks[i], ...t, extras: { ...tracks[i].extras, ...t.extras }, fav: tracks[i].fav };
  }
  saveTracks();
}
export function patchTrack(id, patch) {
  const t = getTrack(id);
  if (!t) return;
  Object.assign(t, patch, patch.extras ? { extras: { ...t.extras, ...patch.extras } } : {});
  saveTracks();
}
export function patchTracksByTask(taskId, patch) {
  tracks.filter((t) => t.taskId === taskId).forEach((t) => Object.assign(t, patch, patch.extras ? { extras: { ...t.extras, ...patch.extras } } : {}));
  saveTracks();
}
export function removeTrack(id) {
  tracks = tracks.filter((t) => t.id !== id);
  saveTracks();
}

// ---- Jobs (in-flight tasks) -----------------------------------------------
let jobs = read("jobs", []);
export const getJobs = () => jobs;
export function saveJobs() {
  write("jobs", jobs);
  emit("jobs", jobs);
}
export function addJob(job) {
  jobs.unshift(job);
  saveJobs();
}
export function removeJob(id) {
  jobs = jobs.filter((j) => j.id !== id);
  saveJobs();
}

// ---- Lyrics drafts & personas ----------------------------------------------
let lyricDrafts = read("lyrics", []);
export const getLyricDrafts = () => lyricDrafts;
export function addLyricDrafts(prompt, items) {
  lyricDrafts = [...items.map((x) => ({ ...x, prompt, createdAt: Date.now() })), ...lyricDrafts].slice(0, 40);
  write("lyrics", lyricDrafts);
  emit("lyrics", lyricDrafts);
}
export function clearLyricDrafts() {
  lyricDrafts = [];
  write("lyrics", lyricDrafts);
  emit("lyrics", lyricDrafts);
}

let personas = read("personas", []);
export const getPersonas = () => personas;
export function addPersona(p) {
  personas = [p, ...personas.filter((x) => x.personaId !== p.personaId)];
  write("personas", personas);
  emit("personas", personas);
}
export function removePersona(id) {
  personas = personas.filter((x) => x.personaId !== id);
  write("personas", personas);
  emit("personas", personas);
}

// ---- Small prefs -----------------------------------------------------------
export const getPref = (k, d) => read("pref." + k, d);
export const setPref = (k, v) => write("pref." + k, v);
