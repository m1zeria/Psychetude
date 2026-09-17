export function updateHUD(channelName, channelIndex, chord, bandDefs) {
  const el = document.getElementById('readout');
  if (!el) return;
  el.replaceChildren();

  const title = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = channelName;
  title.append(strong, ` #${channelIndex}`);
  el.appendChild(title);

  for (const voice of Array.isArray(chord) ? chord : []) {
    const row = document.createElement('div');
    const band = document.createElement('span');
    band.className = 'band';
    band.textContent = voice.band;
    row.append(band, ` ${Number(voice.freq).toFixed(1)}hz g:${Number(voice.gain).toFixed(2)}`);
    el.appendChild(row);
  }
}
