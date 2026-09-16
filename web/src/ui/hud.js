export function updateHUD(channelName, bands, bandDefs) {
  const el = document.getElementById('readout');
  const rows = Object.keys(bandDefs)
    .map((b) => {
      const v = bands[b]?.[0] ?? 0;
      return `<div><span class="band">${b}</span> ${v.toFixed(3)}</div>`;
    })
    .join('');
  el.innerHTML = `<div><strong>${channelName}</strong></div>${rows}`;
}
