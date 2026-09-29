// DOM helpers: query, escaping, toasts, modal, confetti, form builder.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function html(strings, ...vals) {
  const tpl = document.createElement("template");
  tpl.innerHTML = strings.reduce((acc, s, i) => acc + s + (i < vals.length ? vals[i] : ""), "").trim();
  return tpl.content.firstElementChild;
}

export const fmtTime = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export const ago = (ts) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- Toasts ---------------------------------------------------------------
export function toast(message, { type = "info", action, timeout = 5000 } = {}) {
  const host = $("#toasts");
  const el = html`<div class="toast toast-${type}" role="status"><span>${esc(message)}</span></div>`;
  if (action) {
    const b = html`<button class="btn btn-sm btn-ghost">${esc(action.label)}</button>`;
    b.addEventListener("click", () => {
      action.onClick();
      el.remove();
    });
    el.append(b);
  }
  const x = html`<button class="toast-x" aria-label="Dismiss">×</button>`;
  x.addEventListener("click", () => el.remove());
  el.append(x);
  host.append(el);
  while (host.children.length > 4) host.firstElementChild.remove();
  if (timeout) setTimeout(() => el.classList.add("out"), timeout);
  if (timeout) setTimeout(() => el.remove(), timeout + 400);
}

// ---- Modal ------------------------------------------------------------------
export function openModal({ title, body, wide = false, onClose }) {
  const dlg = $("#modal");
  dlg.classList.toggle("wide", wide);
  $("#modal-title").textContent = title;
  const b = $("#modal-body");
  b.replaceChildren();
  if (typeof body === "string") b.innerHTML = body;
  else if (body) b.append(body);
  dlg._onClose = onClose;
  if (!dlg.open) dlg.showModal();
  return b;
}
export function closeModal() {
  const dlg = $("#modal");
  if (dlg.open) dlg.close();
}
export function initModal() {
  const dlg = $("#modal");
  $("#modal-close").addEventListener("click", closeModal);
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) closeModal();
  });
  dlg.addEventListener("close", () => {
    dlg._onClose?.();
    dlg._onClose = null;
  });
}

// ---- Confetti ---------------------------------------------------------------
export function confetti() {
  if (reducedMotion()) return;
  const host = document.createElement("div");
  host.className = "confetti";
  const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.setProperty("--x", `${Math.random() * 100}vw`);
    p.style.setProperty("--dx", `${(Math.random() - 0.5) * 30}vw`);
    p.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    p.style.setProperty("--d", `${1.4 + Math.random() * 1.2}s`);
    p.style.setProperty("--delay", `${Math.random() * 0.3}s`);
    p.style.background = colors[i % colors.length];
    host.append(p);
  }
  document.body.append(host);
  setTimeout(() => host.remove(), 3200);
}

// ---- Downloads ---------------------------------------------------------------
export async function download(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch {
    // Cross-origin without CORS: open it and let the browser handle saving.
    window.open(url, "_blank", "noopener");
  }
}

export async function copy(text, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast(label, { type: "ok", timeout: 2000 });
  } catch {
    toast("Couldn't access the clipboard.", { type: "warn" });
  }
}

export const slug = (s) => (s || "track").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").slice(0, 60);

// ---- Declarative form builder ---------------------------------------------------
// Used for the remix, sounds and track-action forms so every form looks and behaves the same.
//
// field: { name, label, type: text|textarea|select|toggle|range|segmented|number|chips|html,
//          placeholder, maxlength, required, options, min, max, step, hint, optional, rows,
//          show: (values) => boolean, value, format }
export function buildForm(fields, { onChange } = {}) {
  const el = document.createElement("div");
  el.className = "form";
  const refs = {};

  for (const f of fields) {
    const id = `f-${f.name}-${Math.random().toString(36).slice(2, 7)}`;
    let row;
    switch (f.type) {
      case "html":
        row = html`<div class="field">${f.html}</div>`;
        break;
      case "textarea":
        row = html`<label class="field"><span class="label">${esc(f.label)}${f.required ? ' <em class="req">*</em>' : ""}</span>
          <textarea id="${id}" rows="${f.rows || 4}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ""} placeholder="${esc(f.placeholder || "")}">${esc(f.value || "")}</textarea>
          ${f.maxlength ? `<span class="counter" data-for="${id}">0 / ${f.maxlength}</span>` : ""}
          ${f.hint ? `<span class="hint">${f.hint}</span>` : ""}</label>`;
        break;
      case "select":
        row = html`<label class="field"><span class="label">${esc(f.label)}</span>
          <select id="${id}">${f.options.map((o) => {
            const [v, l] = Array.isArray(o) ? o : [o, o];
            return `<option value="${esc(v)}" ${String(f.value) === String(v) ? "selected" : ""}>${esc(l)}</option>`;
          }).join("")}</select>${f.hint ? `<span class="hint">${f.hint}</span>` : ""}</label>`;
        break;
      case "toggle":
        row = html`<label class="field field-inline switch"><input type="checkbox" id="${id}" ${f.value ? "checked" : ""}/><span class="track-ui"></span><span class="label">${esc(f.label)}</span>${f.hint ? `<span class="hint">${f.hint}</span>` : ""}</label>`;
        break;
      case "segmented":
        row = html`<div class="field"><span class="label">${esc(f.label)}</span><div class="segmented" role="radiogroup" id="${id}">
          ${f.options.map(([v, l]) => `<button type="button" role="radio" data-v="${esc(v)}" aria-checked="${String(f.value ?? f.options[0][0]) === String(v)}">${esc(l)}</button>`).join("")}
          </div>${f.hint ? `<span class="hint">${f.hint}</span>` : ""}</div>`;
        break;
      case "range": {
        const v = f.value ?? f.min;
        row = html`<div class="field range-field">
          <div class="range-head">${f.optional ? `<label class="mini-switch"><input type="checkbox" data-enable ${f.enabled ? "checked" : ""}/> <span class="label">${esc(f.label)}</span></label>` : `<span class="label">${esc(f.label)}</span>`}
          <output>${f.format ? f.format(v) : v}</output></div>
          <input type="range" id="${id}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${v}" ${f.optional && !f.enabled ? "disabled" : ""}/>
          ${f.hint ? `<span class="hint">${f.hint}</span>` : ""}</div>`;
        break;
      }
      case "number":
        row = html`<label class="field"><span class="label">${esc(f.label)}${f.required ? ' <em class="req">*</em>' : ""}</span>
          <input type="number" id="${id}" min="${f.min ?? ""}" max="${f.max ?? ""}" step="${f.step || "any"}" value="${f.value ?? ""}" placeholder="${esc(f.placeholder || "")}"/>
          ${f.hint ? `<span class="hint">${f.hint}</span>` : ""}</label>`;
        break;
      default:
        row = html`<label class="field"><span class="label">${esc(f.label)}${f.required ? ' <em class="req">*</em>' : ""}</span>
          <input type="text" id="${id}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ""} placeholder="${esc(f.placeholder || "")}" value="${esc(f.value || "")}"/>
          ${f.hint ? `<span class="hint">${f.hint}</span>` : ""}</label>`;
    }
    row.dataset.name = f.name;
    el.append(row);
    refs[f.name] = { f, row, input: row.querySelector(`#${id}`) };
  }

  const get = () => {
    const out = {};
    for (const [name, { f, row, input }] of Object.entries(refs)) {
      if (f.type === "html") continue;
      if (row.hidden) continue;
      if (f.type === "toggle") out[name] = input.checked;
      else if (f.type === "segmented") out[name] = input.querySelector('[aria-checked="true"]')?.dataset.v ?? "";
      else if (f.type === "range") {
        const en = row.querySelector("[data-enable]");
        out[name] = en && !en.checked ? undefined : Number(input.value);
      } else if (f.type === "number") out[name] = input.value === "" ? undefined : Number(input.value);
      else out[name] = input.value.trim();
    }
    return out;
  };

  const refresh = () => {
    const vals = get();
    for (const { f, row } of Object.values(refs)) if (f.show) row.hidden = !f.show({ ...vals, ...getAll() });
    for (const c of el.querySelectorAll(".counter")) {
      const t = el.querySelector(`#${c.dataset.for}`);
      c.textContent = `${t.value.length} / ${t.maxLength}`;
    }
    onChange?.(get());
  };
  // Values of every field regardless of visibility (used for show() predicates).
  const getAll = () => {
    const out = {};
    for (const [name, { f, input }] of Object.entries(refs)) {
      if (f.type === "toggle") out[name] = input.checked;
      else if (f.type === "segmented") out[name] = input.querySelector('[aria-checked="true"]')?.dataset.v ?? "";
      else if (input) out[name] = input.value;
    }
    return out;
  };

  el.addEventListener("input", (e) => {
    const rf = e.target.closest(".range-field");
    if (rf && e.target.type === "range") {
      const f = refs[rf.dataset.name].f;
      rf.querySelector("output").textContent = f.format ? f.format(Number(e.target.value)) : e.target.value;
    }
    if (e.target.matches("[data-enable]")) e.target.closest(".range-field").querySelector("input[type=range]").disabled = !e.target.checked;
    refresh();
  });
  el.addEventListener("click", (e) => {
    const b = e.target.closest(".segmented [role=radio]");
    if (!b) return;
    b.parentElement.querySelectorAll("[role=radio]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    refresh();
  });

  const set = (name, value) => {
    const r = refs[name];
    if (!r) return;
    if (r.f.type === "toggle") r.input.checked = !!value;
    else if (r.f.type === "segmented") r.input.querySelectorAll("[role=radio]").forEach((x) => x.setAttribute("aria-checked", String(x.dataset.v === String(value))));
    else r.input.value = value ?? "";
    refresh();
  };

  const validate = () => {
    const vals = get();
    for (const { f, row, input } of Object.values(refs)) {
      if (!f.required || row.hidden) continue;
      if (vals[f.name] === undefined || vals[f.name] === "") {
        input?.focus();
        return `${f.label} is required.`;
      }
    }
    return null;
  };

  queueMicrotask(refresh);
  return { el, get, set, validate, refs, refresh };
}

// Shared "fine-tuning" controls supported by most generation endpoints.
export const advancedFields = ({ withVariety = true } = {}) => [
  { name: "styleWeight", label: "Style adherence", type: "range", min: 0, max: 1, step: 0.01, value: 0.65, optional: true, format: (v) => v.toFixed(2), hint: "How strictly to follow your style tags." },
  { name: "weirdnessConstraint", label: "Weirdness", type: "range", min: 0, max: 1, step: 0.01, value: 0.5, optional: true, format: (v) => v.toFixed(2), hint: "Higher = more experimental." },
  { name: "audioWeight", label: "Audio weight", type: "range", min: 0, max: 1, step: 0.01, value: 0.65, optional: true, format: (v) => v.toFixed(2), hint: "Balance between reference audio and your prompt (vocal tracks only)." },
  ...(withVariety
    ? [{ name: "variety", label: "Variety", type: "range", min: 0, max: 4, step: 1, value: 1, optional: true, format: (v) => ["Off", "Normal", "High", "Extra", "Max"][v], hint: "How different the two results are from each other." }]
    : []),
];
