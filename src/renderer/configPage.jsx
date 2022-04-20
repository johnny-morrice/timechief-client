import { createSignal } from 'solid-js';
import { addClockDataCallback } from './ipc';

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
  let signals = new ConfigPageSignals();

  addClockDataCallback((data) => updateConfigPageSignals(signals, data));

  return <div id="config-screen">
        <div class="column-flex">
            <div class='flex-element'>
                <div id='device-serial'>deviceSerial</div>
            </div>
            <div class='flex-element'>
                <div id='ip-address'>{signals.myIPAddress}</div>
            </div>
            <div class='flex-element'>
                <div id='config-location'>{signals.location}</div>
            </div>
            <div class='flex-element'>
                <div id='config-timezone'>{signals.timezone}</div>
            </div>
            <div class='flex-element'>
                <div id='config-latitude'>{signals.latitude}</div>
            </div>
            <div class='flex-element'>
                <div id='config-longitude'>{signals.longitude}</div>
            </div>
        </div>
  </div>;
};