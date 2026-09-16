# psychetude
a brain wave sonification instrument.

### etymology
from *psyche* (mind) + *étude* (study)

real EEG band power is mapped to musical parameters using Fast Fourier Transforms (FFTs)
and played through a clickable, rotatable 3D brain model in the browser.

## what it does

1. real EEG recordings are preprocessed and FFT'd into canonical frequency
   bands (delta, theta, alpha, beta, gamma) per electrode
2. band power is mapped to pitch, timbre, and dynamics using a log-frequency
   scheme — see `docs/mapping.md`.
3. the browser renders a 3D brain; clicking an electrode triggers that
   region's "voice" through Tone.js.

## why

most EEG sonification demos hand-wave the mapping step. psychetude treats the
band-power -> sound mapping as a first-class design problem and documents it,
so the result is a small instrument. interactivity and accessibility are also 
priorities; anyone can 'play' the brain

this is also a personal project linking my interest in music, programming and
neuroscience. for neuroscience as a discipline to become more accessible to
the general public through something as profound as music is my goal

## structure

- `pipeline/` — python. loads EEG (MNE), FFTs to band power, exports JSON
- `web/` — vite + Three.js + Tone.js front-end
- `docs/` — design notes, especially the sonification mapping

## status

early build. phases 0–4 (data → JSON) and 5–6 (brain → sound) are scaffolded

## getting started

### pipeline

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# place a raw .fif in pipeline/data/raw/, then:
python scripts/run_pipeline.py
