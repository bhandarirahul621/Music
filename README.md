# Hookline: AI song studio

A single-page web app for creating, remixing and polishing AI music with your own
[SunoAPI](https://docs.sunoapi.org) key. It's plain HTML, CSS and JavaScript with no build step,
and it's ready to deploy on Netlify.

## What you can do

| Area | Features (SunoAPI endpoint) |
| --- | --- |
| **Create** | Simple mode: describe a song, add style chips, and optionally attach reference audio, images or video (`/generate`, `customMode: false`). Custom mode: title, style, lyrics with section tags, vocal gender, exclude styles, target length, style weight, weirdness, audio weight, variety, and personas (`/generate`, `customMode: true`). **Boost style** (`/style/generate`). |
| **Models** | V6 (default), V6 Wild, V6 Mini, plus legacy V4 to V5.5 behind a toggle. |
| **Lyrics Lab** | Draft full lyrics from a theme (`/lyrics`), then send a draft to Custom mode with one click. |
| **Remix** | Restyle an upload (`/generate/upload-cover`), continue it (`/generate/upload-extend`), add a band (`/generate/add-instrumental`), add vocals (`/generate/add-vocals`), or blend two tracks (`/generate/mashup`). Audio comes from a file upload (File Upload API), your library, or a URL. |
| **Sound FX** | Loops and one-shots with loop, BPM and key controls (`/generate/sounds`). |
| **Per-track tools** | Extend (`/generate/extend`), replace a section (`/generate/replace-section`), karaoke with synced lyrics and waveform (`/generate/get-timestamped-lyrics`), stems (`/vocal-removal/generate`), WAV (`/wav/generate`), music video (`/mp4/generate`), AI cover art (`/suno/cover/generate`), and save as persona (`/generate/generate-persona`). |
| **Account** | Key gate that validates against the credit balance (`/generate/credit`), a live credits pill, and settings. |
| **Experience** | Light, dark and system themes. A live "studio monitor" shows progress (queued → lyrics → first take → done) and lets you listen early once the first take is streaming. Also: confetti, browser notifications, a persistent player with Media Session controls, favorites, search, and keyboard shortcuts (<kbd>Ctrl/⌘ + Enter</kbd> generates, <kbd>Space</kbd> plays or pauses). |

## How it works

- **Your key stays in your browser.** It's kept in `sessionStorage`, or in `localStorage` if you tick
  "Remember". The browser attaches it to each request as `Authorization: Bearer …`.
- **No CORS headaches.** `netlify.toml` proxies `/proxy/suno/*` → `https://api.sunoapi.org/*` and
  `/proxy/upload/*` → `https://sunoapiorg.redpandaai.co/*`. If the proxy isn't available (for example
  on a plain local server), the app falls back to calling SunoAPI directly.
- **Polling instead of webhooks.** SunoAPI requires a `callBackUrl`, so the app points it at a tiny
  Netlify Function (`netlify/functions/suno-callback.mjs`) that just returns 200. Results are fetched
  by polling the `record-info` endpoints. In-flight jobs are saved, so a page reload resumes them.
- **Library** metadata lives in `localStorage`. SunoAPI keeps generated files for about 15 days
  (uploads for 3), so download the tracks you want to keep.

## Deploy on Netlify

1. Connect this repository in Netlify ("Add new site" → "Import an existing project").
2. Build settings are read from `netlify.toml`: no build command, publish directory `public`, and
   functions in `netlify/functions`.
3. Deploy, open the site, paste your key from <https://sunoapi.org/api-key>, and start making songs.

## Run locally

```bash
npx netlify-cli dev          # full experience, including proxy and callback function
# or
python3 -m http.server -d public 8080   # static only; the app calls SunoAPI directly
```

## Project layout

```
public/
  index.html              app shell and markup
  assets/css/styles.css   design tokens (light/dark), layout, components
  assets/js/app.js        UI wiring: views, forms, library, player, karaoke
  assets/js/api.js        SunoAPI client (proxy with fallback, error mapping)
  assets/js/jobs.js       polling engine for every async task type
  assets/js/store.js      localStorage persistence and events
  assets/js/ui.js         DOM helpers, toasts, modal, form builder
  assets/js/data.js       models, chips, stems, keys, copy
netlify/functions/suno-callback.mjs
netlify.toml
```
