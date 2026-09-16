"""Phase 2 — per electrode, per window: FFT → band power."""
import numpy as np


def window_fft(data: np.ndarray, sfreq: float, window_fn: str = "hann"):
    """
    data: (n_channels, n_samples)
    returns freqs (n_bins,), power (n_channels, n_bins)
    """
    n_channels, n_samples = data.shape

    if window_fn == "hann":
        w = np.hanning(n_samples)
    else:
        w = np.ones(n_samples)

    # Remove per-channel mean to kill DC, then apply window
    x = (data - data.mean(axis=1, keepdims=True)) * w

    # rfft → one-sided spectrum
    spec = np.fft.rfft(x, axis=1)
    freqs = np.fft.rfftfreq(n_samples, d=1.0 / sfreq)

    # Power spectral density (normalise by window energy)
    # compute norm once instead of per-element operations
    window_norm = sfreq * np.sum(w ** 2)
    power = (np.abs(spec) ** 2) / window_norm
    power[:, 1:-1] *= 2.0  # one-sided correction

    return freqs, power


def band_power(freqs, power, bands: dict, reduce: str = "log_mean"):
    """
    freqs: (n_bins,)
    power: (n_channels, n_bins)
    bands: {"delta": [0.5, 4.0], ...}
    returns: {band_name: array of shape (n_channels,)}
    """
    out = {}
    for name, (lo, hi) in bands.items():
        mask = (freqs >= lo) & (freqs < hi)
        if not mask.any():
            out[name] = np.zeros(power.shape[0])
            continue

        band = power[:, mask]
        if reduce == "mean":
            out[name] = band.mean(axis=1)
        elif reduce == "sum":
            out[name] = band.sum(axis=1)
        elif reduce == "log_mean":
            # log10 of mean power; clamp to avoid -inf
            out[name] = np.log10(np.clip(band.mean(axis=1), 1e-12, None))
        else:
            raise ValueError(f"Unknown reduce: {reduce}")
    return out
