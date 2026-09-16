"""Phase 4 — export per-electrode, per-window band power to JSON."""
import json
from pathlib import Path
import numpy as np


def build_payload(
    ch_names: list[str],
    windows: list[dict],
    band_powers: list[dict],
    sfreq: float,
    bands: dict,
    meta: dict,
) -> dict:
    """
    windows:  list of {start_sample, start_sec}
    band_powers: list of {band_name: array (n_channels,)} — same length as windows
    """
    frames = []
    for w, bp in zip(windows, band_powers):
        frame_bands = {}
        for b in bands:
            # vectorized: round all channels at once instead of list comprehension
            arr = np.asarray(bp[b], dtype=np.float32)
            frame_bands[b] = np.round(arr, 5).tolist()
        
        frames.append({
            "t": round(w["start_sec"], 4),
            "bands": frame_bands,
        })

    return {
        "meta": {
            "sfreq": sfreq,
            "channels": ch_names,
            "bands": {b: list(rng) for b, rng in bands.items()},
            **meta,
        },
        "frames": frames,
    }


def write_json(payload: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        json.dump(payload, f, indent=2)
