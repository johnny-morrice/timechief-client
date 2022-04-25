import { createSignal } from 'solid-js';
import { addClockDataCallback, addRedeployCallback } from './ipc';
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

class RedeploySignals {
    constructor() {
        [this.isDeployEnabled, this.setDeployEnabled] = createSignal(false);
        [this.deployStatus, this.setDeployStatus] = createSignal("");
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

function updateRedeploySignals(signals, data) {
    let isEnabled = data['redeploy_enabled'];
    var status = data['status'];
    signals.setEnabled(isEnabled);
    signals.setDeployStatus(status);
}

export const ConfigPage = () => {
  let configSignals = new ConfigPageSignals();
  let deploySignals = new RedeploySignals();
  let taskBarSignals = getTaskBarSignals();

  addClockDataCallback((data) => updateConfigPageSignals(configSignals, data));
  addRedeployCallback((data) => updateRedeploySignals(updateRedeploySignals(deploySignals, data)));

  return <div id="config-screen" style={{
        display: `${taskBarSignals.configDisplayStyle()}` 
        }}
        >
        <div class="column-flex">
            <div class='flex-element section-name underline'>Settings</div>
            <Show when={deploySignals.isDeployEnabled()}>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Redeploy</div>
                    <button class='flex-element' onClick={triggerRedeploy()}><i class='fa-solid fa-refresh'></i></button>
                </div>
            </Show>
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