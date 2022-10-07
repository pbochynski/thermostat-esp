import { html } from 'htm/preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const COLORS = [
  '#4dc9f6',
  '#f67019',
  '#f53794',
  '#537bc4',
  '#acc236',
  '#166a8f',
  '#00a950',
  '#58595b',
  '#8549ba'
];

function color(index) {
  return COLORS[index % COLORS.length];
}

function updateScales(data) {
  if (data.scales) {
    for (let ds of data.datasets) {
      for (let d of ds.data) {
        let scaleX = data.scales[ds.scaleX];
        let scaleY = data.scales[ds.scaleY];

        if (scaleX.dynamic) {
          if (scaleX.min === undefined || scaleX.min > d.x) {
            scaleX.min = d.x;
          }
          if (scaleX.max === undefined || scaleX.max < d.x) {
            scaleX.max = d.x;
          }
        }
        if (scaleY.dynamic) {
          if (scaleY.min === undefined || scaleY.min > d.y) {
            scaleY.min = d.y;
          }
          if (scaleY.max === undefined || scaleY.max < d.y) {
            scaleY.max = d.y;
          }
        }
      }
    }
    for (let s of data.scales) {
      if (s.dynamic) {
        if (s.min == s.max) {
          s.min -= 1;
          s.max += 1;
        }
      }
    }
  }

}
const LEGEND = { x: 20, y: 270 };

function points(data, calcX, calcY, color) {
  return html`${data.map((d) => html`<circle cx=${calcX(d.x)} cy=${calcY(d.y)} r="3" fill=${color} style="opacity:0.8" />`)}`
}

function line(data, calcX, calcY, color) {
  return html`<polyline 
  points=${data.map((d) => `${calcX(d.x)},${calcY(d.y)}`).join(' ')}
  style="fill:none;stroke:${color};stroke-width:2;opacity:0.8" />`
}

function area(data, calcX, calcY, color) {
  let points = `${calcX(data[0].x)},${calcY(0)} ${data.map((d) => `${calcX(d.x)},${calcY(d.y)}`).join(' ')} 
  ${calcX(data[data.length - 1].x)},${calcY(0)} ${calcX(data[0].x)},${calcY(0)}`
  return html`<polygon 
  points=${points}
  style="fill:${color};stroke:${color};stroke-width:1;fill-rule:nonzero;opacity:0.8" />`
}

function legend(label, x, y, color, val) {
  return html`
  <rect x=${x} y=${y} rx="5" ry="5" width="55" height="25"
  style="fill:${color};opacity:0.8" />
  <text fill="black" font-size="15" font-family="Verdana" x=${x + 60} y=${y + 18}>
  ${label}</text>
  <text fill="white" text-anchor="middle" font-weight="bold" font-size="15" font-family="Verdana" x=${x + 27} y=${y + 18}>${val}</text>
  `
}
function formatDate(d) {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function gridX(x, y, w, h, sx) {
  let steps = []
  for (let i = 0; i < 13; ++i) {
    steps[i] = { x: x + i * (w / 12), val: sx.min + i * (sx.max - sx.min) / 12 }
  }

  return html`${steps.map(s => html`
  <line x1=${s.x} y1=${y} x2=${s.x} y2=${y + h} style="stroke:gray;stroke-width:1;opacity:0.5" />
  <text x=${s.x - 30} y=${y + h} fill="gray" font-size="13" font-family="Verdana" transform="rotate(-55 ${s.x + 20},${y + h})">${formatDate(new Date(s.val))}</text>
  `)}`;
}
function steps(min, max, num) {

  let e = 0;
  let s = (max - min) / num
  while (Math.round(s * Math.pow(10, e))) {
    e--;
  }
  while (Math.round(s * Math.pow(10, e)) < 1) {
    e++;
  }
  let m = Math.round(s * Math.pow(10, e));
  if (m > 10 || m < 1) {
    throw Error("invalid m")
  }
  if (m > 2 && m < 5) {
    m = 5;
  }
  if (m > 5) {
    m = 10;
  }
  let step = m / Math.pow(10, e);
  let res = [];
  for (let i = Math.floor(min / step); i * step < max; ++i) {
    res.push(Math.round(i * step * Math.pow(10, e)) / Math.pow(10, e));
  }
  return res;
}

function gridY(x, y, w, h, sy) {
  let offset = sy.offset || 0;
  let st = steps(sy.min, sy.max, 6).map(v => { return { y: y + (h-offset) - ((v - sy.min) * (h-offset) / (sy.max - sy.min)), val: v } });

  return html`${st.map(s => html`
  <line x1=${x} y1=${s.y} x2=${x + w} y2=${s.y} style="stroke:gray;stroke-width:1;opacity:0.5" />
  <text x=${x - 40} y=${s.y + 4} fill="gray" font-size="14" font-family="Verdana">${Math.floor(s.val * 100) / 100}</text>
  `)}`;
}

export default function Stats({ data, sensors, heating }) {
  const refContainer = useRef();
  const [dimensions, setDimensions] =
    useState({ width: 0, height: 0 });
  useEffect(() => {
    if (refContainer.current) {
      setDimensions({
        width: refContainer.current.offsetWidth,
        height: refContainer.current.offsetHeight,
      });
      console.log(refContainer.current.offsetWidth, refContainer.current.offsetHeight);
    }
  });
  updateScales(data);
  const WIDTH = Math.max(300, dimensions.width ? dimensions.width-80 : 300);
  const HEIGHT = 200;
  const X=50, Y=20;
  console.log("dimensions", dimensions, "WIDTH",WIDTH)

  const sensorValue = (sensors, id) => {
    if (id == "heating") {
      return heating ? "on" : "off";
    }
    for (let s of sensors) {
      if (s.id == id) {
        return Math.round(s.t * 100) / 100;
      }
    }
    return "";
  }
  return html`<div ref=${refContainer}><svg height="350px" viewBox="0 0 ${WIDTH+80} ${data.datasets.length * 30 + 270}">
  ${data.scales && gridX(X, Y, WIDTH, HEIGHT, data.scales[0])}
  ${data.scales && gridY(X, Y, WIDTH, HEIGHT, data.scales[1])}
  ${data.datasets.map((ds, i) => {
    let sx = data.scales[ds.scaleX], sy = data.scales[ds.scaleY];
    let offset = sy.offset || 0;
    const calcX = (dx) => `${X + (dx - sx.min) * WIDTH / (sx.max - sx.min)}`;
    const calcY = (dy) => `${Y + (HEIGHT-offset) - ((dy - sy.min) * (HEIGHT-offset )/ (sy.max - sy.min))}`;
    return html`
    ${sy.line && line(ds.data, calcX, calcY, color(i))}
    ${sy.area && area(ds.data, calcX, calcY, "red")}
    ${sy.points && points(ds.data, calcX, calcY, color(i))}
    ${legend(ds.alias, LEGEND.x + 200 * (i % 2), LEGEND.y + Math.floor(i / 2) * 30, sy.area ? "red" : color(i), sensorValue(sensors, ds.label))}
    `})}
  </svg></div>`
}

