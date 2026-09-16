# Psychetude
A brain wave sonification instrument.

### Etymology
from *psyche* (mind) + *étude* (study)

Real EEG band power is mapped to musical parameters using Fast Fourier Transforms (FFTs)
and played through a clickable, rotatable 3D brain model in the browser.

## What it does

1. Real EEG recordings are preprocessed and FFT'd into canonical frequency
   bands (delta, theta, alpha, beta, gamma) per electrode.
2. Band power is mapped to pitch, timbre, and dynamics using a log-frequency
   scheme grounded in the sonification literature — see `docs/mapping.md`.
3. The browser renders a 3D brain; clicking an electrode triggers that
   region's "voice" through Tone.js.

## Why

Most EEG sonification demos hand-wave the mapping step. Psychetude treats the
band-power → sound mapping as a first-class design problem and documents it,
so the result is a small instrument. Interactivity and accessibility are also priorities; anyone can 'play' the brain.

## Structure

- `pipeline/` — Python. Loads EEG (MNE), FFTs to band power, exports JSON.
- `web/` — Vite + Three.js + Tone.js front-end.
- `docs/` — design notes, especially the sonification mapping.

## Status

Early build. Phases 0–4 (data → JSON) and 5–6 (brain → sound) are scaffolded.

## Getting started

### Pipeline

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Place a raw .fif in pipeline/data/raw/, then:
python scripts/run_pipeline.py
