# robustness

how psychetude behaves when data, environment, or hardware are
degraded.

robustness here means: **the system produces a coherent, faithful
output for any input, and states its confidence when it cannot.**
silence, crashes, and silent wrong answers are all failures. a
clearly-marked degraded output is not.

---

## principles

1. **never fail silently.** if a value is missing or invalid, the
   system substitutes a defensible default and, where user-visible,
   surfaces the substitution.
2. **clamp, don't wrap.** out-of-range values are clamped to the
   valid range, not wrapped or reflected. wrapping produces
   false-valid values; clamping produces honest boundary values.
3. **validate at boundaries.** every module trusts its inputs from
   upstream. validation happens at the edgesof the processing tree:
   file load, network fetch, hardware input.
5. **isolate failures.** a fault in one electrode, one frame, or one
   sound should not take down the whole system.

---

## pipeline robustness

### missing raw file

`load_raw()` raises `FileNotFoundError` with the attempted path.
the pipeline exits with a clear message rather than a traceback.

### corrupt raw file

`mne.io.read_raw_fif` raises on corrupt files. the pipeline
propagates the error with context (which file, which stage).

### empty signal

if the recording is shorter than one window length, `epoch()`
returns an empty list. `build_payload` produces a payload with
`frames: []`. the front-end treats an empty `frames` array as
"no data" and displays a status message rather than silence.

### filter failure

filtering is idempotent and generally does not fail on valid input.
if it does (e.g. sample rate too low for the requested high-pass),
mne raises; the pipeline surfaces the error.

### non-finite band power

if any band power is `NaN` or `±inf` (from a silent channel, an
overflow, or a divide-by-zero), `export.py` clamps it:

- `NaN` → 0.0
- `+inf` → `NORM_HI`
- `-inf` → `NORM_LO`

before serialization. the json payload never contains non-finite
values, because json does not support them.

### schema validation

`export.py` validates the payload before writing:

- `meta.channels` is a non-empty list of strings
- `meta.bands` maps each band name to a `[lo, hi]` pair with
  `lo < hi`
- every frame's band arrays have length equal to
  `len(meta.channels)`
- every value is a finite float

a failed validation raises before any file is written. partial or
malformed json does not reach the front-end.

---

## front-end robustness

### fetch failure

if `sample.json` fails to load (network error, 404, malformed
json), the loader falls back to an **embedded minimal sample**: a
single-frame payload with synthetic power values. the app remains
interactive; a status message indicates the fallback.

### missing meta.bands

if the payload omits `meta.bands`, the loader substitutes the
canonical five-band definitions. the app works with the substituted
definition; a status message indicates the fallback.

### frame count mismatch

if a frame's band arrays are shorter than `meta.channels`, the
loader pads with zeros to match. if longer, it truncates. the
app never index-errors on malformed frames.

### missing electrode positions

`electrodes.js` has a canonical position for each 10-20 channel. if
a channel name is unknown (e.g. from a non-standard montage), the
node is placed at a default position (on the sphere's surface, or
omitted if placing it would be visually misleading). the app never
crashes on unknown channel names.

### no brain model

if `brain.glb` is missing or fails to parse, `model.js` falls back
to a sphere. the app is fully functional on the fallback.

### audio context not started

browsers require a user gesture before audio plays. the engine
resumes the context on first click. if the context fails to resume
(unusual), the click still updates the hud, and a status message
notes that audio is unavailable.

### tone.js failure

if `tone.js` fails to load (network, cdn issue) or to initialize,
the app catches the error, disables the audio path, and keeps the
3d scene and hud functional. clicking electrodes still displays
band values; no sound plays; a status message notes the error.

### non-finite or out-of-range power in json

the loader validates each value; invalid values are replaced with
0.0 before reaching the mapping. defensive at the boundary, so the
mapping logic itself does not need per-value checks.

---

## degradation states, in order of severity

| state | cause | behavior |
|-------|-------|----------|
| full | all systems nominal | full sonification, full ui |
| audio-off | tone failure or context block | scene and hud work, no sound |
| data-synthetic | json fetch failed | full ui, fallback data, status noted |
| data-empty | no frames in json | scene works, clicks no-op, status noted |
| scene-fallback | brain.glb missing | sphere in place of brain, full function |
| fatal | unrecoverable init error | error message on page, no interaction |

the fatal state should be reachable only for programming errors, not
for environmental faults. any environment fault (missing file,
network error, blocked audio) maps to a non-fatal degradation state.

---

## testing

each degradation state has a manual test procedure:

- **audio-off**: disable tone.js in devtools, load app, click
  electrode, confirm scene and hud still respond.
- **data-synthetic**: rename sample.json, load app, confirm fallback
  with status message.
- **data-empty**: edit sample.json to have `frames: []`, load app,
  confirm click no-op with status.
- **scene-fallback**: rename brain.glb, load app, confirm sphere
  renders and electrodes attach.
- **fatal**: clear all files, load app, confirm error message (not
  blank page).

automated tests for the loader and mapping are future work.
