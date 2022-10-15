import { html } from 'htm/preact';

export default function Usage({data}) {

  let usage = '-';
  for (let ds of data.datasets) {
    if (ds.label==='heating') {
      let sum = 0.0;
      let count =0;
      for (let d of ds.data) {
        sum+=d.y;
        count++;
      }
      usage = Math.round(sum*100/count)+'%';
    }
  }
  return html`<div>Heating on: ${usage}</div>`
}