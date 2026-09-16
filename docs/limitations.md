# limitations

this document lists what psychetude does not claim to do. it exists because
the alternative, overreaching, undermines the project's stated
goal of rigor.

if you're reading this to evaluate the project: read this section before
the others. it will tell you what kind of claims to expect.

---

## signal-level limitations

### spatial resolution

scalp EEG does not have 19 independent spatial channels. each electrode
records a weighted mixture of cortical sources, and the lead field spreads
broadly. neighbouring electrodes are thus correlated; the effective spatial 
resolution of a 19-channel montage is closer to 6–10 independent sources.

this means the "click an electrode, hear its region" framing is an
approximation. the sound at F3 is not the sound of the left frontal lobe,
but the sound of a weighted mixture dominated by whatever sources project
there. we sonify the electrode signal, which is what a user can actually
record. source-level specificity would require inverse modeling (eLORETA,
MNE source estimation), which is a different project.

### frequency resolution

the pipeline uses 2-second FFT windows at 250 Hz, giving a frequency
resolution of 0.5 Hz per bin. this is sufficient to separate delta from
theta (4.0 Hz boundary), but marginal for the delta/theta transition at
low frequencies where bins are sparse. longer windows would improve
resolution at the cost of temporal precision.

### temporal resolution

2-second windows mean the sonification cannot respond to events shorter
than roughly 2 seconds. this is a constraint for the live neurofeedback 
portion (see `rationale.md`), where the latency budget is closer to 
250ms. precomputed and live modes have different
resolutions by design.

### artifact sensitivity

the pipeline applies band-pass and notch filters, but does not perform
independent component analysis (ICA) or explicit artifact rejection.
eye blinks, muscle tension, and electrode movement will appear in the
band powers as artifacts. this matters more for live data than for the
pre-cleaned PhysioNet recordings.

---

## mapping-level limitations

### no perceptual validation

the log-frequency pitch mapping is motivated by psychophysics, but has
not been validated against listener data. we do not claim that the
mapping produces "the most legible" or "the most pleasant" sonification —
only that it is defensible on perceptual grounds, and better-motivated
than a linear Hz mapping. see `mapping.md` for the design and
`citations.md` for what motivates it.

the fixed-register scheme rests on auditory scene analysis
(bregman) for the claim that stable registers aid voice tracking.
this is a theoretical claim, not an empirical one about this
specific mapping.

### arbitrary normalisation range

band power is normalised against the range [-12, -7] in log10(mean PSD).
this range is based on observation of typical EEG recordings, not a
principled derivation. it will need tuning per dataset and possibly per
subject. a future version should compute the range from the data itself.

### modulation depth is a design choice

±3 semitones of within-register modulation is a defensible choice
(non-overlapping registers) but not an optimized one. listener
testing could show ±2 is better for legibility, or ±4 for
expressiveness. the current value is a starting point.

### raw mode is not pleasant

raw mode produces unsnapped, unquantised pitches. simultaneous
voices will frequently sound dissonant. this is intended. raw mode
exposes data structure, not a rendering of it. but it means the
default listening experience in raw mode is not musical.

### the chord is dense

five simultaneous voices is at the edge of what listeners can track
as separate sources, especially untrained listeners. bregman's
streaming principles suggest five is feasible with strong register
cues (which we have), but this is untested for our specific design.
---

## application-level limitations

### not a medical device

psychetude is not a diagnostic tool, a therapeutic intervention, or a
clinical neurofeedback system. it does not measure, treat, or diagnose
any condition. any use of the live-neurofeedback direction in a health
context would require research protocols, ethics review, and clinical
validation that this project does not attempt.

### consumer EEG only (aspirationally)

live mode targets consumer EEG hardware (Muse, OpenBCI etc). these
devices have lower signal quality than research-grade amplifiers and
are sensitive to electrode placement, impedance, and motion. results
with consumer hardware will be less reliable than with clinical equipment.

### no user study

the accessibility claim — that this makes neuroscience more
accessible — is not measured. it is an aspiration. measuring it
would require user testing that the project has not conducted.

### live mode is unbuilt

the live-neurofeedback direction is documented (`rationale.md`) but
not implemented. claims about it are about the design, not the
artifact.
---

## what we do claim

- the mapping is documented and motivated, not arbitrary.
- the code is a faithful implementation of the mapping.
- the sonification is faithful to the electrode signal.
- the interactive interface works without prior eeg knowledge.
- the system degrades gracefully under data and environment faults
  (see `robustness.md`).
