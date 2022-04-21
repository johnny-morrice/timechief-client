import { createSignal } from 'solid-js';
import { addClockDataCallback } from './ipc';
import { getTaskBarSignals } from './taskbarSignals';

class ConfigPageSignals {
  constructor() {
      [this.myIPAddress, this.setMyIPAddress] = createSignal("unknown IP");
      [this.deviceSerial, this.setDeviceSerial] = createSignal("");
      [this.location, this.setLocation] = createSignal("");
      [this.latitude, this.setLatitude] = createSignal("");
      [this.longitude, this.setLongitude] = createSignal("");
      [this.timezone, this.setTimezone] = createSignal("GB");
  }
}

function updateConfigPageSignals(signals, data) {
    let clock = data["Clock"];
    let location = clock["Location"];
    let deviceSerial = clock["DeviceSerial"];
    let latitude = clock["Latitude"];
    let longitude = clock["Longitude"];
    let timezone = clock["Timezone"];
    signals.setMyIPAddress("unknown IP")
    signals.setDeviceSerial(deviceSerial);
    signals.setLocation(location);
    signals.setLatitude(latitude);
    signals.setLongitude(longitude);
    signals.setTimezone(timezone);
}

export const ConfigPage = () => {
  let configSignals = new ConfigPageSignals();
  let taskBarSignals = getTaskBarSignals();

  addClockDataCallback((data) => updateConfigPageSignals(configSignals, data));

  return <div id="config-screen" style={{
        display: `${taskBarSignals.configDisplayStyle()}` 
        }}
        >
        <div class="column-flex">
            <div class='flex-element'>
                <div id='device-serial'>{configSignals.deviceSerial}</div>
            </div>
            <div class='flex-element'>
                <div id='ip-address'>{configSignals.myIPAddress}</div>
            </div>
            <div class='flex-element'>
                <div id='config-location'>{configSignals.location}</div>
            </div>
            <div class='flex-element'>
                <div id='config-timezone'>{configSignals.timezone}</div>
            </div>
            <div class='flex-element'>
                <div id='config-latitude'>{configSignals.latitude}</div>
            </div>
            <div class='flex-element'>
                <div id='config-longitude'>{configSignals.longitude}</div>
            </div>
        </div>
  </div>;
};