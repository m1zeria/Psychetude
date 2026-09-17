export function updateHUD(channelName, channelIndex, chord, bandDefs) {
  const el = document.getElementById('readout');
  if (!el) return;

  const rows = chord
    .map(
      (v) =>
        `<div>` +
        `<span class="band">${v.band}</span> ` +
        `<span class="freq">${v.freq.toFixed(1)}hz</span> ` +
        `<span class="gain">g:${v.gain.toFixed(2)}</span>` +
        `</div>`,
    )
    .join('');

  el.innerHTML =
    `<div><strong>${channelName}</strong> <span class="idx">#${channelIndex}</span></div>` +
    rows;
}export function updateHUD(channelName, bands, bandDefs) {
  const el = document.getElementById('readout');
  const rows = Object.keys(bandDefs)
    .map((b) => {
      const v = bands[b]?.[0] ?? 0;
      return `<div><span class="band">${b}</span> ${v.toFixed(3)}</div>`;
    })
    .join('');
  el.innerHTML = `<div><strong>${channelName}</strong></div>${rows}`;
}
