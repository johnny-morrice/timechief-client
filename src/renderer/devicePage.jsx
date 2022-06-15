import { createSignal } from 'solid-js';
import { addClockDataCallback, addDeviceStatusCallback, triggerRedeploy } from './ipc';

class DevicePageSignals {
  constructor() {
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
        [this.ipAddress, this.setIpAddress] = createSignal("unknown");
    }
}

function updateDevicePageSignals(signals, data) {
    let clock = data["Clock"];
    let location = clock["Location"];
    let deviceSerial = clock["DeviceSerial"];
    let latitude = clock["Latitude"];
    let longitude = clock["Longitude"];
    let timezone = clock["Timezone"];
    signals.setDeviceSerial(deviceSerial);
    signals.setLocation(location);
    signals.setLatitude(latitude);
    signals.setLongitude(longitude);
    signals.setTimezone(timezone);
}

function updateDeviceSignals(signals, statusResponse) {
    let isEnabled = statusResponse["redeploy_enabled"];
    const status = statusResponse["status"];
    const ipAddress = statusResponse["ip_address"];
    signals.setDeployEnabled(isEnabled);
    signals.setDeviceStatus(status);
    signals.setIpAddress(ipAddress);
}

var initialised = false;
let configSignals = new DevicePageSignals();
let deviceSignals = new DeviceSignals();

export const DevicePage = () => {

  if (!initialised) {
    addClockDataCallback((data) => updateDevicePageSignals(configSignals, data));
    addDeviceStatusCallback((status) => updateDeviceSignals(deviceSignals, status));
    initialised = true;
  }
  
  return <div id="config-screen">
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
                <div class='flex-element'>{deviceSignals.ipAddress}</div>
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