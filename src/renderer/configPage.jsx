import { createSignal } from 'solid-js';
import { addClockDataCallback, addDeviceStatusCallback, triggerRedeploy } from './ipc';
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

class DeviceSignals {
    constructor() {
        [this.isDeployEnabled, this.setDeployEnabled] = createSignal(false);
        [this.deviceStatus, this.setDeviceStatus] = createSignal("unknown");
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

function updateDeviceSignals(signals, status) {
    let isEnabled = status['redeploy_enabled'];
    var status = status['status'];
    signals.setDeployEnabled(isEnabled);
    signals.setDeviceStatus(status);
}

export const ConfigPage = () => {
  let configSignals = new ConfigPageSignals();
  let deviceSignals = new DeviceSignals();
  let taskBarSignals = getTaskBarSignals();

  addClockDataCallback((data) => updateConfigPageSignals(configSignals, data));
  addDeviceStatusCallback((status) => updateDeviceSignals(deviceSignals, status));

  return <div id="config-screen" style={{
        display: `${taskBarSignals.configDisplayStyle()}` 
        }}
        >
        <div class="column-flex">
            <div class='flex-element section-name underline'>Settings</div>
            <Show when={deviceSignals.isDeployEnabled()}>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Redeploy device</div>
                    <button class='flex-element' onClick={triggerRedeploy}><i class='fa-solid fa-refresh'></i></button>
                </div>
            </Show>
            <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Device status</div>
                    <div class='flex-element'>{deviceSignals.deviceStatus}</div>
                </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device Serial Number</div>
                <div class='flex-element'>{configSignals.deviceSerial}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device IP Address</div>
                <div class='flex-element'>{configSignals.myIPAddress}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device Location</div>
                <div class='flex-element'>{configSignals.location}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device Timezone</div>
                <div class='flex-element'>{configSignals.timezone}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device coordinates</div>
                <div class='flex-element'>{configSignals.latitude}, {configSignals.longitude}</div> 
            </div>
        </div>
  </div>;
};