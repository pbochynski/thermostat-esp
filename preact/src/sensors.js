import { html } from 'htm/preact';

function gradient(id, val, max) {

  return html`<linearGradient id="${id}" x1="0%" y1="0%" x2="${max / val * 100}%" y2="0%">
  <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
  <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
</linearGradient>`
}
function bar(id, x, y, val, label, max, maxWidth) {
  return html`
  <rect x=${x} y=${y} rx="5" ry="5" width=${val / max * maxWidth} height="21"
  style="fill:url(#g${id});stroke:black;stroke-width:1" />
  <text fill="black" font-size="15" font-family="Verdana" x=${x + 3} y=${y + 16}>
  ${Math.round(val * 100) / 100} (${label})</text>`
}

export default function Sensors({ data, colorMin, colorMax, maxValue }) {
  return html`<svg viewBox="0 0 400 ${data.length*30+20}" >
  <defs>
    ${data.map((s, i) => gradient("g" + i, s.t, maxValue))}
  </defs>
  ${data.map((s, i) => bar(i, 20, 20 + i * 30, s.t, s.id, maxValue, 400))}
  Sorry, your browser does not support inline SVG.
</svg>`
}