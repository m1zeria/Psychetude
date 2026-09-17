"""Orchestrator — Phase 0 → Phase 4."""
import sys
from pathlib import Path

import yaml

# Allow `python scripts/run_pipeline.py` from pipeline/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.load import load_raw, preprocess, epoch          # noqa: E402
from src.fft_bands import window_fft, band_power          # noqa: E402
from src.export import build_payload, write_json          # noqa: E402


def main():
    root = Path(__file__).resolve().parents[1]
    cfg = yaml.safe_load((root / "config.yaml").read_text())

    raw_path = root / cfg["dataset"]["raw_dir"] / cfg["dataset"]["filename"]
    raw = load_raw(raw_path)
    raw = preprocess(raw, cfg)

    windows = epoch(raw, cfg)
    sfreq = raw.info["sfreq"]
    ch_names = raw.info["ch_names"]

    bands = cfg["fft"]["bands"]
    reduce = cfg["fft"]["reduce"]
    win_fn = cfg["fft"]["window_fn"]

    band_powers = []
    for w in windows:
        freqs, power = window_fft(w["data"], sfreq, window_fn=win_fn)
        bp = band_power(freqs, power, bands, reduce=reduce)
        band_powers.append(bp)

    payload = build_payload(
        ch_names=ch_names,
        windows=windows,
        band_powers=band_powers,
        sfreq=sfreq,
        bands=bands,
        meta={"subject": cfg["dataset"]["subject"], "run": cfg["dataset"]["run"]},
    )

    out = root / cfg["output"]["path"]
    write_json(payload, out)
    print(f"wrote {out} ({len(payload['frames'])} frames, {len(ch_names)} channels)")


if __name__ == "__main__":
    main()
