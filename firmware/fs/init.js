load('api_config.js');
load('api_rpc.js');
load('api_timer.js');
load('api_gpio.js');
load('api_ds18b20.js');
load('api_sys.js');

let relay = 4;
let on = 0;
let target = Cfg.get;
let data = {
  uptime: 0,
  datasets: [
  ]
};

let data300 = {
  uptime: 0,
  datasets: [
  ]
};

GPIO.set_mode(relay, GPIO.MODE_OUTPUT);
GPIO.set_pull(relay, GPIO.PULL_DOWN);

function findOrCreateDataSet(d, label) {
  for (let i = 0; i < d.datasets.length; ++i) {
    if (d.datasets[i].label === label) {
      return d.datasets[i];
    }
  }
  let dataset = { label: id, data: [] };
  d.datasets.push(dataset);
  return dataset;
}

function getMin(sensors) {
  let t = null;
  for (let i = 0; i < sensors.length; ++i) {
    if (t === null || sensors[i].t < t) {
      t = sensors[i].t;
    }
  }
  return t;
}


function getState(data, t, maxAge) {
  let res = { uptime: t, power: Cfg.get('therm.mode'), on: on, target: Cfg.get('therm.t'), sensors: [] };
  for (let di = 0; di < data.datasets.length; ++di) {
    if (data.datasets[di].label === 'heating') {
      continue;
    }
    let index = Math.floor(t / 60) % 60;
    let minIndex = Math.floor((t - maxAge) / 60) % 60;
    let ds = data.datasets[di];
    let d = ds.data;
    for (let i = index; i >= minIndex && i >= 0; --i) {
      if (d[i] && d[i].x >= t - maxAge) {
        res.sensors.push({ id: ds.label, age: t - d[i].x, t: d[i].y, on: on });
        break;
      }
    }
  }
  return res;
}
function addState(data, uptime, id, t) {
  let dataset = findOrCreateDataSet(data, id);
  let aggDataset = findOrCreateDataSet(data300, id);
  dataset.data[Math.floor(uptime / 60) % 60] = { x: uptime, y: t };
  let t1 = Math.floor(uptime / 600) * 600;
  let t2 = t1 + 600;
  let sum = 0.0, count = 0;
  let index = Math.floor(t1 / 60) % 60;
  for (let i = index; i >= 0 && i < index + 5; ++i) {
    if (dataset.data[i] && dataset.data[i].x && dataset.data[i].x >= t1 && dataset.data[i].x < t2) {
      sum += dataset.data[i].y;
      count += 1;
    }
  }
  if (count > 0) {
    aggDataset.data[Math.floor(t1 / 600) % 144] = { x: t1, y: sum / count };
  }
}

function generate(data, agg, sensorIds, t1, t2, interval) {
  for (let time = t1; time < t2; time += interval) {
    for (let i = 0; i < sensorIds.length; ++i) {
      let t = 22.5 + Math.sin((time / 3000) + 2 * i);
      addState(data, time, sensorIds[i], t);
    }
  }
}

Timer.set(15000, true, function () {
  let id = Cfg.get("device.id");
  let t = DS18B20.get();
  addState(data, Sys.uptime(), id, t);
  let minT = getMin(getState(data, Sys.uptime(), 60).sensors);
  if (Cfg.get('therm.mode') === 'off') {
    on = 0;
  } else {
    if (minT < Cfg.get('therm.t')) {
      on = 1;
    } else if (minT > Cfg.get('therm.t') + 0.1) {
      on = 0;
    }
  }
  addState(data, Sys.uptime(), 'heating', on);
  print('Temp, Min temp, Thermostat state', t, minT, on);
  GPIO.write(relay, !on); // activate on low level
  if (Cfg.get('therm.remoteurl')) {
    print('calling remote', Cfg.get('therm.remoteurl'))
    RPC.call(Cfg.get('therm.remoteurl'), 'State', { id: id, t: t }, function (result, err_code, err_msg, ud) {
      if (err_code !== 0) {
        print("Error: (" + JSON.stringify(err_code) + ') ' + err_msg);
      } else {
        print('Result: ' + JSON.stringify(result));
      }
    }, null);
  }
}, null);

RPC.addHandler('Stats.Hour', function () {
  data.uptime = Sys.uptime();
  return data;
});

RPC.addHandler('Stats.Day', function () {
  data300.uptime = Sys.uptime();
  return data300;
});

RPC.addHandler('State', function (args) {
  if (args && args.id) {
    print("add state", JSON.stringify(args))
    addState(data, Sys.uptime(), args.id, args.t);
  }
  return getState(data, Sys.uptime(), 60);
});

RPC.addHandler('Generator', function (args) {
  if (args && args.t1 && args.t2 && args.interval) {
    generate(data, data300, ["esp1", "esp2", "esp3"], args.t1, args.t2, args.interval);
    return 'ok';
  }
});