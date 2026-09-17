const CANONICAL_BANDS = {
  delta: [0.5, 4.0], theta: [4.0, 8.0], alpha: [8.0, 13.0],
  beta: [13.0, 30.0], gamma: [30.0, 45.0],
};

const CANONICAL_CHANNELS = [
  'Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8', 'T3', 'C3', 'Cz',
  'C4', 'T4', 'T5', 'P3', 'Pz', 'P4', 'T6', 'O1', 'O2',
];

const FALLBACK = {
  meta: {
    sfreq: 250, channels: CANONICAL_CHANNELS, bands: CANONICAL_BANDS,
    subject: null, run: null, _fallback: true,
  },
  frames: [{
    t: 0,
    bands: Object.fromEntries(Object.keys(CANONICAL_BANDS).map((b) => [
      b, new Array(CANONICAL_CHANNELS.length).fill(-9.5),
    ])),
  }],
};

function isBandMap(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function validBands(value) {
  return isBandMap(value) && Object.keys(value).length > 0 &&
    Object.values(value).every((r) => Array.isArray(r) && r.length === 2 &&
      r.every((n) => Number.isFinite(Number(n))) && Number(r[0]) < Number(r[1]));
}

function sanitizeValue(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function coercePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('payload is not an object');
  }
  const meta = payload.meta && typeof payload.meta === 'object' ? payload.meta : {};
  const channels = Array.isArray(meta.channels) && meta.channels.length > 0 &&
    meta.channels.every((c) => typeof c === 'string' && c.length > 0)
    ? meta.channels : CANONICAL_CHANNELS;
  const bands = validBands(meta.bands) ? meta.bands : CANONICAL_BANDS;
  const frames = Array.isArray(payload.frames) ? payload.frames : [];

  return {
    meta: {
      sfreq: Number.isFinite(Number(meta.sfreq)) ? Number(meta.sfreq) : 250,
      channels, bands,
      subject: meta.subject ?? null, run: meta.run ?? null,
      _fallback: Boolean(meta._fallback),
    },
    frames: frames.map((f) => ({
      t: Number.isFinite(Number(f?.t)) ? Number(f.t) : 0,
      bands: Object.fromEntries(Object.keys(bands).map((name) => {
        const arr = Array.isArray(f?.bands?.[name]) ? f.bands[name] : [];
        return [name, channels.map((_, i) => sanitizeValue(arr[i]))];
      })),
    })),
  };
}

export async function loadData(url = './data/sample.json') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`http ${res.status}`);
    return coercePayload(await res.json());
  } catch (e) {
    console.warn(`data load failed (${e.message}) — using fallback`);
    return coercePayload(FALLBACK);
  }
}
