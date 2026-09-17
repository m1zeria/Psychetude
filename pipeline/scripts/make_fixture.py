"""generate a synthetic eeg fixture for pipeline testing.

the fixture is not real brain data. it is a known signal with known
spectral content, designed so the pipeline's band-power extraction
can be checked against expected values.

"""
import numpy as np
import mne
from pathlib import Path


# 19-channel 10-20 montage, matching the front-end's canonical set.
CHANNELS = [
    'Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8',
    'T3', 'C3', 'Cz', 'C4', 'T4',
    'T5', 'P3', 'Pz', 'P4', 'T6', 'O1', 'O2',
]

SFREQ = 250.0
DURATION = 10.0  # seconds


def synth_channel(t, freqs_powers, rng):
    """sum of sinusoids at given (freq, power) pairs, plus noise."""
    signal = np.zeros_like(t)
    for f, p in freqs_powers:
        phase = rng.uniform(0, 2 * np.pi)
        signal += np.sqrt(p) * np.sin(2 * np.pi * f * t + phase)
    signal += rng.normal(0, 0.3, size=t.shape)  # broadband noise
    return signal


def main():
    root = Path(__file__).resolve().parents[1]
    out_path = root / 'data' / 'raw' / 'fixture.fif'
    out_path.parent.mkdir(parents=True, exist_ok=True)

    rng = np.random.default_rng(42)  # deterministic
    n = int(SFREQ * DURATION)
    t = np.arange(n) / SFREQ

    # each channel gets a different spectral profile, so the
    # pipeline's per-channel output is distinguishable in tests.
    #
    # channel 0 (Fp1): dominant alpha
    # channel 1 (Fp2): dominant beta
    # channel 2 (F7):  dominant delta
    # channel 3 (F3):  dominant theta
    # channel 4+ :      mixed / weaker, drifting toward noise
    profiles = [
        [(10.0, 4.0)],                          # alpha
        [(20.0, 4.0)],                          # beta
        [(2.0,  4.0)],                          # delta
        [(6.0,  4.0)],                          # theta
    ]

    data = np.zeros((len(CHANNELS), n))
    for i, ch in enumerate(CHANNELS):
        if i < len(profiles):
            data[i] = synth_channel(t, profiles[i], rng)
        else:
            # taper amplitude across the remaining channels so
            # high-index channels are quieter (still testable)
            amp = max(0.1, 1.0 - (i - len(profiles)) * 0.1)
            data[i] = amp * synth_channel(
                t,
                [(8.0 + (i % 5), 1.0)],  # varying mid-band tone
                rng,
            )

    # scale to volts (eeg signals are ~µV; mne expects V)
    data *= 1e-6

    info = mne.create_info(
        ch_names=CHANNELS,
        sfreq=SFREQ,
        ch_types='eeg',
    )
    # attach a standard montage so channel positions are known
    montage = mne.channels.make_standard_montage('standard_1020')
    info.set_montage(montage, on_missing='ignore')

    raw = mne.io.RawArray(data, info)
    raw.save(out_path, overwrite=True)
    print(f'wrote {out_path} ({out_path.stat().st_size / 1024:.1f} kb)')


if __name__ == '__main__':
    main()
