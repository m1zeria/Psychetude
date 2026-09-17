"""phase 4 — export per-electrode, per-window band power to json."""
import json
import math
from pathlib import Path


# clamp targets for non-finite values. must match
# sonification.norm_lo / norm_hi in config.yaml.
NORM_LO = -12.0
NORM_HI = -7.0


def _sanitize(value: float) -> float:
    """Clamp non-finite and out-of-range values to the export range."""
    if math.isnan(value):
        return (NORM_LO + NORM_HI) / 2
    if math.isinf(value):
        return NORM_HI if value > 0 else NORM_LO
    return max(NORM_LO, min(NORM_HI, value))


def _finite_number(value, label: str) -> None:
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value):
        raise ValueError(f"{label} must be a finite number")


def _validate(payload: dict) -> None:
    """Raise if the payload is malformed or cannot be strict JSON."""
    if not isinstance(payload, dict):
        raise ValueError("payload must be a dict")
    meta = payload.get("meta")
    if not isinstance(meta, dict):
        raise ValueError("meta must be a dict")

    channels = meta.get("channels")
    bands = meta.get("bands")
    if not channels or not isinstance(channels, list):
        raise ValueError("meta.channels must be a non-empty list")
    if not all(isinstance(c, str) and c for c in channels):
        raise ValueError("meta.channels must contain non-empty strings only")

    if not bands or not isinstance(bands, dict):
        raise ValueError("meta.bands must be a non-empty dict")
    for name, rng in bands.items():
        if not isinstance(name, str):
            raise ValueError("meta.bands keys must be strings")
        if not isinstance(rng, (list, tuple)) or len(rng) != 2:
            raise ValueError(f"meta.bands[{name}] must be [lo, hi], lo < hi")
        _finite_number(rng[0], f"meta.bands[{name}][0]")
        _finite_number(rng[1], f"meta.bands[{name}][1]")
        if rng[0] >= rng[1]:
            raise ValueError(f"meta.bands[{name}] must be [lo, hi], lo < hi")

    if "sfreq" in meta:
        _finite_number(meta["sfreq"], "meta.sfreq")

    n_channels = len(channels)
    frames = payload.get("frames", [])
    if not isinstance(frames, list):
        raise ValueError("frames must be a list")

    for i, frame in enumerate(frames):
        if not isinstance(frame, dict):
            raise ValueError(f"frames[{i}] must be a dict")
        _finite_number(frame.get("t"), f"frames[{i}].t")
        fb = frame.get("bands")
        if not isinstance(fb, dict):
            raise ValueError(f"frames[{i}].bands must be a dict")
        for name in bands:
            arr = fb.get(name)
            if not isinstance(arr, list) or len(arr) != n_channels:
                raise ValueError(
                    f"frames[{i}].bands[{name}] must have {n_channels} values"
                )
            for v in arr:
                _finite_number(v, f"frames[{i}].bands[{name}] value")


def build_payload(
    ch_names: list[str],
    windows: list[dict],
    band_powers: list[dict],
    sfreq: float,
    bands: dict,
    meta: dict,
) -> dict:
    """Assemble the JSON payload and sanitize band powers on the way in."""
    if len(windows) != len(band_powers):
        raise ValueError("windows and band_powers must have equal lengths")

    frames = []
    for w, bp in zip(windows, band_powers):
        frames.append(
            {
                "t": round(w["start_sec"], 4),
                "bands": {
                    b: [round(_sanitize(float(v)), 5) for v in bp[b]]
                    for b in bands
                },
            }
        )

    return {
        **meta,
        "sfreq": sfreq,
        "channels": ch_names,
        "bands": {b: list(rng) for b, rng in bands.items()},
        "frames": frames,
    }


def write_json(payload: dict, path: Path) -> None:
    """Validate then write. Never writes a partial or non-strict JSON file."""
    _validate(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    try:
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, allow_nan=False)
            f.write("\n")
        tmp.replace(path)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise
