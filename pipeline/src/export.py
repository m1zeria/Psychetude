"""phase 4 — export per-electrode, per-window band power to json."""
import json
import math
from pathlib import Path


# clamp targets for non-finite values. must match
# sonification.norm_lo / norm_hi in config.yaml.
NORM_LO = -12.0
NORM_HI = -7.0


def _sanitize(value: float) -> float:
    """clamp non-finite and out-of-range values to a defensible range.

    nan -> 0.0 (neutral midpoint-ish; the front-end will normalize)
    +inf -> NORM_HI
    -inf -> NORM_LO
    finite but out of [NORM_LO, NORM_HI] -> clamped
    """
    if math.isnan(value):
        return 0.0
    if math.isinf(value):
        return NORM_HI if value > 0 else NORM_LO
    return max(NORM_LO, min(NORM_HI, value))


def _validate(payload: dict) -> None:
    """raise if the payload would be malformed or unsupported by json.

    called before write. the front-end trusts whatever we emit, so
    validation happens here, at the boundary.
    """
    meta = payload.get("meta", {})
    channels = meta.get("channels")
    bands = meta.get("bands")

    if not channels or not isinstance(channels, list):
        raise ValueError("meta.channels must be a non-empty list")
    if not all(isinstance(c, str) for c in channels):
        raise ValueError("meta.channels must contain strings only")

    if not bands or not isinstance(bands, dict):
        raise ValueError("meta.bands must be a non-empty dict")
    for name, rng in bands.items():
        if (
            not isinstance(rng, (list, tuple))
            or len(rng) != 2
            or not all(isinstance(x, (int, float)) for x in rng)
            or rng[0] >= rng[1]
        ):
            raise ValueError(f"meta.bands[{name}] must be [lo, hi], lo < hi")

    n_channels = len(channels)
    frames = payload.get("frames", [])
    if not isinstance(frames, list):
        raise ValueError("frames must be a list")

    for i, frame in enumerate(frames):
        if not isinstance(frame, dict):
            raise ValueError(f"frames[{i}] must be a dict")
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
                if not isinstance(v, (int, float)) or not math.isfinite(v):
                    raise ValueError(
                        f"frames[{i}].bands[{name}] contains non-finite value"
                    )


def build_payload(
    ch_names: list[str],
    windows: list[dict],
    band_powers: list[dict],
    sfreq: float,
    bands: dict,
    meta: dict,
) -> dict:
    """assemble the json payload. sanitizes band powers on the way in."""
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
        "meta": {
            "sfreq": sfreq,
            "channels": ch_names,
            "bands": {b: list(rng) for b, rng in bands.items()},
            **meta,
        },
        "frames": frames,
    }


def write_json(payload: dict, path: Path) -> None:
    """validate then write. never writes a partial or malformed file."""
    _validate(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w") as f:
        json.dump(payload, f, indent=2)
    tmp.replace(path)
