# Thermostat ESP

## Configuration

```bash
export MOS_PORT=$(ls /dev/cu.usb*)  # /dev/cu.usbserial-014ADBF6
export MOS_PLATFORM=esp32 
export SSID= # your home WIFI network name
export PASS= # your WIFI pass
export AP_SSID=thermostat_?????? # thermostat WIFI network name
export AP_PASS=# thermostat WIFI network pass
export REMOTEURL=ws://192.168.0.104/rpc

mos config-set wifi.sta.enable=true wifi.ap.enable=true  wifi.sta.ssid=$SSID wifi.sta.pass=$PASS wifi.ap.ssid=$AP_SSID wifi.ap.pass=$AP_PASS dns_sd.enable=true dash.enable=true dash.token=$TOKEN therm.remoteurl=$REMOTEURL 
```

