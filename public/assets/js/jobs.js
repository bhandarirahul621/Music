// Polls SunoAPI record-info endpoints for every in-flight task and turns results into library items.

import { api } from "./api.js";
import { getJobs, saveJobs, addJob, upsertTracks, patchTrack, patchTracksByTask, addLyricDrafts, emit, getTrack } from "./store.js";

const TIMEOUT_MS = 20 * 60 * 1000;
const FAILED = /FAIL|ERROR|SENSITIVE/;

const flagDone = (f) => f === "SUCCESS" || f === 1 || f === "1";
const flagPending = (f) => f === "PENDING" || f === 0 || f === "0" || f == null;

// kind -> { info(taskId), parse(data, job) -> { state: running|done|failed, stage?, error?, apply?() } }
const KINDS = {
  music: {
    info: (id) => api.musicInfo(id),
    parse(d, job) {
      const s = d?.status || "PENDING";
      const list = d?.response?.sunoData || [];
      const tracks = list.map((x) => toTrack(x, job, s !== "SUCCESS"));
      const apply = () => tracks.length && upsertTracks(tracks);
      if (s === "SUCCESS" || (s === "CALLBACK_EXCEPTION" && list.some((x) => x.audio_url))) {
        return { state: "done", stage: 3, apply: () => { upsertTracks(tracks.map((t) => ({ ...t, pending: false }))); }, count: tracks.length };
      }
      if (FAILED.test(s) || s === "CALLBACK_EXCEPTION") {
        const msg = s === "SENSITIVE_WORD_ERROR" ? "Your prompt tripped the content filter. Try rewording it." : d?.errorMessage || s.replace(/_/g, " ").toLowerCase();
        return { state: "failed", error: msg };
      }
      const stage = { PENDING: 0, TEXT_SUCCESS: 1, FIRST_SUCCESS: 2 }[s] ?? 0;
      return { state: "running", stage, apply };
    },
  },
  lyrics: {
    info: (id) => api.lyricsInfo(id),
    parse(d, job) {
      const s = d?.status || "PENDING";
      if (s === "SUCCESS" || (s === "CALLBACK_EXCEPTION" && d?.response?.data?.length)) {
        const items = (d.response?.data || []).filter((x) => x.status !== "failed" && x.text);
        return { state: "done", apply: () => addLyricDrafts(job.meta.prompt, items.map((x) => ({ title: x.title, text: x.text }))), count: items.length };
      }
      if (FAILED.test(s) || s === "CALLBACK_EXCEPTION") return { state: "failed", error: d?.errorMessage || "Lyrics generation failed." };
      return { state: "running" };
    },
  },
  wav: flagKind((id) => api.wavInfo(id), (r, job) => r?.audioWavUrl && (() => patchTrack(job.meta.audioId, { extras: { wav: r.audioWavUrl } }))),
  video: flagKind((id) => api.videoInfo(id), (r, job) => r?.videoUrl && (() => patchTrack(job.meta.audioId, { extras: { video: r.videoUrl } }))),
  stems: flagKind((id) => api.stemsInfo(id), (r, job) => r && (() => patchTrack(job.meta.audioId, { extras: { stems: stemsFrom(r), stemsType: job.meta.type } }))),
  cover: flagKind((id) => api.coverArtInfo(id), (r, job) => r?.images?.length && (() => patchTracksByTask(job.meta.taskId, { extras: { covers: r.images } }))),
};

function flagKind(info, applyFrom) {
  return {
    info,
    parse(d, job) {
      const f = d?.successFlag;
      const apply = applyFrom(d?.response, job);
      if (flagDone(f) || (f === "CALLBACK_EXCEPTION" && apply)) return { state: "done", apply: apply || undefined };
      if (flagPending(f)) return { state: "running" };
      return { state: "failed", error: d?.errorMessage || String(f).replace(/_/g, " ").toLowerCase() };
    },
  };
}

function stemsFrom(r) {
  const named = [
    ["Vocals", r.vocalUrl], ["Instrumental", r.instrumentalUrl], ["Backing vocals", r.backingVocalsUrl], ["Drums", r.drumsUrl],
    ["Bass", r.bassUrl], ["Guitar", r.guitarUrl], ["Keyboard", r.keyboardUrl], ["Percussion", r.percussionUrl], ["Strings", r.stringsUrl],
    ["Synth", r.synthUrl], ["FX", r.fxUrl], ["Brass", r.brassUrl], ["Woodwinds", r.woodwindsUrl],
  ].filter(([, u]) => u).map(([name, url]) => ({ name, url }));
  if (named.length) return named;
  return (r.originData || []).filter((x) => x.audio_url).map((x) => ({ name: x.stem_type_group_name || "Stem", url: x.audio_url }));
}

function toTrack(x, job, pending) {
  const prev = getTrack(x.id);
  return {
    id: x.id,
    taskId: job.id,
    title: x.title || job.meta.title || "Untitled",
    tags: x.tags || "",
    lyrics: x.prompt || "",
    image: x.image_url || x.source_image_url || prev?.image || "",
    audio: x.audio_url || x.source_audio_url || "",
    stream: x.stream_audio_url || x.source_stream_audio_url || "",
    duration: x.duration || prev?.duration || 0,
    model: x.model_name || job.meta.model || "",
    kind: job.meta.op || "generate",
    createdAt: prev?.createdAt || Date.now(),
    pending,
    extras: job.meta.parentTitle ? { parentTitle: job.meta.parentTitle } : {},
  };
}

// ---- Engine ------------------------------------------------------------------
let timer = null;
const inFlight = new Set();

export function startJob(kind, taskId, label, meta = {}) {
  const job = { id: taskId, kind, label, meta, state: "running", stage: 0, createdAt: Date.now(), nextAt: Date.now() + 4000 };
  addJob(job);
  ensureTicking();
  return job;
}

export function retryJob(id) {
  const job = getJobs().find((j) => j.id === id);
  if (!job) return;
  Object.assign(job, { state: "running", error: null, createdAt: Date.now(), nextAt: Date.now() });
  saveJobs();
  ensureTicking();
}

export function resumeJobs() {
  getJobs().forEach((j) => { if (j.state === "running") j.nextAt = Date.now() + 500; });
  ensureTicking();
}

function ensureTicking() {
  if (timer) return;
  timer = setInterval(tick, 1000);
}

function interval(job) {
  const age = Date.now() - job.createdAt;
  if (age < 60_000) return 5000;
  if (age < 5 * 60_000) return 8000;
  return 15000;
}

async function tick() {
  const running = getJobs().filter((j) => j.state === "running");
  if (!running.length) {
    clearInterval(timer);
    timer = null;
    return;
  }
  const now = Date.now();
  for (const job of running) {
    if (job.nextAt > now || inFlight.has(job.id)) continue;
    inFlight.add(job.id);
    poll(job).finally(() => inFlight.delete(job.id));
  }
}

async function poll(job) {
  const kind = KINDS[job.kind];
  try {
    const data = await kind.info(job.id);
    const r = kind.parse(data, job);
    r.apply?.();
    const prevStage = job.stage;
    if (r.stage != null) job.stage = r.stage;
    if (r.state === "done") {
      job.state = "done";
      job.finishedAt = Date.now();
      emit("job:done", { job, count: r.count });
    } else if (r.state === "failed") {
      job.state = "failed";
      job.error = r.error;
      emit("job:failed", job);
    } else if (Date.now() - job.createdAt > TIMEOUT_MS) {
      job.state = "stalled";
    }
    if (job.stage === 2 && prevStage < 2) emit("job:first", job);
  } catch (e) {
    // Transient errors: keep trying until the timeout. Auth errors stop immediately.
    if (e.code === 401) {
      job.state = "failed";
      job.error = e.message;
    } else if (Date.now() - job.createdAt > TIMEOUT_MS) job.state = "stalled";
    job.lastError = e.message;
  }
  job.nextAt = Date.now() + interval(job);
  saveJobs();
}
