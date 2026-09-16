# sonification mapping

this document is the *design contract* for how EEG band power becomes sound
update it whenever the code in `web/src/audio/mapping.js` changes

## principle: log-frequency pitch

pitch is mapped linearly in MIDI space, which is logarithmic in Hz:

    freq = 440 * 2 ** ((midi - 69) / 12)

this is standard practice in sonification because human pitch perception is
approximately logarithmic. linear Hz mapping produces compressed high-end motion and wasted low-end motion. thus logarithmic sonification is the sweet spot.

## Proposed band → parameter map

| EEG band | Sound parameter      | Rationale |
|----------|----------------------|-------------------------------------|
| delta    | amplitude            |                                     |
| theta    | duration             |                                     |
| alpha    | pitch (log-frequency)|                                     |
| beta     | FM modulation index  |                                     |
| gamma    | harmonicity          |                                     |

## normalisation

band power arrives from the pipeline as `log10(mean PSD)` per band per channel.
observed range across the sample data is roughly `[-13, -7]`. normalisation
clamps to this range and linearly maps to `[0, 1]`.

## TO-DO

- [ ] Cite log-frequency sonification literature here
- [ ] Decide whether pitch is per-channel absolute or relative to a reference
- [ ] Consider spatialisation (PanNode) based on electrode x-position
