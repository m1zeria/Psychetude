import sys
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.load import load_raw, preprocess, epoch
from src.fft_bands import window_fft, band_power
from src.export import build_payload, write_json, _validate


@pytest.fixture(scope="module")
def cfg():
    return yaml.safe_load((ROOT / "config.yaml").read_text())


@pytest.fixture(scope="module")
def processed(cfg):
    raw_path = ROOT / cfg["dataset"]["raw_dir"] / cfg["dataset"]["filename"]
    if not raw_path.exists():
        pytest.skip(f"fixture missing: {raw_path}")
    raw = load_raw(raw_path)
    raw = preprocess(raw, cfg)
    return raw, cfg


def test_fixture_loads(processed):
    raw, _ = processed
    assert raw.info["sfreq"] == 250.0
    assert len(raw.info["ch_names"]) == 19


def test_windows_have_expected_count(processed):
    raw, cfg = processed
    windows = epoch(raw, cfg)
    # 10 seconds at 2s windows, 50% overlap -> 9 windows
    assert len(windows) == 9
    for w in windows:
        assert w["data"].shape == (19, 500)


def test_band_power_detects_known_content(processed):
    """channel 0 has dominant alpha, channel 1 dominant beta, etc."""
    raw, cfg = processed
    windows = epoch(raw, cfg)
    bands = cfg["fft"]["bands"]

    # average band power across windows per channel for stability
    accum = {b: [] for b in bands}
    for w in windows:
        freqs, power = window_fft(w["data"], raw.info["sfreq"])
        bp = band_power(freqs, power, bands, reduce="log_mean")
        for b in bands:
            accum[b].append(bp[b])

    import numpy as np
    mean_bp = {b: np.mean(accum[b], axis=0) for b in bands}

    # channel 0 (Fp1) was synthesized with alpha power
    alpha_ch0 = mean_bp["alpha"][0]
    other_bands_ch0 = [mean_bp[b][0] for b in bands if b != "alpha"]
    assert all(alpha_ch0 > other for other in other_bands_ch0), (
        f"alpha not dominant at ch0: alpha={alpha_ch0}, others={other_bands_ch0}"
    )

    # channel 1 (Fp2) was synthesized with beta power
    beta_ch1 = mean_bp["beta"][1]
    other_bands_ch1 = [mean_bp[b][1] for b in bands if b != "beta"]
    assert all(beta_ch1 > other for other in other_bands_ch1), (
        f"beta not dominant at ch1: beta={beta_ch1}, others={other_bands_ch1}"
    )


def test_payload_validates(processed):
    raw, cfg = processed
    windows = epoch(raw, cfg)
    bands = cfg["fft"]["bands"]

    band_powers = []
    for w in windows:
        freqs, power = window_fft(w["data"], raw.info["sfreq"])
        band_powers.append(band_power(freqs, power, bands, reduce="log_mean"))

    payload = build_payload(
        ch_names=raw.info["ch_names"],
        windows=windows,
        band_powers=band_powers,
        sfreq=raw.info["sfreq"],
        bands=bands,
        meta={"subject": None, "run": None},
    )
    # should not raise
    _validate(payload)
    assert len(payload["frames"]) == 9
    assert len(payload["meta"]["channels"]) == 19


def test_validation_rejects_malformed(cfg):
    """verify the validator actually catches bad payloads."""
    bands = cfg["fft"]["bands"]
    with pytest.raises(ValueError):
        _validate({"meta": {}, "frames": []})
    with pytest.raises(ValueError):
        _validate({
            "meta": {"channels": ["a"], "bands": bands},
            "frames": [{"t": 0, "bands": {b: [1.0, 2.0] for b in bands}}],
        })
