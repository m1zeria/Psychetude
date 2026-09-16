# mapping

the design contract for how eeg band power becomes sound.

this document is normative: when code and this document disagree, the
code is wrong. update both together.

---

## overview

for a single electrode at a single moment, we produce a five-voice
chord. each of the five canonical eeg bands contributes one voice.
the chord's interval structure — the spacing between voices — encodes
the electrode's spectral profile.

a listener hears:
- which bands are active (voices present)
- the relative strength of each band (each voice's pitch position
  within its register, and its gain)
- the overall "shape" of the spectrum (the chord's interval spread)

---

## band-to-register assignment

each band is assigned a fixed octave. the assignment follows the
band's center frequency:

| band  | freq range | center | register | midi |
|-------|------------|--------|----------|------|
| delta | 0.5–4 Hz   | ~2 Hz  | C2       | 36   |
| theta | 4–8 Hz     | ~6 Hz  | C3       | 48   |
| alpha | 8–13 Hz    | ~10 Hz | C4       | 60   |
| beta  | 13–30 Hz   | ~20 Hz | C5       | 72   |
| gamma | 30–45 Hz   | ~38 Hz | C6       | 84   |

### why fixed registers

fixed assignment makes each band's pitch identity stable across time
and channels. the listener learns "low = delta" and that association
holds. this is the register cue that lets a listener track individual
voices within a chord (see `citations.md`, bregman on auditory scene
analysis).

a continuous mapping (all bands overlapping in pitch) would obscure
band identity — the listener would hear pitch movement but not know
which band was moving.

### why one note per band, not per frequency

the pipeline computes *one power value per band per electrode per
window*, not a continuous spectrum. so each band contributes one
pitch. the register assignment gives that pitch a fixed sonic 
location.

### the "12 semitones isn't enough" question

the width of a band's physiological frequency range (delta is 3.5 Hz
wide, beta is 17 Hz wide) does not affect pitch assignment, because
we're mapping *band power* to pitch, not *band frequency* to pitch.
band power is a scalar. one scalar → one pitch. twelve semitones is
plenty.

---

## modulation within a register

each band's pitch is modulated within ±3 semitones of its register
center, based on that band's power:

    midi_offset = (power_normalized - 0.5) * 2 * MODULATION_SEMITONES
    midi = register_midi + midi_offset

where `power_normalized` is in [0, 1].

at ±3, adjacent registers leave 6 semitones of unclaimed pitch space
between their outermost notes. at ±4 they touch; at ±5 they cross.
the value is chosen so bands never overlap.

`MODULATION_SEMITONES` is a tunable parameter in `config.yaml` /
`mapping.js`. smaller values (1–2) give a more stable chord; larger
values (3–4) give more expressive movement but less register clarity.

---

## quantization modes

the mapping produces a continuous pitch per voice. before synthesis,
it passes through one of two modes:

### aesthetic mode (default)

- pitch is quantized to the nearest midi semitone
- optionally, quantized further to a scale (default: major pentatonic)
- timbre is tuned for listenability (fm synth, soft envelope)
- release is extended for overlap and legato

designed for: first-time users, browser demo, casual exploration.

### raw mode

- pitch is used directly (no quantization)
- no scale constraint
- minimal timbre (short envelopes, sharp attack)
- pitches are the computed frequencies, unrounded

designed for: users who want to hear the data's actual structure,
not a rendering of it. the chord will frequently sound dissonant in
this mode. that is intended, not a bug (see `limitations.md`).

### why two modes

a single mode forces a false choice between legibility and fidelity.
aesthetic mode prioritizes legibility (musical, stable, learnable);
raw mode prioritizes fidelity (direct, unsmoothed, sometimes harsh).
both are faithful to the same underlying data; they differ only in
how much perceptual smoothing is applied. the toggle is a feature,
not a compromise.

---

## interval structure as a signal

the chord's interval spread carries information about the electrode's
spectral distribution. this is the sonification's most legible
feature and the basis of the live-neurofeedback direction.

example states:

| state         | spectral profile               | chord                    |
|---------------|--------------------------------|--------------------------|
| calm          | dominant alpha, weak δ and γ   | compact, centered on C4  |
| agitated      | high delta and gamma           | wide (C2–C6), hollow mid |
| focused       | strong beta, moderate alpha    | compact upper-middle     |
| drowsy        | strong delta and theta         | low cluster              |
| chaotic       | all bands roughly equal        | saturated, all registers |

the "spread" — the interval between lowest and highest active voice —
is a scalar that tracks spectral flatness. in live mode this could
be surfaced as a secondary visual indicator, but the audio itself
already conveys it.

---

## per-voice parameters

each voice in the chord has:

- `freq` — from register + modulation, quantized per mode
- `gain` — from band power, normalized to [0.1, 1.0] (never zero,
  so every band is always faintly audible)
- `duration` — fixed per mode; longer in aesthetic, shorter in raw
- `timbre` — synth params, per mode

the `gain` floor of 0.1 is deliberate: a band with zero power is
still faintly present, so the listener can hear that it is *present
and low*, distinct from *absent*. the full chord is always five
voices.

---

## robustness

the mapping is designed to have fallback:

- **missing band in data** → treated as 0 power → gain floor
- **unknown channel** → electrode node uses default position
- **NaN or infinite power** → clamped to the normalization range
- **out-of-range power** → clamped, not wrapped or reflected
- **missing meta.bands in json** → fallback to canonical definitions

see `robustness.md` for the full degradation policy.

---

## what this mapping does not claim

- that it is perceptually optimal (no listener testing has been done)
- that it is the only valid mapping (it is one choice among many)
- that the interval structure is uniquely decodable by listeners
  without training (this is an open question)

see `limitations.md`.
