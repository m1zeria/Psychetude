export function updateHUD(channelName, channelIndex, chord, mode) {
  const el = document.getElementById('readout');
  if (!el) return;

  if (!Array.isArray(chord) || chord.length === 0) {
    el.innerHTML = `<div><strong>${channelName}</strong></div>`;
    return;
  }

  const rows = chord
    .map((v) => {
      const f = Number.isFinite(v.freq) ? v.freq.toFixed(1) : '--';
      const g = Number.isFinite(v.gain) ? v.gain.toFixed(2) : '--';
      return `<div><span class="band">${v.band}</span> <span class="freq">${f} hz</span> <span class="gain">g ${g}</span></div>`;
    })
    .join('');

  el.innerHTML =
    `<div><strong>${channelName}</strong> <span class="idx">#${channelIndex}</span> <span class="mode">${mode}</span></div>` +
    rows;
}
