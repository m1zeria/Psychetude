const CANONICAL_BANDS = {
  delta: [0.5, 4.0],
  theta: [4.0, 8.0],
  alpha: [8.0, 13.0],
  beta:  [13.0, 30.0],
  gamma: [30.0, 45.0],
};

const CANONICAL_CHANNELS = [
  'Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8',
  'T3', 'C3', 'Cz', 'C4', 'T4',
  'T5', 'P3', 'Pz', 'P4', 'T6', 'O1', 'O2',
];

// minimal synthetic fallback. used only if the network fetch fails.
// a single frame of neutral power values, so the ui remains
// interactive.
const FALLBACK = (() => {
  const n = CANONICAL_CHANNELS.length;
  const neutral = (v) => new Array(n).fill(v);
  return {
    meta: {
      sfreq: 250,
      channels: CANONICAL_CHANNELS,
      bands: CANONICAL_BANDS,
      subject: null,
      run: null,
      _fallback: true,
    },
    frames: [
      {
        t: 0,
        bands: {
          delta: neutral(-10.0),
          theta: neutral(-10.0),
          alpha: neutral(-10.0),
          beta:  neutral(-10.0),
          gamma: neutral(-10.0),
        },
      },
    ],
  };
})();

function sanitizeValue(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function coercePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is not an object');
  }

  const meta = payload.meta ?? {};
  const channels =
    Array.isArray(meta.channels) && meta.channels.length > 0
      ? meta.channels
      : CANONICAL_CHANNELS;

  const bands =
    meta.bands && typeof meta.bands === 'object'
      ? meta.bands
      : CANONICAL_BANDS;

  const frames = Array.isArray(payload.frames) ? payload.frames : [];

  const cleanFrames = frames.map((f) => {
    const bandsOut = {};
    for (const name of Object.keys(bands)) {
      const arr = Array.isArray(f?.bands?.[name]) ? f.bands[name] : [];
      const padded = new Array(channels.length)
        .fill(0)
        .map((_, i) => sanitizeValue(arr[i]));
      bandsOut[name] = padded;
    }
    return {
      t: Number.isFinite(Number(f?.t)) ? Number(f.t) : 0,
      bands: bandsOut,
    };
  });

  return {
    meta: {
      sfreq: Number.isFinite(Number(meta.sfreq)) ? Number(meta.sfreq) : 250,
      channels,
      bands,
      subject: meta.subject ?? null,
      run: meta.run ?? null,
      _fallback: Boolean(meta._fallback),
    },
    frames: cleanFrames,
  };
}

export async function loadData(url = './data/sample.json') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`http ${res.status}`);
    const raw = await res.json();
    return coercePayload(raw);
  } catch (e) {
    console.warn(`data load failed (${e.message}) — using fallback`);
    return coercePayload(FALLBACK);
  }
}
