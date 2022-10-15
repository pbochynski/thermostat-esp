import './style';
import CircularSlider from '@fseehawer/react-circular-slider';
import { html } from 'htm/preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import Stats from './stats'
import packageJson from '../package.json'
import Usage from './usage';


const queryParams = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let host = location.host;
let rpc = 'http://' + host + '/rpc'
if (queryParams.rpc) {
  rpc = queryParams.rpc;
}

const knobValues = (() => {
  let d = [];
  for (let i = 170; i <= 270; ++i) {
    d.push(i / 10);
  }
  return d;
})();


function alias(id) {
  let aliases = {
    heating: "Heating",
    esp32_06F1B0: "Kitchen",
    esp32_0BA4CC: "Bedroom"
  }
  return aliases[id] || id;
}


function tempformat(dec) {
  if (dec == null)
    return "--.-";
  return parseInt(dec) + '.' + parseInt(dec * 10) % 10 + '°C';
}
function uptimeToString(uptime) {
  let str = "";
  if (Math.floor(uptime / 86400)) {
    str += `${Math.floor(uptime / 86400)}d `
  }
  str += `${Math.floor(uptime / 3600) % 24}h ${Math.floor(uptime / 60) % 60}m ${Math.floor(uptime) % 60}s`;
  return str;
}

export default function App(props) {
  const [target, setTarget] = useState(17);
  const [power, setPower] = useState(true);
  const [sensors, setSensors] = useState([]);
  const [knob, setKnob] = useState(17);
  const [heating, setHeating] = useState(0);
  const [temp, setTemp] = useState({ min: null, max: null })
  const [stats, setStats] = useState({ datasets: [] })
  const [uptime, setUptime] = useState(0);
  const [editMode, setEditMode] = useState(false);

  async function post(url, data) {
    const response = await fetch(url + `?access_token=${queryParams.access_token}`, {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(data)
    })
    const json = await response.json();
    return json;
  }
  const saveTarget = async () => {
    await post(rpc + '/Config.Set', { key: "therm.t", value: knob });
    await post(rpc + '/Config.Save')
    fetchState(false);
  }
  const savePower = (value) => {
    post(rpc + '/Config.Set', { key: "therm.mode", value: value });
  }
  const load = (period) => {
    let url = `${rpc}/Stats.${period}?access_token=${queryParams.access_token}`;
    fetch(url).then((response) => response.json()).then((data) => {
      data.scales = [
        { label: "Time", dynamic: false, points: true, min: Date.now() - (period == 'Hour' ? 3600000 : 86400000), max: Date.now(), index: 0 },
        { label: "Temperature", dynamic: true, line: true, points: true, index: 0, offset: 50 },
        { label: "Heating", dynamic: false, area: true, min: 0, max: 5, index: 1 }
      ]
      for (let i = 0; i < data.datasets.length; ++i) {
        let ds = data.datasets[i];
        ds.scaleX = 0;
        ds.scaleY = (ds.label === 'heating') ? 2 : 1;
        ds.alias = alias(ds.label);

        let delta = Date.now() - data.uptime * 1000;
        let start = data.uptime - (period == 'Hour' ? 3600 : 86400);
        ds.data = ds.data
          .filter(d => d && d.x >= start)
          .sort((a, b) => a.x - b.x)
          .map((d) => { return { x: new Date(d.x * 1000 + delta), y: d.y } });

      }
      setStats(data);

    })

  }
  useEffect(() => {
    load('Hour');
  }, []);

  const fetchState = () => {
    let url = `${rpc}/State?access_token=${queryParams.access_token}`;
    fetch(url)
      .then((response) => response.json())
      .then((state) => {
        setSensors(state.sensors)
        setPower(state.power === 'on');
        setTarget(state.target);
        setHeating(state.on);
        setUptime(state.uptime);
        let min = null, max = null;
        for (let s of state.sensors) {
          if (min === null || s.t < min) {
            min = s.t;
          }
          if (max === null || s.t > max) {
            max = s.t;
          }
        }
        setTemp({ min, max });
      });
}

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      fetchState();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const switchPower = (value) => {
    setPower(value);
    savePower(value ? 'on' : 'off');
    setKnob(target);
  }
  let dataIndex = (editMode ? knob : target) * 10 - 170;

  const knobChange = (value) => {
    setKnob(value);
  }
  return html`<div class="container">
  <div>
  ${queryParams.mqtt && !mqttParams.connected && html`<${MqttParams}/>`}
  <button onClick=${() => { switchPower(true) }} disabled=${power}>ON</button>
  <button onClick=${() => switchPower(false)} disabled=${!power || editMode}>OFF</button>
  <button onClick=${() => { setEditMode(true); setKnob(target) }} disabled=${!power || editMode}>SET</button>
  </div>
  ${power && html`<div style="text-align:center">
    <${CircularSlider}
    label=${editMode ? 'press save to apply' : `${tempformat(temp.min)}`}
    labelColor="#005a58"
    labelFontSize="1.5rem"
    knobColor="#005a58"
    knobDraggable=${editMode}
    progressColorFrom="#efd41d"
    progressColorTo="#ee3510"
    progressSize=${24}
    trackColor="#eeeeee"
    trackSize=${24}
    data=${knobValues}
    appendToValue="°C"
    prependToValue=${heating ? '♨' : ""}
    dataIndex=${dataIndex}
    onChange=${knobChange}
    width="250"
    hideKnob=${!editMode}
    />
  </div>`}
  ${!power && html`<div style="text-align:center;color:#005a58">
  <div style="font-size:1.5rem">${tempformat(temp.min)}</div>
  <div style="font-size:4rem">--</div>
  </div>`}
  ${editMode && html`<div style="text-align:right"><button onClick=${() => { saveTarget(); setEditMode(false) }} >Save</button>
  <button onClick=${() => { setKnob(target); setEditMode(false) }} >Cancel</button></div>`}
  <div><button onClick=${() => load('Day')}>DAY</button><button onClick=${() => load('Hour')}>HOUR</button></div>
  <div class="svg">
  <${Stats} data=${stats} sensors=${sensors} heating=${heating}/>    
  </div>
  <div>
  <${Usage} data=${stats}/>
  </div>
  <div>
  Uptime: ${uptimeToString(uptime)}
  </div>
  <div>
  Version: ${packageJson.version}
  </div>
  </div>`;
}

