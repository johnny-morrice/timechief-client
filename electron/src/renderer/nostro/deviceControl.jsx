import { createSignal, onCleanup } from 'solid-js';
import { addDataCallback, addDeviceStatusCallback, removeDataCallback, removeDeviceStatusCallback, sendReboot, sendShutdown, sendSetupBegin } from './ipc';

class Signals {
    constructor() {
        [this.deviceSerial, this.setDeviceSerial] = createSignal("");
        [this.deviceStatus, this.setDeviceStatus] = createSignal("");
        [this.launcherState, this.setLauncherState] = createSignal({});
        [this.ipAddress, this.setIpAddress] = createSignal("unknown");
        [this.clientVersion, this.setClientVersion] = createSignal("");
    }
}

function hasDeviceStatus(signals) {
    const status = getDeviceStatus(signals);
    return status.length > 0;
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
            return "needs restart"
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

export const DeviceControl = () => {
    const signals = new Signals();
    addDataCallback("DeviceControl", (data) => updateSignalsForAPIData(signals, data));
    addDeviceStatusCallback("DeviceControl", (status) => updateSignalsForElectronStatus(signals, status));

    onCleanup(() => {
        removeDataCallback("DeviceControl");
        removeDeviceStatusCallback("DeviceControl");
    });
    return <div class="device-control">
        <div class="flex-column flex-grow">
            <div class="flex-grow flex-row">
                <button class='action-button crt-box flex-grow' onClick={onClickReboot}>Reboot &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                <div class="flex-grow"></div>
            </div>
            <div class="flex-grow flex-row">
                <button class='action-button crt-box flex-grow' onClick={onClickShutdown}>Shutdown &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                <div class="flex-grow"></div>
            </div>
            <div class="flex-grow flex-row">
                <button class='action-button crt-box flex-grow' onClick={onClickSetup}>Setup device &nbsp;&nbsp; <i class="fa-solid fa-gear"></i></button>
                <div class="flex-grow"></div>
            </div>
            <Show when={hasDeviceStatus(signals)}>
                <div class="flex-row flex-grow">
                    <div class="data-row-label">Status</div>
                    <div class="data-row-value">{getDeviceStatus(signals)}</div>
                </div>
            </Show>
            <Show when={!hasDeviceStatus(signals)}>
                <div class="flex-row flex-grow">
                    <div><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </Show>
        </div>
    </div>;
};