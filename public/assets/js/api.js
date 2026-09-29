// Thin client for SunoAPI (https://docs.sunoapi.org).
// Every generation endpoint is asynchronous: POST returns a taskId, then we poll a record-info endpoint.

import { ERROR_CODES } from "./data.js";

const DIRECT = { suno: "https://api.sunoapi.org", upload: "https://sunoapiorg.redpandaai.co" };
const PROXY = { suno: "/proxy/suno", upload: "/proxy/upload" };

// Try the same-origin Netlify proxy first (no CORS issues). If it isn't there
// (e.g. a plain local static server), fall back to calling SunoAPI directly.
let proxyWorks = location.protocol.startsWith("http") ? null : false;

let apiKey = "";
export const setApiKey = (k) => { apiKey = k || ""; };

export class ApiError extends Error {
  constructor(message, code, data) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

export function callbackUrl() {
  const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
  if (location.protocol === "https:" && !local) return `${location.origin}/.netlify/functions/suno-callback`;
  return "https://example.com/suno-callback";
}

async function send(base, path, { method, body, form, key }) {
  const headers = { Authorization: `Bearer ${key}` };
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(base + path, { method, headers, body: payload });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error(`Non-JSON response (${res.status})`);
    err.nonJson = true;
    throw err;
  }
}

async function request(service, path, { method = "GET", body, form, key = apiKey } = {}) {
  if (!key) throw new ApiError("Add your SunoAPI key first.", 401);
  let json;
  const attempts = proxyWorks === false ? [DIRECT] : [PROXY, DIRECT];
  let lastErr;
  for (const base of attempts) {
    try {
      json = await send(base[service], path, { method, body, form, key });
      if (base === PROXY) proxyWorks = true;
      break;
    } catch (e) {
      lastErr = e;
      if (base === PROXY && proxyWorks !== true) { proxyWorks = false; continue; }
      break;
    }
  }
  if (!json) throw new ApiError(`Couldn't reach SunoAPI. ${lastErr?.message || "Check your connection."}`, 0);
  const code = Number(json.code);
  if (code !== 200) {
    const friendly = ERROR_CODES[code];
    const msg = json.msg && json.msg !== "success" ? json.msg : "";
    throw new ApiError([friendly, msg && msg !== friendly ? `(${msg})` : ""].filter(Boolean).join(" ") || `Request failed (${code})`, code, json.data);
  }
  return json.data;
}

const post = (path, body) => request("suno", path, { method: "POST", body: { callBackUrl: callbackUrl(), ...body } });
const get = (path, params) => request("suno", `${path}?${new URLSearchParams(params)}`);
const taskOf = (d) => d?.taskId;

// Drop empty strings / undefined / NaN so we never send fields the API didn't ask for.
export function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "" || (typeof v === "number" && Number.isNaN(v))) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export const api = {
  credits: (key) => request("suno", "/api/v1/generate/credit", { key }),

  // Music creation (all polled through musicInfo)
  generate: (b) => post("/api/v1/generate", clean(b)).then(taskOf),
  extend: (b) => post("/api/v1/generate/extend", clean(b)).then(taskOf),
  uploadCover: (b) => post("/api/v1/generate/upload-cover", clean(b)).then(taskOf),
  uploadExtend: (b) => post("/api/v1/generate/upload-extend", clean(b)).then(taskOf),
  addInstrumental: (b) => post("/api/v1/generate/add-instrumental", clean(b)).then(taskOf),
  addVocals: (b) => post("/api/v1/generate/add-vocals", clean(b)).then(taskOf),
  mashup: (b) => post("/api/v1/generate/mashup", clean(b)).then(taskOf),
  replaceSection: (b) => post("/api/v1/generate/replace-section", clean(b)).then(taskOf),
  sounds: (b) => post("/api/v1/generate/sounds", clean(b)).then(taskOf),
  musicInfo: (taskId) => get("/api/v1/generate/record-info", { taskId }),

  // Words
  lyrics: (prompt) => post("/api/v1/lyrics", { prompt }).then(taskOf),
  lyricsInfo: (taskId) => get("/api/v1/lyrics/record-info", { taskId }),
  boostStyle: (content) => request("suno", "/api/v1/style/generate", { method: "POST", body: { content } }),
  timestampedLyrics: (taskId, audioId) =>
    request("suno", "/api/v1/generate/get-timestamped-lyrics", { method: "POST", body: { taskId, audioId } }),

  // Post-production
  wav: (taskId, audioId) => post("/api/v1/wav/generate", { taskId, audioId }).then(taskOf),
  wavInfo: (taskId) => get("/api/v1/wav/record-info", { taskId }),
  stems: (b) => post("/api/v1/vocal-removal/generate", clean(b)).then(taskOf),
  stemsInfo: (taskId) => get("/api/v1/vocal-removal/record-info", { taskId }),
  video: (b) => post("/api/v1/mp4/generate", clean(b)).then(taskOf),
  videoInfo: (taskId) => get("/api/v1/mp4/record-info", { taskId }),
  async coverArt(taskId) {
    try {
      return await post("/api/v1/suno/cover/generate", { taskId }).then(taskOf);
    } catch (e) {
      // A task can only get cover art once; the API answers 400 with the existing taskId.
      if (e.data?.taskId) return e.data.taskId;
      throw e;
    }
  },
  coverArtInfo: (taskId) => get("/api/v1/suno/cover/record-info", { taskId }),
  persona: (b) => request("suno", "/api/v1/generate/generate-persona", { method: "POST", body: clean(b) }),

  // Temporary file hosting (files expire after 3 days) so uploads can be fed to the remix endpoints.
  async upload(file) {
    const form = new FormData();
    form.append("file", file);
    form.append("uploadPath", "hookline");
    const safe = file.name.replace(/[^\w.-]+/g, "_");
    form.append("fileName", `${Date.now()}-${safe}`);
    const data = await request("upload", "/api/file-stream-upload", { method: "POST", form });
    const url = data?.downloadUrl || data?.fileUrl;
    if (!url) throw new ApiError("Upload finished but no file URL came back.", 500);
    return url;
  },
};
