import { html } from 'htm/preact';
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
const boxes = [{x:40,y:20,w:480,h:150},{x:40,y:180,w:480,h:40}];
const LEGEND ={x:20,y:270};

function points(data, calcX, calcY, color) {
  return html`${data.map((d)=>html`<circle cx=${calcX(d.x)} cy=${calcY(d.y)} r="3" fill=${color} style="opacity:0.8" />`)}`
}

function line(data, calcX, calcY, color) {
  return html`<polyline 
  points=${data.map((d) => `${calcX(d.x)},${calcY(d.y)}`).join(' ')}
  style="fill:none;stroke:${color};stroke-width:2;opacity:0.8" />`
}
function area(data, calcX, calcY, color) {
  let points = `${calcX(data[0].x)},${calcY(0)} ${data.map((d) => `${calcX(d.x)},${calcY(d.y)}`).join(' ')} 
  ${calcX(data[data.length-1].x)},${calcY(0)} ${calcX(data[0].x)},${calcY(0)}`
  return html`<polygon 
  points=${points}
  style="fill:${color};stroke:${color};stroke-width:1;fill-rule:nonzero;opacity:0.8" />`
}

function legend(label, x, y, color, val) {
  return html`
  <rect x=${x} y=${y} rx="5" ry="5" width="50" height="21"
  style="fill:${color};opacity:0.8" />
  <text fill="black" font-size="13" font-family="Verdana" x=${x + 60} y=${y + 15}>
  ${label}</text>
  <text fill="black" font-size="13" font-family="Verdana" x=${x + 5} y=${y + 15}>${val}</text>
  `
}
function formatDate(d) {
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function gridX(x,y,w,h,sx) {
  let steps = []
  for (let i=0;i<8;++i) {
    steps[i]={x:x+i*(w/6),val:sx.min+i*(sx.max-sx.min)/6 }
  }
   
  return html`${steps.map(s=> html`
  <line x1=${s.x} y1=${y} x2=${s.x} y2=${y+h} style="stroke:gray;stroke-width:1;opacity:0.5" />
  <text x=${s.x-20} y=${y+h+16} fill="black" font-size="13" font-family="Verdana" >${formatDate(new Date(s.val))}</text>
  `)}`;
}

function gridY(x,y,w,h,sy) {
  let steps = []
  for (let i=0;i<8;++i) {
    steps[i]={y:y+h-i*(h/6),val:sy.min+i*(sy.max-sy.min)/6 }
  }
   
  return html`${steps.map(s=> html`
  <line x1=${x} y1=${s.y} x2=${x+w} y2=${s.y} style="stroke:gray;stroke-width:1;opacity:0.5" />
  <text x=${x-40} y=${s.y+4} fill="black">${Math.floor(s.val*100)/100}</text>
  `)}`;
}
function sensorValue(sensors, id) {
  for (let s of sensors) {
    if (s.id ==id) {
      return Math.round(s.t * 100) / 100;
    }
  }
  return "";
}

export default function Stats({ data, sensors}) {
  updateScales(data);

  return html`<svg viewBox="0 0 550 ${data.datasets.length*30+270}">
  ${data.scales && gridX(boxes[0].x,boxes[0].y,boxes[0].w, boxes[1].h+boxes[1].y-boxes[0].y,data.scales[0])}
  ${data.scales && gridY(boxes[0].x,boxes[0].y,boxes[0].w, boxes[0].h,data.scales[1])}
  ${data.datasets.map((ds, i) => {
    let sx = data.scales[ds.scaleX], sy = data.scales[ds.scaleY];
    let box=boxes[sy.index];
    const calcX = (dx) => `${box.x + (dx - sx.min) * box.w / (sx.max - sx.min)}`;
    const calcY = (dy) => `${box.y + box.h - ((dy - sy.min) * box.h / (sy.max - sy.min))}`;
  return html`
    ${sy.line && line(ds.data,calcX,calcY,color(i))}
    ${sy.area && area(ds.data,calcX,calcY,"red")}
    ${sy.points && points(ds.data,calcX,calcY,color(i))}
    ${legend(ds.alias,LEGEND.x+250*(i%2),LEGEND.y+Math.floor(i/2)*30,sy.area ? "red": color(i),sensorValue(sensors,ds.label))}
    `})}
  </svg>`
}