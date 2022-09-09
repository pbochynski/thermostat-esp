import './style';
import CircularSlider from '@fseehawer/react-circular-slider';
import { html } from 'htm/preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import Stats from './stats'

let host = location.host;
// let host = '192.168.0.104';
var rpc = 'http://' + host + '/rpc'

const knobValues = (() => {
  let d = [];
  for (let i = 170; i <= 250; ++i) {
    d.push(i / 10);
  }
  return d;
})();


function alias(id) {
  let aliases = {
    heating: "Heating",
    esp32_06F1B0: "Living Room",
    esp32_0BA4CC: "Kitchen"
  }
  return aliases[id] || id;
}


function tempformat(dec) {
  if (dec == null)
    return "--.-";
  return parseInt(dec) + '.' + parseInt(dec * 10) % 10 + '°C';
}


export default function App(props) {
  const [target, setTarget] = useState(21.5);
  const [power, setPower] = useState(true);
  const [sensors, setSensors] = useState([]);
  const [knob, setKnob] = useState(21.5);
  const [heating, setHeating] = useState(0);
  const [temp, setTemp] = useState({ min: null, max: null })
  const [stats,setStats] = useState({datasets:[]})

  async function post(url, data) {
    const response = await fetch(url, {
      method: 'POST', headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify(data)
    })
    const json = await response.json();
    console.log(json);
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
    console.log("load triggered")
    fetch(rpc + `/Stats.${period}`).then((response) => response.json()).then((data) => {
      data.scales=[
        {label:"Time", dynamic: false, points:true, min: Date.now()-(period=='Hour'? 3600000 : 86400000), max: Date.now(),index:0},
        {label:"Temperature", dynamic: true, line:true, points:true, index:0},
        {label:"Heating", dynamic: false, area:true, min:0, max:1.1, index:1}
      ]
      for (let i = 0; i < data.datasets.length; ++i) {
        let ds=data.datasets[i];
        ds.scaleX=0;
        ds.scaleY = (ds.label==='heating') ? 2:1;
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
  useEffect(()=>{
    load('Hour');
  },[]);
  const fetchState = (init) => {
    fetch(rpc + '/State')
      .then((response) => response.json())
      .then((state) => {
        setSensors(state.sensors)
        setPower(state.power === 'on');
        setTarget(state.target);
        setHeating(state.on);
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
        if (init) {
          setKnob(state.target);
        }
      });
  }

  useEffect(() => {
    fetchState(true);
    const interval = setInterval(() => {
      fetchState(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const switchPower = (value) => {
    setPower(value);
    savePower(value ? 'on' : 'off');
    setKnob(target);
  }
  let edit = power && knob != target;
  
  const knobChange = (value) => {
    setKnob(value);
  }
  return html`<div class="container">
  <div>
  <button onClick=${() => { switchPower(true) }} disabled=${power}>ON</button><button onClick=${() => switchPower(false)} disabled=${!power}>OFF</button>
  </div>
  ${power && html`<div style="text-align:center">
    <${CircularSlider}
    label=${edit ? 'press save to apply' : `${tempformat(temp.min)}`}
    labelColor="#005a58"
    knobColor="#005a58"
    knobDraggable=${power}
    progressColorFrom="#efd41d"
    progressColorTo="#ee3510"
    progressSize=${24}
    trackColor="#eeeeee"
    trackSize=${24}
    data=${knobValues}
    appendToValue="°C"
    prependToValue=${heating ? '♨' : ""}
    dataIndex=${knob * 10 - 170}
    onChange=${knobChange}
    width="250"
    />
  </div>`}
  ${!power && html`<div style="text-align:center;color:#005a58">
  <div style="font-size:1rem">${tempformat(temp.min)}</div>
  <div style="font-size:4rem">--.-</div>
  </div>`}
  ${edit && html`<div style="text-align:right"><button onClick=${saveTarget} >Save</button><button onClick=${() => setKnob(target)} >Cancel</button></div>`}
  <div><button onClick=${() => load('Day')}>DAY</button><button onClick=${() => load('Hour')}>HOUR</button></div>
  <div style="min-width:250px">
  <${Stats} data=${stats} sensors=${sensors}/>    
  </div>
  </div>`;
}

