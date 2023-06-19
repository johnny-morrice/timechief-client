import { createSignal } from 'solid-js';
import { addDataCallback, addDeviceStatusCallback, sendReboot, sendShutdown, sendSetupBegin } from './ipc';

class DeviceSignals {
    constructor() {
        [this.deviceSerial, this.setDeviceSerial] = createSignal("");
        [this.deviceStatus, this.setDeviceStatus] = createSignal("unknown");
        [this.launcherState, this.setLauncherState] = createSignal({});
        [this.ipAddress, this.setIpAddress] = createSignal("unknown");
        [this.clientVersion, this.setClientVersion] = createSignal("");
    }
}

function getDeviceStatus(signals) {
    let launcherState = signals.launcherState();
    if ("Flags" in launcherState) {
        let isUpdating = launcherState["Flags"].includes("updating");
        if (isUpdating) {
            return "updating";
        }
    }
    if ("ActiveTargetVersion" in launcherState) {
        let activeTargetVersion = launcherState["ActiveTargetVersion"];
        let currentVersion = signals.clientVersion();
        if (currentVersion && activeTargetVersion && activeTargetVersion !== currentVersion) {
            return "restart to update to version " + activeTargetVersion;
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
    const status = statusResponse["status"];
    const ipAddress = statusResponse["ip_address"];
    const clientVersion = statusResponse["client_version"];
    signals.setClientVersion(clientVersion);
    signals.setDeviceStatus(status);
    signals.setIpAddress(ipAddress);
}

function onClickShutdown() {
    console.log("shutdown clicked")
    sendShutdown();
}

function onClickReboot() {
    console.log("reboot clicked")
    sendReboot();
}

function onClickSetup() {
    console.log("setup clicked")
    sendSetupBegin();
}

var initialised = false;
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
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Reboot</div>
                <button class='flex-element crt-box' onClick={onClickReboot}><i class='fa-solid fa-refresh'></i></button>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Shutdown</div>
                <button class='flex-element crt-box' onClick={onClickShutdown}><i class='fa-solid fa-power-off'></i></button>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Setup device</div>
                <button class='flex-element crt-box' onClick={onClickSetup}><i class="fa-solid fa-gear"></i></button>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Device status</div>
                <div class='flex-element'>{getDeviceStatus(deviceSignals)}</div>
            </div>
            <div class='row-flex flex-element'>
                <div class='flex-element data-name'>Client version</div>
                <div class='flex-element'>{deviceSignals.clientVersion()}</div>
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