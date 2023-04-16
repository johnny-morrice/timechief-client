import { createSignal } from 'solid-js';
import { addDataCallback, addDeviceStatusCallback, triggerRedeploy } from './ipc';

class DeviceSignals {
    constructor() {
        [this.deviceSerial, this.setDeviceSerial] = createSignal("");
        [this.isDeployEnabled, this.setDeployEnabled] = createSignal(false);
        [this.deviceStatus, this.setDeviceStatus] = createSignal("unknown");
        [this.launcherState, this.setLauncherState] = createSignal({});
        [this.ipAddress, this.setIpAddress] = createSignal("unknown");
        [this.clientVersion, this.setClientVersion] = createSignal("");
    }
}

function getDeviceStatus(signals) {
    let launcherState = signals.launcherState();
    console.log("launcher state: ", JSON.stringify(launcherState));
    if ("Flags" in launcherState) {
        let isUpdating = launcherState["Flags"].includes("updating");
        if (isUpdating) {
            return "updating";
        }
    }
    if ("ActiveTargetVersion" in launcherState) {
        let activeTargetVersion = launcherState["ActiveTargetVersion"];
        let currentVersion = signals.clientVersion();
        if (activeTargetVersion !== currentVersion) {
            return "restart to update";
        }
    }
    return signals.deviceStatus();
}

function updateSignalsForAPIData(signals, data) {
    if ("ServiceData" in data) {
        let serviceData = data["ServiceData"];
        let clock = serviceData["Clock"];
        let deviceSerial = clock["DeviceSerial"];
        signals.setDeviceSerial(deviceSerial);
    }
    if ("LauncherState" in data) {
        let launcherState = data["LauncherState"];
        signals.setLauncherState(launcherState);
    }
}

function updateSignalsForElectronStatus(signals, statusResponse) {
    let isEnabled = statusResponse["redeploy_enabled"];
    const status = statusResponse["status"];
    const ipAddress = statusResponse["ip_address"];
    const clientVersion = statusResponse["client_version"];
    signals.setClientVersion(clientVersion);
    signals.setDeployEnabled(isEnabled);
    signals.setDeviceStatus(status);
    signals.setIpAddress(ipAddress);
}

var initialised = false;
// TODO wtf why do we have two of these?
let deviceSignals = new DeviceSignals();

export const DevicePage = () => {

  if (!initialised) {
    addDataCallback((data) => updateSignalsForAPIData(deviceSignals, data));
    addDeviceStatusCallback((status) => updateSignalsForElectronStatus(deviceSignals, status));
    initialised = true;
  }
  
  return <div id="config-screen">
        <div class="column-flex">
            <div class='flex-element section-name underline'>About this device</div>
            <Show when={deviceSignals.isDeployEnabled()}>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Redeploy device</div>
                    <button class='flex-element' onClick={triggerRedeploy}><i class='fa-solid fa-refresh'></i></button>
                </div>
            </Show>
            <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Device status</div>
                    <div class='flex-element'>{getDeviceStatus(deviceSignals)}</div>
                </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device Serial Number</div>
                <div class='flex-element'>{deviceSignals.deviceSerial}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device IP Address</div>
                <div class='flex-element'>{deviceSignals.ipAddress}</div>
            </div>
        </div>
  </div>;
};