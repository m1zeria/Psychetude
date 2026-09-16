# rationale

why psychetude exists, and what it is trying to do.

---

## why sonification

most data representations are visual. for eeg specifically, the
visual vocabulary is mature — topomaps, spectrograms, erp
waveforms. these are powerful for researchers and opaque to
everyone else.

sonification offers a different affordance: it is temporal by
nature, and it can be perceived pre-attentively (you hear a change
in pitch before you consciously register it). for data that is
itself temporal — brain activity — this is a natural match.

---

## why this dataset

the pipeline targets pre-cleaned, publicly available eeg (initially
physionet's motor movement/imagery database, later others). cleaned
data means the mapping can be evaluated without the confound of
artifact removal being part of the pipeline. artifact handling is a
legitimate research problem; it is not the one this project is
about.

live neurofeedback, when added, will handle artifacts differently —
because real time does not permit the same cleanup. this tradeoff
is documented in `limitations.md`.

---

## why these bands

delta, theta, alpha, beta, gamma are the canonical decomposition
of eeg into functionally meaningful ranges. using them is the 
standard vocabulary, and using it makes the project legible to 
anyone with any eeg exposure.

alternatives considered:
- individual alpha frequency (iaf) as a personal band. more
  physiologically faithful but requires per-subject calibration.
- broader bands (slow / fast). simpler but less informative.
- empirical decomposition (ica, pca). richer but not interpretable.

the canonical bands win on interpretability for a general audience.

---

## why a five-note chord

each of the five bands contributes one note. this means:

- the full spectrum is heard in one gesture (one click)
- the interval structure of the chord encodes the spectral profile
- a listener hears "which bands are active" without extra ui

the alternative — one band per click — was considered and rejected
because it obscures the relationship between bands, which is the
most informative part of the signal.

---

## why two modes

aesthetic mode (octave-snapped, tuned timbre) and raw mode
(unsnapped, minimal timbre) offer different tradeoffs between
legibility and fidelity.

offering both, rather than choosing one, is the mature design move:
- a first-time user hears something musical and learns the mapping
- an expert user hears the data's structure directly
- the toggle itself is a teaching device: switching between modes
  shows what "quantisation" means sonically
  
## directions under consideration

### live neurofeedback

the most promising extension. a user with a consumer eeg device
hears their alpha power in real time, with the goal of
self-regulation. alpha increases when relaxed, and the sonification
gives immediate feedback that could support meditation or
relaxation training.

grounded in existing research (`citations.md`, zoefel et al.,
escolano et al.) but the project does not claim to be a therapeutic
intervention. it is an instrument for listening to your own state.

in the five-note chord design, calm vs agitated becomes audible
directly: a calm state produces a compact, alpha-centered chord; an
agitated state produces a wide chord spanning delta to gamma. the
interval spread is the signal.

constraints:
- latency budget: ~250 ms for feedback to be usefully coupled to
  brain state. current 2 s window is far too slow.
- artifact handling: real-time data cannot be cleaned as carefully.
- hardware variability: consumer devices vary widely.

### empirical emotion datasets

public eeg datasets of emotion induction, music listening, or
cognitive tasks could be sonified using the same pipeline.

---

## interdisciplinary intent

this project sits between music, programming, and neuroscience
without collapsing into any one of them. the code is real software;
the mapping is grounded in psychophysics; the interface is designed
for a general audience.
