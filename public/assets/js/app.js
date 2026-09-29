import { api, setApiKey, callbackUrl } from "./api.js";
import * as S from "./store.js";
import { startJob, retryJob, resumeJobs } from "./jobs.js";
import { $, $$, esc, html, fmtTime, ago, toast, openModal, closeModal, initModal, confetti, download, copy, slug, buildForm, advancedFields } from "./ui.js";
import { MODELS, modelById, CHIPS, LYRIC_TAGS, surprisePrompt, COOKING_LINES, MUSIC_STAGES, SOUND_KEYS, STEM_NAMES, SOUND_IDEAS } from "./data.js";

const audio = $("#audio");
const state = {
  view: "create",
  mode: S.getPref("mode", "simple"),
  model: S.getPref("model", "V6"),
  attachments: { audio: [], image: [], video: [] },
  current: null, // id of the track in the player
  libFilter: "all",
  libQuery: "",
  remixMode: "cover",
};

const KIND_LABEL = { music: "Song", lyrics: "Lyrics", wav: "WAV", stems: "Stems", video: "Video", cover: "Cover art" };
const OP_LABEL = { generate: "Song", extend: "Extension", replace: "Edit", sound: "Sound", cover: "Restyle", "upload-extend": "Continuation", "add-instrumental": "Band added", "add-vocals": "Vocals added", mashup: "Mashup" };
const modelOptions = () => MODELS.map((m) => [m.id, m.legacy ? `${m.name} (legacy)` : `${m.name}: ${m.badge}`]);

// ============================================================================
// Theme
// ============================================================================
function renderThemeSwitches() {
  const t = S.getTheme();
  for (const host of $$(".theme-switch")) {
    host.classList.add("segmented");
    host.innerHTML = [["light", "i-sun", "Light"], ["dark", "i-moon", "Dark"], ["system", "i-system", "System"]]
      .map(([v, icon, label]) => `<button type="button" role="radio" data-theme-v="${v}" aria-checked="${t === v}" title="${label} theme" aria-label="${label} theme"><svg><use href="#${icon}"/></svg></button>`)
      .join("");
  }
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-theme-v]");
  if (!b) return;
  S.setTheme(b.dataset.themeV);
  renderThemeSwitches();
});

// ============================================================================
// Key gate
// ============================================================================
function showGate(message) {
  $("#app").hidden = true;
  $("#gate").hidden = false;
  audio.pause();
  const err = $("#gate-error");
  err.hidden = !message;
  err.textContent = message || "";
  setTimeout(() => $("#gate-key").focus(), 50);
}

function showApp() {
  $("#gate").hidden = true;
  $("#app").hidden = false;
  routeFromHash();
}

$("#gate-reveal").addEventListener("click", (e) => {
  const i = $("#gate-key");
  i.type = i.type === "password" ? "text" : "password";
  e.currentTarget.textContent = i.type === "password" ? "Show" : "Hide";
});

$("#gate-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = $("#gate-key").value.trim();
  const btn = $("#gate-submit");
  if (!key) return;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Checking your key…`;
  try {
    const credits = await api.credits(key);
    S.saveKey(key, $("#gate-remember").checked);
    setApiKey(key);
    setCredits(credits);
    $("#gate-key").value = "";
    showApp();
    resumeJobs();
    toast(`You're in! ${fmtCredits(credits)} credits ready to spend.`, { type: "ok" });
  } catch (err) {
    showGate(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Unlock the studio";
  }
});

// ============================================================================
// Navigation
// ============================================================================
const VIEWS = ["create", "lyrics", "remix", "sounds", "library"];
function showView(name) {
  if (!VIEWS.includes(name)) name = "create";
  state.view = name;
  $$(".view").forEach((v) => (v.hidden = v.dataset.view !== name));
  $$("[data-view]").forEach((b) => b.matches("button") && b.setAttribute("aria-selected", String(b.dataset.view === name)));
  if (location.hash.slice(1) !== name) history.replaceState(null, "", `#${name}`);
  window.scrollTo({ top: 0, behavior: "instant" });
}
function routeFromHash() {
  showView(location.hash.slice(1) || "create");
}
window.addEventListener("hashchange", routeFromHash);
document.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-view], [data-goto]");
  if (!b) return;
  showView(b.dataset.view || b.dataset.goto);
});

// ============================================================================
// Credits
// ============================================================================
const fmtCredits = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "–");
function setCredits(n) {
  $("#credits-n").textContent = fmtCredits(n);
}
async function refreshCredits(announce = false) {
  try {
    const n = await api.credits();
    setCredits(n);
    if (announce) toast(`${fmtCredits(n)} credits left.`, { timeout: 2500 });
  } catch (e) {
    if (e.code === 401) showGate("Your saved key no longer works. Paste a fresh one.");
  }
}
$("#credits").addEventListener("click", () => refreshCredits(true));

// ============================================================================
// Create: models, modes, chips, lyrics tags
// ============================================================================
function renderModels() {
  const showLegacy = $("#show-legacy").checked || modelById(state.model).legacy;
  $("#models").innerHTML = MODELS.filter((m) => showLegacy || !m.legacy)
    .map((m) => `<button type="button" role="radio" class="model ${m.legacy ? "legacy" : ""}" data-model="${m.id}" aria-checked="${m.id === state.model}">
      <b>${esc(m.name)} <span class="badge">${esc(m.badge)}</span></b><small>${esc(m.desc)}</small></button>`)
    .join("");
  const durOk = !!modelById(state.model).duration;
  $("#dur-field").hidden = !durOk;
}
$("#models").addEventListener("click", (e) => {
  const b = e.target.closest("[data-model]");
  if (!b) return;
  state.model = b.dataset.model;
  S.setPref("model", state.model);
  renderModels();
});
$("#show-legacy").addEventListener("change", renderModels);

function setMode(mode) {
  state.mode = mode;
  S.setPref("mode", mode);
  $$(".mode-toggle [data-mode]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === mode)));
  $$("[data-simple]").forEach((el) => (el.hidden = mode !== "simple"));
  $$("[data-simple-only]").forEach((el) => (el.hidden = mode !== "simple"));
  $$("[data-custom]").forEach((el) => (el.hidden = mode !== "custom"));
  $("#mode-blurb").textContent = mode === "simple"
    ? "Describe it in plain words and we handle the rest."
    : "Full control: your lyrics, your style, your rules.";
}
$(".mode-toggle").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mode]");
  if (b) setMode(b.dataset.mode);
});

function renderChips() {
  for (const host of $$(".chips[data-target]")) {
    host.innerHTML = Object.entries(CHIPS)
      .map(([group, list]) => `<div class="chip-row"><span>${group}</span>${list.map((c) => `<button type="button" class="chip" data-chip="${esc(c)}">${esc(c)}</button>`).join("")}</div>`)
      .join("");
    syncChips(host);
  }
}
const splitTags = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
function syncChips(host) {
  const input = $(`#${host.dataset.target}`);
  const have = new Set(splitTags(input.value).map((x) => x.toLowerCase()));
  $$(".chip", host).forEach((c) => c.classList.toggle("on", have.has(c.dataset.chip.toLowerCase())));
}
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chips[data-target] .chip");
  if (!chip) return;
  const host = chip.closest(".chips");
  const input = $(`#${host.dataset.target}`);
  const tags = splitTags(input.value);
  const i = tags.findIndex((t) => t.toLowerCase() === chip.dataset.chip.toLowerCase());
  if (i >= 0) tags.splice(i, 1);
  else tags.push(chip.dataset.chip);
  input.value = tags.join(", ").slice(0, input.maxLength > 0 ? input.maxLength : 1000);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
["s-style", "c-style"].forEach((id) => $(`#${id}`).addEventListener("input", () => syncChips($(`.chips[data-target="${id}"]`))));

$("#tagbar").innerHTML = LYRIC_TAGS.map((t) => `<button type="button" class="chip" data-tag="${t}">${t}</button>`).join("");
$("#tagbar").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tag]");
  if (!b) return;
  const ta = $("#c-lyrics");
  const { selectionStart: s, selectionEnd: en, value: v } = ta;
  const before = v.slice(0, s);
  const insert = `${before && !before.endsWith("\n") ? "\n\n" : ""}${b.dataset.tag}\n`;
  ta.value = before + insert + v.slice(en);
  ta.focus();
  ta.selectionStart = ta.selectionEnd = s + insert.length;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
});

// Character counters on static fields
function updateCounter(el) {
  const c = $(`.counter[data-for="${el.id}"]`);
  if (c) c.textContent = `${el.value.length} / ${el.maxLength}`;
}
document.addEventListener("input", (e) => {
  if (e.target.id) updateCounter(e.target);
});

// Instrumental hides lyrics in custom mode
$("#c-instrumental").addEventListener("change", (e) => {
  $("[data-lyrics]").hidden = e.target.checked;
  $("#c-gender").closest(".field").style.opacity = e.target.checked ? 0.4 : 1;
});

// Duration slider
$("#c-dur-on").addEventListener("change", (e) => ($("#c-dur").disabled = !e.target.checked));
$("#c-dur").addEventListener("input", (e) => ($("#c-dur-out").textContent = fmtTime(Number(e.target.value))));

// Vocal gender segmented
$("#c-gender").addEventListener("click", (e) => {
  const b = e.target.closest("[role=radio]");
  if (!b) return;
  $$("#c-gender [role=radio]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
});

const advanced = buildForm(advancedFields());
$("#c-advanced").append(advanced.el);

function renderPersonaOptions() {
  const sel = $("#c-persona");
  const cur = sel.value;
  sel.innerHTML = `<option value="">None</option>` + S.getPersonas().map((p) => `<option value="${esc(p.personaId)}">${esc(p.name)}</option>`).join("");
  sel.value = S.getPersonas().some((p) => p.personaId === cur) ? cur : "";
}
S.on("personas", renderPersonaOptions);

// Surprise me
const pick = (a) => a[Math.floor(Math.random() * a.length)];
$("#surprise").addEventListener("click", () => {
  const p = $("#s-prompt");
  p.value = surprisePrompt();
  p.dispatchEvent(new Event("input", { bubbles: true }));
  const st = $("#s-style");
  if (!st.value.trim()) {
    st.value = [pick(CHIPS.Mood), pick(CHIPS.Sound)].join(", ");
    st.dispatchEvent(new Event("input", { bubbles: true }));
  }
  p.focus();
});

// Boost style
$("#boost").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  const input = $("#c-style");
  const content = input.value.trim() || [pick(CHIPS.Genre), pick(CHIPS.Mood)].join(", ");
  btn.disabled = true;
  const old = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Boosting…`;
  try {
    const d = await api.boostStyle(content);
    const result = d?.result || (typeof d === "string" ? d : "");
    if (!result) throw new Error("No style came back. Try again in a moment.");
    input.value = result.slice(0, 1000);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    toast("Style boosted ✨", { type: "ok", timeout: 2500 });
    refreshCredits();
  } catch (err) {
    toast(err.message, { type: "error" });
  } finally {
    btn.disabled = false;
    btn.innerHTML = old;
  }
});

// Write lyrics → hand off to Lyrics Lab
$("#write-lyrics").addEventListener("click", () => {
  const title = $("#c-title").value.trim();
  const style = $("#c-style").value.trim();
  const seed = [title && `A song called "${title}"`, style && `in the style of ${style}`].filter(Boolean).join(" ");
  const lp = $("#l-prompt");
  lp.value = (seed || "").slice(0, 200);
  updateCounter(lp);
  showView("lyrics");
  lp.focus();
  toast("Describe your song, hit Write lyrics, then “Use in song”.", { timeout: 4000 });
});

// Attachments (simple mode inspiration)
function renderAttachments() {
  for (const box of $$(".attach")) {
    const type = box.dataset.attach;
    let list = box.querySelector(".attach-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "attach-list";
      box.append(list);
    }
    const items = state.attachments[type];
    list.innerHTML = items.map((f, i) => `<div class="file-pill">${f.uploading ? '<span class="spinner"></span>' : "✓"}<span>${esc(f.name)}</span>${f.uploading ? "" : `<button type="button" data-rm="${type}:${i}" aria-label="Remove">×</button>`}</div>`).join("")
      + (items.length < Number(box.dataset.max) ? `<span class="hint">+ Click to add</span>` : "");
  }
}
$$(".attach").forEach((box) => {
  box.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) {
      const [type, i] = rm.dataset.rm.split(":");
      state.attachments[type].splice(Number(i), 1);
      renderAttachments();
      return;
    }
    const type = box.dataset.attach;
    const max = Number(box.dataset.max);
    if (state.attachments[type].length >= max) return toast(`That's the max for ${type}.`, { type: "warn" });
    const input = document.createElement("input");
    input.type = "file";
    input.accept = box.dataset.accept;
    input.multiple = max > 1;
    input.onchange = async () => {
      const files = [...input.files].slice(0, max - state.attachments[type].length);
      await Promise.all(files.map(async (file) => {
        const item = { name: file.name, uploading: true };
        state.attachments[type].push(item);
        renderAttachments();
        try {
          item.url = await api.upload(file);
          item.uploading = false;
        } catch (err) {
          state.attachments[type] = state.attachments[type].filter((x) => x !== item);
          toast(`Upload failed: ${err.message}`, { type: "error" });
        }
        renderAttachments();
      }));
    };
    input.click();
  });
});

// Generate
let askedNotify = false;
function maybeAskNotify() {
  if (askedNotify || !("Notification" in window) || Notification.permission !== "default") return;
  askedNotify = true;
  Notification.requestPermission().catch(() => {});
}

// Enter in a single-line field shouldn't fire off a (credit-spending) generation.
$("#create-form").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !(e.ctrlKey || e.metaKey) && e.target.matches("input")) e.preventDefault();
});

$("#create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#generate");
  const model = state.model;
  let body, label;

  if (state.mode === "simple") {
    if (Object.values(state.attachments).flat().some((x) => x.uploading)) return toast("Hang on, attachments are still uploading.", { type: "warn" });
    const instrumental = $("#s-instrumental").checked;
    body = {
      customMode: false,
      instrumental,
      model,
      prompt: $("#s-prompt").value.trim(),
      style: $("#s-style").value.trim(),
      lyrics: instrumental ? "" : $("#s-lyrics").value.trim(),
      audioUrls: state.attachments.audio.map((x) => x.url),
      imageUrls: state.attachments.image.map((x) => x.url),
      videoUrls: state.attachments.video.map((x) => x.url),
    };
    if (!body.prompt && !body.style && !body.lyrics && !body.audioUrls.length && !body.imageUrls.length && !body.videoUrls.length) {
      $("#s-prompt").focus();
      return toast("Tell us what the song is about, or tap “Surprise me”.", { type: "warn" });
    }
    label = body.prompt ? body.prompt.slice(0, 60) : body.style.slice(0, 60) || "New song";
  } else {
    const instrumental = $("#c-instrumental").checked;
    const adv = advanced.get();
    const personaId = $("#c-persona-id").value.trim() || $("#c-persona").value;
    body = {
      customMode: true,
      instrumental,
      model,
      title: $("#c-title").value.trim(),
      style: $("#c-style").value.trim(),
      lyrics: instrumental ? "" : $("#c-lyrics").value.trim(),
      negativeTags: $("#c-negative").value.trim(),
      vocalGender: instrumental ? "" : $("#c-gender [aria-checked=true]").dataset.v,
      duration: $("#c-dur-on").checked && modelById(model).duration ? Number($("#c-dur").value) : undefined,
      styleWeight: adv.styleWeight,
      weirdnessConstraint: adv.weirdnessConstraint,
      audioWeight: instrumental ? undefined : adv.audioWeight,
      variety: adv.variety,
      personaId,
      personaModel: personaId ? $("#c-persona-model").value : "",
    };
    if (!body.style && !body.lyrics && !body.negativeTags) {
      $("#c-style").focus();
      return toast("Add a style (or lyrics) so the model knows what to make.", { type: "warn" });
    }
    if (!instrumental && !body.lyrics) {
      $("#c-lyrics").focus();
      return toast("Add lyrics, or switch on Instrumental. “Write them for me” drafts some in seconds.", { type: "warn", timeout: 6000 });
    }
    label = body.title || body.style.slice(0, 60) || "Custom song";
  }

  btn.disabled = true;
  const old = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Sending to the studio…`;
  try {
    const taskId = await api.generate(body);
    startJob("music", taskId, label, { model, title: body.title, op: "generate" });
    toast("🎶 Cooking! Two takes are on the way. Usually 1 to 3 minutes.", { type: "ok" });
    maybeAskNotify();
  } catch (err) {
    handleApiError(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = old;
  }
});

function handleApiError(err) {
  if (err.code === 401) return showGate(err.message);
  toast(err.message, { type: "error", timeout: 7000 });
}

// ============================================================================
// Lyrics Lab
// ============================================================================
$("#l-surprise").addEventListener("click", () => {
  const p = $("#l-prompt");
  p.value = surprisePrompt().replace(/^A song/, "Lyrics for a song").split(". Make it")[0].slice(0, 200);
  updateCounter(p);
});
$("#lyrics-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = $("#l-prompt").value.trim();
  if (!prompt) return $("#l-prompt").focus();
  const btn = e.submitter || $("#lyrics-form [type=submit]");
  btn.disabled = true;
  try {
    const id = await api.lyrics(prompt);
    startJob("lyrics", id, prompt, { prompt });
    toast("✍️ Writing lyrics…", { type: "ok", timeout: 2500 });
  } catch (err) {
    handleApiError(err);
  } finally {
    btn.disabled = false;
  }
});

function renderLyricDrafts() {
  const drafts = S.getLyricDrafts();
  const host = $("#lyric-drafts");
  if (!drafts.length) {
    host.innerHTML = `<div class="empty"><h3>No drafts yet</h3><p>Your lyric drafts will land here. Each request usually returns two versions.</p></div>`;
    return;
  }
  host.innerHTML = drafts.map((d, i) => `<article class="lyric-card">
      <div class="t-title"><b>${esc(d.title || "Untitled")}</b></div>
      <span class="src">From: “${esc(d.prompt)}” · ${ago(d.createdAt)}</span>
      <pre>${esc(d.text)}</pre>
      <div class="row-actions">
        <button class="btn btn-sm btn-ghost" data-lcopy="${i}">Copy</button>
        <button class="btn btn-sm btn-primary" data-luse="${i}">Use in song</button>
      </div></article>`).join("")
    + `<div class="empty" style="padding:1rem"><button class="btn btn-sm btn-ghost btn-danger" id="clear-drafts">Clear drafts</button></div>`;
}
$("#lyric-drafts").addEventListener("click", (e) => {
  const drafts = S.getLyricDrafts();
  const use = e.target.closest("[data-luse]");
  const cp = e.target.closest("[data-lcopy]");
  if (e.target.closest("#clear-drafts")) return S.clearLyricDrafts();
  if (cp) return copy(drafts[cp.dataset.lcopy].text, "Lyrics copied");
  if (use) {
    const d = drafts[use.dataset.luse];
    setMode("custom");
    $("#c-instrumental").checked = false;
    $("#c-instrumental").dispatchEvent(new Event("change"));
    $("#c-lyrics").value = d.text.slice(0, 5000);
    updateCounter($("#c-lyrics"));
    if (!$("#c-title").value.trim() && d.title) $("#c-title").value = d.title.slice(0, 80);
    showView("create");
    toast("Lyrics loaded. Pick a style and hit Generate.", { type: "ok" });
    setTimeout(() => $("#c-style").focus(), 100);
  }
});
S.on("lyrics", renderLyricDrafts);

// ============================================================================
// Audio source picker (upload / library / URL)
// ============================================================================
function sourcePicker(label, { maxMin = 8 } = {}) {
  const el = html`<div class="field source"><span class="label">${esc(label)} <em class="req">*</em></span><div class="src-body"></div></div>`;
  const body = el.querySelector(".src-body");
  let value = null; // { url, name }

  const renderEmpty = () => {
    const libTracks = S.getTracks().filter((t) => t.audio && !t.pending);
    body.innerHTML = `
      <div class="dropzone" tabindex="0" role="button"><svg><use href="#i-upload"/></svg><b>Drop an audio file or click to upload</b><span class="hint">MP3, WAV, M4A… up to ${maxMin} minutes</span></div>
      <div class="row-2">
        <select class="src-lib" ${libTracks.length ? "" : "disabled"}><option value="">${libTracks.length ? "…or pick from your library" : "Your library is empty"}</option>${libTracks.map((t) => `<option value="${esc(t.id)}">${esc(t.title)}</option>`).join("")}</select>
        <div class="input-group"><input type="url" class="src-url" placeholder="…or paste a public audio URL"/><button type="button" class="btn btn-sm src-url-go">Use</button></div>
      </div>`;
    const dz = body.querySelector(".dropzone");
    const choose = () => {
      const i = document.createElement("input");
      i.type = "file";
      i.accept = "audio/*";
      i.onchange = () => i.files[0] && upload(i.files[0]);
      i.click();
    };
    dz.addEventListener("click", choose);
    dz.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), choose()));
    dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("drag"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("drag");
      const f = e.dataTransfer.files[0];
      if (f) upload(f);
    });
    body.querySelector(".src-lib").addEventListener("change", (e) => {
      const t = S.getTrack(e.target.value);
      if (t) set(t.audio, t.title);
    });
    body.querySelector(".src-url-go").addEventListener("click", () => {
      const u = body.querySelector(".src-url").value.trim();
      if (!/^https?:\/\//.test(u)) return toast("Paste a full http(s) link to an audio file.", { type: "warn" });
      set(u, u.split("/").pop().split("?")[0] || "Linked audio");
    });
  };

  async function upload(file) {
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|aac|flac|ogg|webm)$/i.test(file.name)) return toast("That doesn't look like an audio file.", { type: "warn" });
    body.innerHTML = `<div class="source-ready"><span class="spinner"></span><span class="name">Uploading ${esc(file.name)}…</span></div>`;
    try {
      const url = await api.upload(file);
      set(url, file.name);
      toast("Uploaded. Files are kept for 3 days.", { type: "ok", timeout: 2500 });
    } catch (err) {
      toast(`Upload failed: ${err.message}`, { type: "error" });
      renderEmpty();
    }
  }

  function set(url, name) {
    value = { url, name };
    body.innerHTML = `<div class="source-ready"><span class="name" title="${esc(name)}">🎧 ${esc(name)}</span><audio controls preload="none" src="${esc(url)}"></audio><button type="button" class="btn btn-sm btn-ghost">Change</button></div>`;
    body.querySelector("button").addEventListener("click", () => { value = null; renderEmpty(); });
  }

  renderEmpty();
  return { el, get: () => value?.url || "", set };
}

// ============================================================================
// Remix
// ============================================================================
const REMIX = {
  cover: { emoji: "🎨", title: "Restyle", desc: "Same melody, brand-new genre." },
  extend: { emoji: "➕", title: "Continue it", desc: "Extend your upload from any point." },
  instrumental: { emoji: "🎸", title: "Add a band", desc: "Backing track for your vocals or melody." },
  vocals: { emoji: "🎤", title: "Add vocals", desc: "An AI singer on your instrumental." },
  mashup: { emoji: "🔀", title: "Mashup", desc: "Blend two tracks into one." },
};

function renderRemixModes() {
  $("#remix-modes").innerHTML = Object.entries(REMIX).map(([k, m]) =>
    `<button type="button" role="radio" class="remix-mode" data-remix="${k}" aria-checked="${k === state.remixMode}"><span class="emoji">${m.emoji}</span><b>${m.title}</b><small>${m.desc}</small></button>`).join("");
}
$("#remix-modes").addEventListener("click", (e) => {
  const b = e.target.closest("[data-remix]");
  if (!b) return;
  state.remixMode = b.dataset.remix;
  renderRemixModes();
  renderRemix();
});

const vocalField = () => ({ name: "vocalGender", label: "Vocals", type: "segmented", options: [["", "Any"], ["f", "Female"], ["m", "Male"]], show: (v) => !v.instrumental });
const modelField = () => ({ name: "model", label: "Model", type: "select", options: modelOptions(), value: modelById(state.model).legacy ? "V6" : state.model });
const durationField = () => ({ name: "duration", label: "Target length (seconds)", type: "range", min: 10, max: 360, step: 5, value: 120, optional: true, format: fmtTime, show: (v) => !!modelById(v.model).duration });

function renderRemix(prefill) {
  const mode = state.remixMode;
  const host = $("#remix-body");
  host.replaceChildren();
  const srcA = sourcePicker(mode === "mashup" ? "First track" : mode === "vocals" ? "Your instrumental" : mode === "instrumental" ? "Your vocals or melody" : "Your audio");
  const srcB = mode === "mashup" ? sourcePicker("Second track") : null;
  if (prefill) srcA.set(prefill.url, prefill.name);

  const fieldsByMode = {
    cover: [
      { name: "style", label: "New style", type: "textarea", rows: 2, maxlength: 1000, placeholder: "e.g. Bossa nova, nylon guitar, brushed drums", value: prefill?.style || "" },
      { name: "title", label: "Title", maxlength: 80, placeholder: "Optional", value: prefill?.title ? `${prefill.title} (restyled)`.slice(0, 80) : "" },
      { name: "instrumental", label: "Instrumental (no vocals)", type: "toggle" },
      { name: "lyrics", label: "Lyrics (optional: new words for the melody)", type: "textarea", rows: 5, maxlength: 5000, show: (v) => !v.instrumental },
      vocalField(), modelField(), durationField(),
      { name: "negativeTags", label: "Exclude styles", placeholder: "e.g. heavy metal, autotune" },
    ],
    extend: [
      { name: "continueAt", label: "Continue from (seconds)", type: "number", min: 1, placeholder: "Leave empty to continue from the end", hint: "Must be shorter than your track." },
      { name: "style", label: "Style", type: "textarea", rows: 2, maxlength: 1000, placeholder: "Optional: keeps the original vibe if empty" },
      { name: "title", label: "Title", maxlength: 100, placeholder: "Optional" },
      { name: "instrumental", label: "Instrumental (no vocals)", type: "toggle" },
      { name: "lyrics", label: "Lyrics for the new part", type: "textarea", rows: 5, maxlength: 5000, show: (v) => !v.instrumental },
      vocalField(), modelField(),
      { name: "negativeTags", label: "Exclude styles", placeholder: "Optional" },
    ],
    instrumental: [
      { name: "title", label: "Title", required: true, maxlength: 80, placeholder: "Name your track" },
      { name: "tags", label: "Backing style", type: "textarea", rows: 2, required: true, maxlength: 1000, placeholder: "e.g. Warm acoustic band, fingerpicked guitar, soft cajón" },
      { name: "negativeTags", label: "Avoid", required: true, value: "Distortion, harsh noise", placeholder: "Styles or instruments to avoid" },
      modelField(),
    ],
    vocals: [
      { name: "title", label: "Title", required: true, maxlength: 80, placeholder: "Name your track" },
      { name: "style", label: "Vocal & music style", type: "textarea", rows: 2, required: true, maxlength: 1000, placeholder: "e.g. Soulful female R&B vocals, breathy, harmonies" },
      { name: "lyrics", label: "Lyrics", type: "textarea", rows: 6, maxlength: 5000, placeholder: "What should the singer sing?" },
      { name: "negativeTags", label: "Avoid", required: true, value: "Screaming, off-key", placeholder: "Vocal traits to avoid" },
      vocalField(), modelField(),
    ],
    mashup: [
      { name: "style", label: "Style of the blend", type: "textarea", rows: 2, maxlength: 1000, placeholder: "Optional, e.g. Club remix, four-on-the-floor" },
      { name: "title", label: "Title", maxlength: 80, placeholder: "Optional" },
      { name: "lyrics", label: "Lyrics (optional)", type: "textarea", rows: 4, maxlength: 5000 },
      vocalField(), modelField(), durationField(),
    ],
  };

  const form = buildForm([...fieldsByMode[mode], ...advancedFields()]);
  const advWrap = html`<details class="more"><summary>Fine-tuning</summary></details>`;
  // Move the shared advanced sliders into a collapsible to keep the form calm.
  for (const name of ["styleWeight", "weirdnessConstraint", "audioWeight", "variety"]) advWrap.append(form.refs[name].row);
  form.el.append(advWrap);

  const submit = html`<div class="create-actions"><p class="hint">${mode === "mashup" ? "Uses the first ~2 tracks you provide." : "Uploads are kept for 3 days."}</p><button class="btn btn-primary btn-lg"><svg><use href="#i-sparkle"/></svg> ${REMIX[mode].title}</button></div>`;
  host.append(srcA.el, ...(srcB ? [srcB.el] : []), form.el, submit);

  submit.querySelector("button").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const uploadUrl = srcA.get();
    if (!uploadUrl) return toast("Add your audio first.", { type: "warn" });
    if (srcB && !srcB.get()) return toast("Add the second track for the mashup.", { type: "warn" });
    const err = form.validate();
    if (err) return toast(err, { type: "warn" });
    const v = form.get();
    if (v.instrumental) { delete v.vocalGender; delete v.lyrics; delete v.audioWeight; }
    let call, op;
    switch (mode) {
      case "cover": call = () => api.uploadCover({ uploadUrl, ...v }); op = "cover"; break;
      case "extend": call = () => api.uploadExtend({ uploadUrl, ...v }); op = "upload-extend"; break;
      case "instrumental": call = () => api.addInstrumental({ uploadUrl, ...v }); op = "add-instrumental"; break;
      case "vocals": call = () => api.addVocals({ uploadUrl, ...v }); op = "add-vocals"; break;
      case "mashup": call = () => api.mashup({ uploadUrlList: [uploadUrl, srcB.get()], ...v }); op = "mashup"; break;
    }
    btn.disabled = true;
    try {
      const taskId = await call();
      startJob("music", taskId, v.title || `${REMIX[mode].title}: ${prefill?.name || "your audio"}`, { model: v.model, title: v.title, op });
      toast(`${REMIX[mode].emoji} On it! Follow progress in the Studio monitor.`, { type: "ok", action: { label: "Watch", onClick: () => showView("library") } });
      maybeAskNotify();
    } catch (er) {
      handleApiError(er);
    } finally {
      btn.disabled = false;
    }
  });
}

// ============================================================================
// Sound FX
// ============================================================================
function renderSounds() {
  const form = buildForm([
    { name: "prompt", label: "Describe the sound", type: "textarea", rows: 3, maxlength: 500, required: true, placeholder: "e.g. Cozy lo-fi piano loop with rain in the background" },
    { name: "ideas", type: "html", html: `<div class="chip-row"><span>Ideas</span>${SOUND_IDEAS.map((s) => `<button type="button" class="chip" data-idea="${esc(s)}">${esc(s)}</button>`).join("")}</div>` },
    { name: "soundLoop", label: "Seamless loop", type: "toggle", value: true },
    { name: "soundTempo", label: "Tempo (BPM)", type: "range", min: 40, max: 240, step: 1, value: 120, optional: true, format: (v) => `${v} BPM`, hint: "Off = auto." },
    { name: "soundKey", label: "Key", type: "select", options: SOUND_KEYS, value: "Any" },
    modelField(),
  ]);
  const submit = html`<div class="create-actions"><p class="hint">Sounds appear in your Library under “Sounds”.</p><button class="btn btn-primary btn-lg"><svg><use href="#i-sparkle"/></svg> Make the sound</button></div>`;
  $("#sounds-body").replaceChildren(form.el, submit);
  form.el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-idea]");
    if (b) form.set("prompt", b.dataset.idea);
  });
  submit.querySelector("button").addEventListener("click", async (e) => {
    const err = form.validate();
    if (err) return toast(err, { type: "warn" });
    const v = form.get();
    delete v.ideas;
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const taskId = await api.sounds(v);
      startJob("music", taskId, v.prompt.slice(0, 60), { model: v.model, title: v.prompt.slice(0, 40), op: "sound" });
      toast("🔊 Sound in the works!", { type: "ok" });
    } catch (er) {
      handleApiError(er);
    } finally {
      btn.disabled = false;
    }
  });
}

// ============================================================================
// Jobs UI
// ============================================================================
const elapsed = (j) => fmtTime(((j.finishedAt || Date.now()) - j.createdAt) / 1000);
const cookingLine = (j) => COOKING_LINES[Math.floor((Date.now() - j.createdAt) / 6000 + j.id.length) % COOKING_LINES.length];

function jobLine(j) {
  if (j.state === "failed") return `⚠️ ${j.error || "Something went wrong."}`;
  if (j.state === "stalled") return "This one's taking longer than usual.";
  if (j.state === "done") return j.kind === "music" ? "Ready to play 🎉" : "Done ✓";
  if (j.kind === "music") return j.stage === 2 ? "First take is streaming. Tap Listen!" : cookingLine(j);
  return { lyrics: "Finding the right words…", wav: "Rendering lossless audio…", stems: "Pulling the mix apart…", video: "Rendering your video…", cover: "Painting cover art…" }[j.kind] || "Working…";
}

function jobCard(j) {
  const music = j.kind === "music";
  const stages = music ? `<div class="stages">${MUSIC_STAGES.map((_, i) => `<i class="${(j.state === "done" || i < j.stage) ? "on" : ""} ${j.state === "running" && i === j.stage ? "cur" : ""}"></i>`).join("")}</div>
    <div class="stage-labels">${MUSIC_STAGES.map((s) => `<span>${s}</span>`).join("")}</div>` : "";
  const firstTrack = S.getTracks().find((t) => t.taskId === j.id && (t.audio || t.stream));
  const actions = [
    j.state === "running" && music && j.stage >= 2 && firstTrack ? `<button class="btn btn-sm btn-primary" data-jplay="${esc(firstTrack.id)}"><svg><use href="#i-play"/></svg> Listen</button>` : "",
    j.state === "done" && music && firstTrack ? `<button class="btn btn-sm btn-primary" data-jplay="${esc(firstTrack.id)}"><svg><use href="#i-play"/></svg> Play</button>` : "",
    j.state === "done" && ["wav", "video", "stems", "cover"].includes(j.kind) && j.meta.audioId ? `<button class="btn btn-sm" data-jopen="${esc(j.meta.audioId)}">Open</button>` : "",
    j.state === "done" && j.kind === "lyrics" ? `<button class="btn btn-sm" data-view="lyrics">View drafts</button>` : "",
    j.state === "stalled" || j.state === "failed" ? `<button class="btn btn-sm" data-jretry="${esc(j.id)}"><svg><use href="#i-refresh"/></svg> Check again</button>` : "",
    j.state !== "running" ? `<button class="btn btn-sm btn-ghost" data-jdismiss="${esc(j.id)}">Dismiss</button>` : "",
  ].join("");
  return `<div class="job ${j.state}" data-job="${esc(j.id)}">
    <div class="job-top">${j.state === "running" ? '<span class="eq"><i></i><i></i><i></i><i></i></span>' : ""}<b title="${esc(j.label)}">${esc(j.label)}</b><small><span class="tag-kind">${KIND_LABEL[j.kind]}</span> <span data-elapsed>${elapsed(j)}</span></small></div>
    ${stages}<div class="job-line" data-line>${esc(jobLine(j))}</div>
    ${actions ? `<div class="job-actions">${actions}</div>` : ""}</div>`;
}

function renderJobs() {
  const jobs = S.getJobs();
  const running = jobs.filter((j) => j.state === "running");
  $("#jobs-pill").hidden = !running.length;
  $("#jobs-pill-n").textContent = running.length;
  for (const host of $$("[data-jobs]")) {
    const which = host.dataset.jobs;
    let list;
    if (which === "lyrics") list = jobs.filter((j) => j.kind === "lyrics" && j.state !== "done");
    else if (host.closest("#view-library")) list = jobs.filter((j) => j.kind !== "lyrics" && j.state !== "done");
    else list = jobs.filter((j) => j.kind !== "lyrics").slice(0, 6);
    host.innerHTML = list.map(jobCard).join("")
      || (host.closest(".create-side") ? `<div class="jobs-empty"><span class="eq"><i></i><i></i><i></i><i></i></span><div>Quiet in here. Hit <b>Generate</b> and watch your song come to life.</div></div>` : "");
  }
}
S.on("jobs", renderJobs);
setInterval(() => {
  for (const el of $$("[data-job]")) {
    const j = S.getJobs().find((x) => x.id === el.dataset.job);
    if (!j) continue;
    const e = el.querySelector("[data-elapsed]");
    if (e) e.textContent = elapsed(j);
    const l = el.querySelector("[data-line]");
    if (l && j.state === "running") l.textContent = jobLine(j);
  }
}, 1000);
document.addEventListener("click", (e) => {
  const p = e.target.closest("[data-jplay]");
  const o = e.target.closest("[data-jopen]");
  const r = e.target.closest("[data-jretry]");
  const d = e.target.closest("[data-jdismiss]");
  if (p) playTrack(p.dataset.jplay);
  if (o) openTrack(o.dataset.jopen);
  if (r) retryJob(r.dataset.jretry);
  if (d) S.removeJob(d.dataset.jdismiss);
});
$("#jobs-pill").addEventListener("click", () => showView("library"));

// Job lifecycle → delight
let originalTitle = document.title;
S.on("job:first", (job) => {
  const t = S.getTracks().find((x) => x.taskId === job.id && x.stream);
  if (t) toast(`First take of “${job.label}” is streaming.`, { action: { label: "Listen", onClick: () => playTrack(t.id) } });
});
S.on("job:done", ({ job, count }) => {
  if (job.kind === "music") {
    const t = S.getTracks().find((x) => x.taskId === job.id);
    toast(`“${t?.title || job.label}” is ready${count > 1 ? ` (${count} takes)` : ""}!`, { type: "ok", timeout: 8000, action: t ? { label: "Play", onClick: () => playTrack(t.id) } : null });
    confetti();
    notify(`🎵 ${t?.title || job.label} is ready`, "Tap to listen in Hookline.");
    refreshCredits();
  } else if (job.kind === "lyrics") {
    toast("✍️ Fresh lyrics are ready.", { type: "ok", action: { label: "View", onClick: () => showView("lyrics") } });
    refreshCredits();
  } else {
    toast(`${KIND_LABEL[job.kind]} ready: ${job.label}`, { type: "ok", action: job.meta.audioId ? { label: "Open", onClick: () => openTrack(job.meta.audioId) } : null });
    notify(`${KIND_LABEL[job.kind]} ready`, job.label);
    refreshCredits();
    const open = $("#modal").open && $("#modal").dataset.track;
    if (open && (open === job.meta.audioId || S.getTrack(open)?.taskId === job.meta.taskId)) openTrack(open);
  }
});
S.on("job:failed", (job) => toast(`${job.label}: ${job.error}`, { type: "error", timeout: 9000 }));

function notify(title, body) {
  if (!document.hidden) return;
  document.title = `🎵 ${title}`;
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "favicon.svg" }); } catch {}
  }
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) document.title = originalTitle; });

// ============================================================================
// Library
// ============================================================================
const cssUrl = (u) => `url("${String(u).replace(/["\\\n]/g, encodeURIComponent)}")`;
const artStyle = (t) => (t.image ? `style="background-image:${esc(cssUrl(t.image))}"` : "");
const playable = (t) => !!(t.audio || t.stream);

function filteredTracks() {
  const q = state.libQuery.toLowerCase();
  return S.getTracks().filter((t) => {
    if (state.libFilter === "fav" && !t.fav) return false;
    if (state.libFilter === "sounds" && t.kind !== "sound") return false;
    if (q && ![t.title, t.tags, t.lyrics].join(" ").toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderLibrary() {
  const all = S.getTracks();
  $("#lib-count").textContent = all.length || "";
  const list = filteredTracks();
  const host = $("#library");
  if (!list.length) {
    host.innerHTML = all.length
      ? `<div class="empty"><h3>Nothing matches</h3><p>Try a different search or filter.</p></div>`
      : `<div class="empty"><h3>Your songs will live here</h3><p>Create your first track and it'll show up instantly.</p><p><button class="btn btn-primary" data-goto="create"><svg><use href="#i-sparkle"/></svg> Create a song</button></p></div>`;
  } else {
    host.innerHTML = list.map((t) => `<article class="tcard ${t.id === state.current ? "is-current" : ""}" data-track="${esc(t.id)}">
      <div class="art lg ${t.pending && !playable(t) ? "pending" : ""}" ${artStyle(t)}>
        ${playable(t) ? `<button class="play-ov" data-play="${esc(t.id)}" aria-label="Play ${esc(t.title)}"><svg><use href="#i-${t.id === state.current && !audio.paused ? "pause" : "play"}"/></svg></button>` : ""}
      </div>
      <div class="t-title"><b title="${esc(t.title)}">${esc(t.title)}</b><button class="fav ${t.fav ? "on" : ""}" data-fav="${esc(t.id)}" aria-label="Favorite"><svg><use href="#i-star"/></svg></button></div>
      <small>${esc(t.tags || (t.pending ? "Still cooking…" : ""))}</small>
      <div class="t-foot"><span class="tag-kind">${esc(OP_LABEL[t.kind] || "Song")}</span><span>${t.duration ? fmtTime(t.duration) + " · " : ""}${ago(t.createdAt)}</span></div>
    </article>`).join("");
  }
  // Recent (create sidebar)
  const recent = all.slice(0, 5);
  $("#recent").innerHTML = recent.length
    ? recent.map((t) => `<div class="track-row ${t.id === state.current ? "is-current" : ""}" data-track="${esc(t.id)}">
        <div class="art ${t.pending && !playable(t) ? "pending" : ""}" ${artStyle(t)}>${playable(t) ? `<button class="play-ov" data-play="${esc(t.id)}" aria-label="Play"><svg><use href="#i-${t.id === state.current && !audio.paused ? "pause" : "play"}"/></svg></button>` : ""}</div>
        <div class="meta"><b>${esc(t.title)}</b><small>${esc(t.tags || (t.pending ? "Still cooking…" : ""))}</small></div>
        ${t.duration ? `<small class="muted">${fmtTime(t.duration)}</small>` : ""}</div>`).join("")
    : `<p class="muted" style="font-size:.88rem">Nothing yet. Your first two takes will appear here.</p>`;
}
S.on("tracks", renderLibrary);

$("#lib-search").addEventListener("input", (e) => { state.libQuery = e.target.value; renderLibrary(); });
$("#lib-filter").addEventListener("click", (e) => {
  const b = e.target.closest("[role=radio]");
  if (!b) return;
  state.libFilter = b.dataset.v;
  $$("#lib-filter [role=radio]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  renderLibrary();
});

document.addEventListener("click", (e) => {
  const play = e.target.closest("[data-play]");
  if (play) { e.stopPropagation(); return togglePlay(play.dataset.play); }
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    e.stopPropagation();
    const t = S.getTrack(fav.dataset.fav);
    return S.patchTrack(t.id, { fav: !t.fav });
  }
  const card = e.target.closest("[data-track]");
  if (card && !e.target.closest("button")) openTrack(card.dataset.track);
});

// ============================================================================
// Track detail + actions
// ============================================================================
const ACTIONS = [
  ["extend", "⏩ Extend", "Keep it going from any point"],
  ["replace", "✂️ Replace a section", "Rewrite a 10s+ slice"],
  ["karaoke", "🎤 Sing along", "Word-by-word synced lyrics"],
  ["remix", "🎨 Restyle", "Cover it in a new genre"],
  ["stems", "🎚️ Stems", "Split vocals and instruments"],
  ["wav", "💿 WAV", "Lossless download"],
  ["video", "🎬 Music video", "MP4 with visuals"],
  ["cover", "🖼️ Cover art", "AI artwork options"],
  ["persona", "🧬 Save persona", "Reuse this voice and style"],
];

function openTrack(id, sub) {
  const t = S.getTrack(id);
  if (!t) return toast("That track isn't in your library anymore.", { type: "warn" });
  const dlg = $("#modal");
  dlg.dataset.track = id;
  if (sub) return openAction(t, sub);
  const x = t.extras || {};
  const running = S.getJobs().filter((j) => j.state === "running" && (j.meta.audioId === t.id || (j.kind === "cover" && j.meta.taskId === t.taskId)));
  const body = html`<div class="detail">
    <div class="detail-side">
      <div class="art lg ${t.pending && !playable(t) ? "pending" : ""}" ${artStyle(t)}>${playable(t) ? `<button class="play-ov" data-play="${esc(t.id)}" aria-label="Play"><svg><use href="#i-play"/></svg></button>` : ""}</div>
      <div class="row-actions" style="justify-content:flex-start">
        ${playable(t) ? `<button class="btn btn-sm btn-primary" data-play="${esc(t.id)}"><svg><use href="#i-play"/></svg> Play</button>` : ""}
        ${t.audio ? `<button class="btn btn-sm" data-dl><svg><use href="#i-download"/></svg> MP3</button>` : ""}
        <button class="btn btn-sm fav-btn">${t.fav ? "★ Favorited" : "☆ Favorite"}</button>
      </div>
      <div class="ids">audioId: ${esc(t.id)}<br/>taskId: ${esc(t.taskId)}</div>
      <button class="btn btn-sm btn-ghost" data-copyids>Copy IDs</button>
    </div>
    <div class="detail-main">
      <div><h2>${esc(t.title)}</h2>
        <div class="tags-line">${esc(t.tags || "")}</div>
        <div class="hint">${[OP_LABEL[t.kind] || "Song", t.model, t.duration ? fmtTime(t.duration) : "", ago(t.createdAt)].filter(Boolean).map(esc).join(" · ")}${x.parentTitle ? ` · from “${esc(x.parentTitle)}”` : ""}</div>
      </div>
      ${t.pending ? `<p class="hint">⏳ Still finishing up. Studio tools unlock when this take is complete.</p>` : ""}
      ${running.length ? `<div class="jobs-list">${running.map(jobCard).join("")}</div>` : ""}
      <div><div class="label" style="margin-bottom:.5rem">Make more of it</div>
        <div class="actions-grid">${ACTIONS.map(([k, l, d]) => `<button class="action" data-act="${k}" ${t.pending ? "disabled" : ""}><b>${l}</b><small>${d}</small></button>`).join("")}</div></div>
      <div class="extras">${renderExtras(t)}</div>
      ${t.lyrics ? `<div><div class="label" style="margin-bottom:.4rem">Lyrics</div><pre class="lyrics-box">${esc(t.lyrics)}</pre></div>` : ""}
      <div><button class="btn btn-sm btn-ghost btn-danger" data-remove>Remove from library</button></div>
    </div></div>`;

  body.querySelector("[data-dl]")?.addEventListener("click", () => download(t.audio, `${slug(t.title)}.mp3`));
  body.querySelector(".fav-btn").addEventListener("click", () => { S.patchTrack(t.id, { fav: !t.fav }); openTrack(t.id); });
  body.querySelector("[data-copyids]").addEventListener("click", () => copy(`audioId: ${t.id}\ntaskId: ${t.taskId}`, "IDs copied"));
  body.querySelector("[data-remove]").addEventListener("click", () => {
    if (!confirm(`Remove “${t.title}” from your library? (This only affects this browser.)`)) return;
    if (state.current === t.id) { audio.pause(); $("#player").hidden = true; state.current = null; }
    S.removeTrack(t.id);
    closeModal();
  });
  body.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (a && !a.disabled) openAction(t, a.dataset.act);
    const c = e.target.closest("[data-setcover]");
    if (c) { S.patchTracksByTask(t.taskId, { image: c.dataset.setcover }); toast("Cover updated.", { type: "ok", timeout: 2000 }); openTrack(t.id); }
    const d = e.target.closest("[data-dlurl]");
    if (d) download(d.dataset.dlurl, d.dataset.name);
  });
  openModal({ title: "Track", body, wide: true });
}

function renderExtras(t) {
  const x = t.extras || {};
  const out = [];
  if (x.wav) out.push(`<div class="extra"><b>💿 WAV</b><button class="btn btn-sm" data-dlurl="${esc(x.wav)}" data-name="${esc(slug(t.title))}.wav"><svg><use href="#i-download"/></svg> Download WAV</button></div>`);
  if (x.video) out.push(`<div class="extra"><b>🎬 Video</b><video controls preload="none" src="${esc(x.video)}" poster="${esc(t.image || "")}"></video><button class="btn btn-sm" data-dlurl="${esc(x.video)}" data-name="${esc(slug(t.title))}.mp4"><svg><use href="#i-download"/></svg> MP4</button></div>`);
  if (x.stems?.length) out.push(...x.stems.map((s) => `<div class="extra"><b>🎚️ ${esc(s.name)}</b><audio controls preload="none" src="${esc(s.url)}"></audio><button class="icon-btn" data-dlurl="${esc(s.url)}" data-name="${esc(slug(t.title))}-${esc(slug(s.name))}.mp3" aria-label="Download ${esc(s.name)}"><svg><use href="#i-download"/></svg></button></div>`));
  if (x.covers?.length) out.push(`<div class="extra"><b>🖼️ Cover art</b><span class="hint">Click one to use it</span><div class="covers">${x.covers.map((u) => `<button data-setcover="${esc(u)}"><img src="${esc(u)}" alt="Cover option" loading="lazy"/></button>`).join("")}</div></div>`);
  return out.length ? `<div class="label">Your extras</div>${out.join("")}` : "";
}

function actionShell(t, title, formEl, onSubmit, submitLabel) {
  const wrap = document.createElement("div");
  const back = html`<button class="btn btn-sm btn-ghost sub-back">← Back to “${esc(t.title)}”</button>`;
  back.addEventListener("click", () => openTrack(t.id));
  const go = html`<div class="create-actions"><span></span><button class="btn btn-primary"><svg><use href="#i-sparkle"/></svg> ${esc(submitLabel)}</button></div>`;
  go.querySelector("button").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await onSubmit();
    } catch (er) {
      handleApiError(er);
    } finally {
      btn.disabled = false;
    }
  });
  wrap.append(back, formEl, go);
  openModal({ title, body: wrap, wide: false });
}

async function openAction(t, act) {
  const label = (what) => `${what} · ${t.title}`;
  switch (act) {
    case "karaoke":
      closeModal();
      return openKaraoke(t.id);

    case "remix":
      closeModal();
      state.remixMode = "cover";
      renderRemixModes();
      renderRemix({ url: t.audio || t.stream, name: t.title, title: t.title, style: "" });
      showView("remix");
      return toast("Loaded into Remix. Pick a new style!", { type: "ok" });

    case "wav":
      try {
        const id = await api.wav(t.taskId, t.id);
        startJob("wav", id, label("WAV"), { audioId: t.id });
        toast("💿 Converting to WAV…", { type: "ok", timeout: 2500 });
        openTrack(t.id);
      } catch (e) { handleApiError(e); }
      return;

    case "cover":
      try {
        const id = await api.coverArt(t.taskId);
        startJob("cover", id, label("Cover art"), { taskId: t.taskId, audioId: t.id });
        toast("🖼️ Painting cover art…", { type: "ok", timeout: 2500 });
        openTrack(t.id);
      } catch (e) { handleApiError(e); }
      return;

    case "extend": {
      const dur = Math.max(2, Math.floor(t.duration || 120));
      const f = buildForm([
        { name: "continueAt", label: "Continue from", type: "range", min: 1, max: dur - 1, step: 1, value: Math.max(1, dur - 30), optional: true, enabled: true, format: fmtTime, hint: "Switch off to continue from the very end." },
        { name: "style", label: "Style", type: "textarea", rows: 2, maxlength: 1000, value: t.tags, placeholder: "Keep empty to match the original" },
        { name: "title", label: "Title", maxlength: 100, value: `${t.title} (extended)`.slice(0, 100) },
        { name: "instrumental", label: "Instrumental (no vocals)", type: "toggle" },
        { name: "lyrics", label: "Lyrics for the new part", type: "textarea", rows: 6, maxlength: 5000, placeholder: "[Verse 3]\n…", show: (v) => !v.instrumental },
        vocalField(), modelField(),
        { name: "negativeTags", label: "Exclude styles", placeholder: "Optional" },
      ]);
      return actionShell(t, "Extend", f.el, async () => {
        const v = f.get();
        if (v.instrumental) { delete v.vocalGender; delete v.lyrics; }
        const id = await api.extend({ audioId: t.id, taskId: t.taskId, ...v });
        startJob("music", id, v.title || label("Extension"), { model: v.model, title: v.title, op: "extend", parentTitle: t.title });
        toast("⏩ Extending…", { type: "ok" });
        openTrack(t.id);
      }, "Extend");
    }

    case "replace": {
      const dur = t.duration || 120;
      const f = buildForm([
        { name: "infillStartS", label: "Start", type: "range", min: 0, max: Math.floor(dur), step: 0.5, value: Math.min(30, Math.max(0, dur / 4)), format: fmtTime },
        { name: "infillEndS", label: "End", type: "range", min: 0, max: Math.floor(dur), step: 0.5, value: Math.min(dur, Math.min(30, Math.max(0, dur / 4)) + 15), format: fmtTime, hint: `Section must be at least 10 s and at most half the song (${fmtTime(dur / 2)}).` },
        { name: "prompt", label: "New lyrics for this section", type: "textarea", rows: 4, required: true, maxlength: 5000, placeholder: "What should be sung in the replaced part?" },
        { name: "fullLyrics", label: "Full song lyrics after the change", type: "textarea", rows: 6, required: true, value: t.lyrics, hint: "Edit so it reads as the complete song with your new section in place." },
        { name: "tags", label: "Style", required: true, value: t.tags || "", maxlength: 1000 },
        { name: "title", label: "Title", required: true, value: t.title, maxlength: 80 },
        { name: "negativeTags", label: "Exclude styles", placeholder: "Optional" },
      ]);
      return actionShell(t, "Replace a section", f.el, async () => {
        const err = f.validate();
        if (err) return toast(err, { type: "warn" });
        const v = f.get();
        const len = v.infillEndS - v.infillStartS;
        if (len < 10) return toast("The section needs to be at least 10 seconds long.", { type: "warn" });
        if (len > dur / 2) return toast("The section can be at most half of the song.", { type: "warn" });
        const id = await api.replaceSection({ taskId: t.taskId, audioId: t.id, ...v });
        startJob("music", id, `${v.title} (edit)`, { title: v.title, op: "replace", parentTitle: t.title });
        toast("✂️ Rewriting that section…", { type: "ok" });
        openTrack(t.id);
      }, "Replace section");
    }

    case "stems": {
      const f = buildForm([
        { name: "type", label: "What do you need?", type: "segmented", options: [["separate_vocal", "Vocals + instrumental"], ["split_stem", "All stems"], ["split_stem_advanced", "One instrument"]], value: "separate_vocal",
          hint: "“All stems” gives drums, bass, guitar, keys and more, and costs more credits." },
        { name: "stemName", label: "Instrument", type: "select", options: STEM_NAMES, value: "Lead Vocal", show: (v) => v.type === "split_stem_advanced" },
      ]);
      return actionShell(t, "Separate stems", f.el, async () => {
        const v = f.get();
        const id = await api.stems({ taskId: t.taskId, audioId: t.id, type: v.type, stemName: v.type === "split_stem_advanced" ? v.stemName : "" });
        startJob("stems", id, label("Stems"), { audioId: t.id, type: v.type });
        toast("🎚️ Splitting the mix…", { type: "ok" });
        openTrack(t.id);
      }, "Separate");
    }

    case "video": {
      const f = buildForm([
        { name: "author", label: "Artist name on the video", maxlength: 50, placeholder: "Optional" },
        { name: "domainName", label: "Watermark", maxlength: 50, placeholder: "Optional, e.g. your site or handle" },
      ]);
      return actionShell(t, "Music video", f.el, async () => {
        const v = f.get();
        const id = await api.video({ taskId: t.taskId, audioId: t.id, ...v });
        startJob("video", id, label("Video"), { audioId: t.id });
        toast("🎬 Rendering video…", { type: "ok" });
        openTrack(t.id);
      }, "Create video");
    }

    case "persona": {
      const dur = t.duration || 60;
      const f = buildForm([
        { name: "name", label: "Persona name", required: true, maxlength: 60, placeholder: "e.g. Midnight Soul Singer" },
        { name: "description", label: "Describe the voice & vibe", type: "textarea", rows: 3, required: true, value: t.tags ? `Signature sound: ${t.tags}` : "", placeholder: "Genre, mood, instrumentation, vocal qualities…" },
        { name: "style", label: "Style label", value: (t.tags || "").slice(0, 100), placeholder: "Optional" },
        { name: "vocalStart", label: "Analyse from (s)", type: "number", min: 0, max: dur, value: 0 },
        { name: "vocalEnd", label: "Analyse to (s)", type: "number", min: 1, max: dur, value: Math.min(30, Math.floor(dur)), hint: "Pick a stretch where the vocals shine." },
      ]);
      return actionShell(t, "Save as persona", f.el, async () => {
        const err = f.validate();
        if (err) return toast(err, { type: "warn" });
        const v = f.get();
        if ((v.vocalEnd ?? 30) <= (v.vocalStart ?? 0)) return toast("“Analyse to” must be after “Analyse from”.", { type: "warn" });
        const d = await api.persona({ taskId: t.taskId, audioId: t.id, ...v });
        if (!d?.personaId) throw new Error("No persona ID came back.");
        S.addPersona({ personaId: d.personaId, name: d.name || v.name, description: v.description, from: t.title, createdAt: Date.now() });
        toast(`🧬 Persona “${v.name}” saved. Find it in Create → Custom → Advanced.`, { type: "ok", timeout: 7000 });
        openTrack(t.id);
      }, "Create persona");
    }
  }
}

// ============================================================================
// Player
// ============================================================================
function playTrack(id) {
  const t = S.getTrack(id);
  if (!t || !playable(t)) return toast("This take isn't playable yet.", { type: "warn" });
  const src = t.audio || t.stream;
  if (state.current !== id || audio.src !== src) {
    state.current = id;
    audio.src = src;
    audio.dataset.fallback = t.audio && t.stream ? t.stream : "";
  }
  audio.play().catch(() => {});
  $("#player").hidden = false;
  $("#p-title").textContent = t.title;
  $("#p-tags").textContent = t.tags || "";
  $("#p-art").style.backgroundImage = t.image ? cssUrl(t.image) : "";
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: "Hookline", album: t.tags || "", artwork: t.image ? [{ src: t.image, sizes: "512x512" }] : [] });
  }
  renderLibrary();
  if (!$("#karaoke").hidden) openKaraoke(id);
}
function togglePlay(id) {
  if (id && id !== state.current) return playTrack(id);
  if (!state.current) {
    const first = S.getTracks().find(playable);
    return first && playTrack(first.id);
  }
  audio.paused ? audio.play().catch(() => {}) : audio.pause();
}
function step(dir) {
  const list = S.getTracks().filter(playable);
  if (!list.length) return;
  const i = list.findIndex((t) => t.id === state.current);
  playTrack(list[(i + dir + list.length) % list.length].id);
}
$("#p-play").addEventListener("click", () => togglePlay());
$("#p-prev").addEventListener("click", () => (audio.currentTime > 3 ? (audio.currentTime = 0) : step(-1)));
$("#p-next").addEventListener("click", () => step(1));
$("#p-meta").addEventListener("click", () => state.current && openTrack(state.current));
$("#p-karaoke").addEventListener("click", () => state.current && openKaraoke(state.current));
$("#p-vol").addEventListener("input", (e) => (audio.volume = Number(e.target.value)));
let seeking = false;
$("#p-seek").addEventListener("input", (e) => {
  seeking = true;
  if (Number.isFinite(audio.duration)) $("#p-cur").textContent = fmtTime((e.target.value / 1000) * audio.duration);
});
$("#p-seek").addEventListener("change", (e) => {
  if (Number.isFinite(audio.duration)) audio.currentTime = (e.target.value / 1000) * audio.duration;
  seeking = false;
});
audio.addEventListener("timeupdate", () => {
  if (!seeking && Number.isFinite(audio.duration)) $("#p-seek").value = (audio.currentTime / audio.duration) * 1000 || 0;
  $("#p-cur").textContent = fmtTime(audio.currentTime);
  if (!$("#karaoke").hidden) karaokeTick();
});
audio.addEventListener("loadedmetadata", () => ($("#p-dur").textContent = fmtTime(audio.duration)));
const syncPlayState = () => {
  const playing = !audio.paused;
  $("#player").classList.toggle("playing", playing);
  $("#p-play").innerHTML = `<svg><use href="#i-${playing ? "pause" : "play"}"/></svg>`;
  $("#p-play").setAttribute("aria-label", playing ? "Pause" : "Play");
  for (const b of $$(`[data-play]`)) {
    const svg = b.querySelector("use");
    if (svg) svg.setAttribute("href", `#i-${b.dataset.play === state.current && playing ? "pause" : "play"}`);
  }
};
audio.addEventListener("play", syncPlayState);
audio.addEventListener("pause", syncPlayState);
audio.addEventListener("ended", () => step(1));
audio.addEventListener("error", () => {
  const fb = audio.dataset.fallback;
  if (fb && audio.src !== fb) {
    audio.dataset.fallback = "";
    audio.src = fb;
    audio.play().catch(() => {});
  } else if (state.current) toast("Couldn't load that audio. Links expire after about 15 days.", { type: "error" });
});
if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
  navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
}

// ============================================================================
// Karaoke (timestamped lyrics)
// ============================================================================
const alignedCache = new Map();
let kWords = [];
let kIdx = -1;
let kWave = null;

async function openKaraoke(id) {
  const t = S.getTrack(id);
  if (!t) return;
  if (state.current !== id) playTrack(id);
  const k = $("#karaoke");
  k.hidden = false;
  $("#k-title").textContent = t.title;
  $("#k-tags").textContent = t.tags || "";
  $("#k-bg").style.backgroundImage = t.image ? cssUrl(t.image) : "";
  const box = $("#k-lyrics");
  kWords = [];
  kIdx = -1;
  kWave = null;
  drawWave();
  box.innerHTML = `<p class="k-msg"><span class="spinner"></span> Syncing lyrics…</p>`;
  try {
    let d = alignedCache.get(id);
    if (!d) {
      d = await api.timestampedLyrics(t.taskId, t.id);
      alignedCache.set(id, d);
    }
    if (state.current !== id) return;
    kWave = d?.waveformData || null;
    const words = d?.alignedWords || [];
    if (!words.length) throw new Error("empty");
    box.replaceChildren();
    words.forEach((w, i) => {
      for (const part of String(w.word).split(/(\[[^\]]*\]|\n)/)) {
        if (!part) continue;
        if (part === "\n") box.append(document.createElement("br"));
        else if (/^\[.*\]$/.test(part)) {
          const s = document.createElement("span");
          s.className = "sec";
          s.textContent = part.slice(1, -1);
          box.append(s);
        } else {
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          s.dataset.i = i;
          box.append(s, " ");
          kWords.push({ el: s, start: w.startS, end: w.endS });
        }
      }
    });
    drawWave();
  } catch (e) {
    if (e.code === 401) return showGate(e.message);
    box.innerHTML = t.lyrics
      ? `<p class="k-msg">Synced timing isn't available for this take, but here are the words:</p><pre style="white-space:pre-wrap;font:inherit">${esc(t.lyrics)}</pre>`
      : `<p class="k-msg">No lyrics to sing along to. This one might be instrumental. 🎶</p>`;
  }
}
function karaokeTick() {
  const now = audio.currentTime;
  let idx = -1;
  for (let i = 0; i < kWords.length; i++) {
    if (kWords[i].start <= now) idx = i;
    else break;
  }
  if (idx !== kIdx) {
    kWords.forEach((w, i) => {
      w.el.classList.toggle("past", i < idx);
      w.el.classList.toggle("now", i === idx);
    });
    const cur = kWords[idx]?.el;
    const prev = kWords[kIdx]?.el;
    if (cur && (!prev || cur.offsetTop !== prev.offsetTop)) cur.scrollIntoView({ block: "center", behavior: "smooth" });
    kIdx = idx;
  }
  drawWave();
}
function drawWave() {
  const c = $("#k-wave");
  const w = (c.width = c.clientWidth * devicePixelRatio);
  const h = (c.height = 64 * devicePixelRatio);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  const data = kWave?.length ? kWave : null;
  const bars = Math.max(20, Math.floor(w / (5 * devicePixelRatio)));
  const prog = Number.isFinite(audio.duration) ? audio.currentTime / audio.duration : 0;
  const bw = w / bars;
  for (let i = 0; i < bars; i++) {
    const v = data ? Math.abs(data[Math.floor((i / bars) * data.length)] || 0) : 0.15 + 0.1 * Math.sin(i / 3);
    const bh = Math.max(2, Math.min(1, v) * h * 0.9);
    ctx.fillStyle = i / bars < prog ? "#f472b6" : "rgba(255,255,255,.25)";
    ctx.fillRect(i * bw + 1, (h - bh) / 2, Math.max(1, bw - 2 * devicePixelRatio), bh);
  }
}
$("#k-wave").addEventListener("click", (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  if (Number.isFinite(audio.duration)) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
});
$("#k-close").addEventListener("click", () => ($("#karaoke").hidden = true));

// ============================================================================
// Settings (key button)
// ============================================================================
$("#key-btn").addEventListener("click", () => {
  const key = S.loadKey();
  const personas = S.getPersonas();
  const body = html`<div class="form">
    <div class="field"><span class="label">Theme</span><div class="theme-switch" role="radiogroup" aria-label="Theme"></div></div>
    <div class="field"><span class="label">API key</span><div class="ids">${esc(key.slice(0, 4))}••••••••${esc(key.slice(-4))}</div>
      <div class="row-actions" style="justify-content:flex-start"><button class="btn btn-sm" data-change>Use a different key</button><button class="btn btn-sm btn-danger" data-forget>Forget key &amp; lock</button></div></div>
    <div class="field"><span class="label">Saved personas</span>
      ${personas.length ? personas.map((p) => `<div class="extra"><b>${esc(p.name)}</b><span class="ids" style="flex:1">${esc(p.personaId)}</span><button class="btn btn-sm btn-ghost" data-rmp="${esc(p.personaId)}">Remove</button></div>`).join("") : `<span class="hint">None yet. Open a track and choose “Save persona”.</span>`}</div>
    <div class="field"><span class="label">Callback URL</span><span class="ids">${esc(callbackUrl())}</span><span class="hint">SunoAPI requires one. Hookline polls for results, so this just acknowledges and discards.</span></div>
    <div class="field"><span class="label">Library</span><span class="hint">${S.getTracks().length} tracks stored in this browser.</span>
      <div class="row-actions" style="justify-content:flex-start"><button class="btn btn-sm btn-ghost btn-danger" data-clear>Clear library</button></div></div>
    <p class="hint">Docs: <a href="https://docs.sunoapi.org" target="_blank" rel="noopener">docs.sunoapi.org</a> · Manage keys and credits at <a href="https://sunoapi.org/api-key" target="_blank" rel="noopener">sunoapi.org</a></p>
  </div>`;
  openModal({ title: "Settings", body });
  renderThemeSwitches();
  body.querySelector("[data-change]").addEventListener("click", () => { closeModal(); showGate(); });
  body.querySelector("[data-forget]").addEventListener("click", () => {
    S.forgetKey();
    setApiKey("");
    closeModal();
    showGate("Key forgotten. Paste one to jump back in.");
  });
  body.querySelector("[data-clear]").addEventListener("click", () => {
    if (!confirm("Clear every track from this browser's library?")) return;
    S.getTracks().slice().forEach((t) => S.removeTrack(t.id));
    audio.pause();
    $("#player").hidden = true;
    state.current = null;
    closeModal();
  });
  body.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rmp]");
    if (b) { S.removePersona(b.dataset.rmp); b.closest(".extra").remove(); }
  });
});

// ============================================================================
// Keyboard shortcuts
// ============================================================================
document.addEventListener("keydown", (e) => {
  const typing = e.target.closest("input, textarea, select, [contenteditable]");
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !$("#app").hidden) {
    if (state.view === "create") { e.preventDefault(); $("#create-form").requestSubmit(); }
    if (state.view === "lyrics") { e.preventDefault(); $("#lyrics-form").requestSubmit(); }
  }
  if (e.key === "Escape" && !$("#karaoke").hidden) $("#karaoke").hidden = true;
  if (e.code === "Space" && !typing && !e.target.closest("button") && state.current && !$("#app").hidden) {
    e.preventDefault();
    togglePlay();
  }
});

// ============================================================================
// Boot
// ============================================================================
function boot() {
  initModal();
  renderThemeSwitches();
  renderModels();
  setMode(state.mode);
  renderChips();
  renderAttachments();
  renderPersonaOptions();
  renderLyricDrafts();
  renderRemixModes();
  renderRemix();
  renderSounds();
  // Drop finished jobs older than a day so the monitor stays tidy.
  S.getJobs().filter((j) => j.state !== "running" && Date.now() - (j.finishedAt || j.createdAt) > 86400000).forEach((j) => S.removeJob(j.id));
  renderJobs();
  renderLibrary();

  const key = S.loadKey();
  if (!key) return showGate();
  setApiKey(key);
  showApp();
  resumeJobs();
  refreshCredits();
}
boot();
