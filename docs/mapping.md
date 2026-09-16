# Sonification Mapping (Phase 3)

This document is the *design contract* for how EEG band power becomes sound.
Update it whenever the code in `web/src/audio/mapping.js` changes.

## Principle: log-frequency pitch

Pitch is mapped linearly in MIDI space, which is logarithmic in Hz:

    freq = 440 * 2 ** ((midi - 69) / 12)

This is standard practice in sonification because human pitch perception is
approximately logarithmic. Linear Hz mapping produces perceptually compressed
high-end motion and wasted low-end motion, thus logarithmic sonification is the sweet spot.

## Proposed band → parameter map

| EEG band | Sound parameter      | Rationale (to fill in w/ citations) |
|----------|----------------------|-------------------------------------|
| delta    | amplitude            |                                     |
| theta    | duration             |                                     |
| alpha    | pitch (log-frequency)|                                     |
| beta     | FM modulation index  |                                     |
| gamma    | harmonicity          |                                     |

## Normalisation

Band power arrives from the pipeline as `log10(mean PSD)` per band per channel.
Observed range across the sample data is roughly `[-13, -7]`. Normalisation
clamps to this range and linearly maps to `[0, 1]`.

## TODO

- [ ] Cite log-frequency sonification literature here
- [ ] Decide whether pitch is per-channel absolute or relative to a reference
- [ ] Consider spatialisation (PanNode) based on electrode x-position
