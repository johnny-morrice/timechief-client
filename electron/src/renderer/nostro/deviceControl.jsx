import { createSignal, onCleanup } from 'solid-js';
import { callbackName } from "./callback";
import { addDataCallback, addDeviceStatusCallback, removeDataCallback, removeDeviceStatusCallback, sendReboot, sendShutdown, sendSetupBegin } from './ipc';
import { glitchStyle, runTextGlitch } from './textGlitch';

class Signals {
    constructor() {
        [this.deviceStatus, this.setDeviceStatus] = createSignal("");
        [this.launcherState, this.setLauncherState] = createSignal({});
        [this.clientVersion, this.setClientVersion] = createSignal("");
        [this.disableShutdown, this.setDisableShutdown] = createSignal(false);
        [this.rebootGlitch, this.setRebootGlitch] = createSignal("Reboot");
        [this.shutdownGlitch, this.setShutdownGlitch] = createSignal("Shutdown");
    }
}

function isShutdownDisabled(signals) {
    return signals.disableShutdown();
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
    var disableShutdown = false;
    if ("LauncherState" in data) {
        let launcherState = data["LauncherState"];
        signals.setLauncherState(launcherState);
        if ("Flags" in launcherState) {
            let isUpdating = launcherState["Flags"].includes("updating");
            if (isUpdating) {
                disableShutdown = true;
            }
        }
    }
    signals.setDisableShutdown(disableShutdown);
    runTextGlitch(() => isShutdownDisabled(signals), signals.setRebootGlitch, "Reboot", 100);
    runTextGlitch(() => isShutdownDisabled(signals), signals.setShutdownGlitch, "Shutdown", 100);
}

function updateSignalsForElectronStatus(signals, statusResponse) {
    const status = statusResponse["status"];
    const clientVersion = statusResponse["client_version"];
    signals.setClientVersion(clientVersion);
    signals.setDeviceStatus(status);
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
    const cbName = callbackName("DeviceControl")
    addDataCallback(cbName, (data) => updateSignalsForAPIData(signals, data));
    addDeviceStatusCallback(cbName, (status) => updateSignalsForElectronStatus(signals, status));

    onCleanup(() => {
        removeDataCallback(cbName);
        removeDeviceStatusCallback(cbName);
    });
    return <div class="device-control flex-grow">
        <div class="flex-column flex-grow">
            <div class="flex-grow flex-row">
                <Show when={!isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' onClick={onClickReboot}>Reboot &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                </Show>
                <Show when={isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' style={glitchStyle("Reboot")} disabled onClick={onClickReboot}>{signals.rebootGlitch} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                </Show>
            </div>
            <div class="flex-grow flex-row">
                <Show when={!isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' onClick={onClickShutdown}>Shutdown &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                </Show>
                <Show when={isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' style={glitchStyle("Reboot")} disabled onClick={onClickShutdown}>{signals.shutdownGlitch} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                </Show>
            </div>
            <div class="flex-grow flex-row">
                <button class='action-button crt-box flex-grow' onClick={onClickSetup}>Setup device &nbsp;&nbsp; <i class="fa-solid fa-gear"></i></button>
            </div>
            <Show when={hasDeviceStatus(signals)}>
                <div class="flex-row flex-grow">
                    <div class="data-label">Status</div>
                    <div class="data-value">{getDeviceStatus(signals)}</div>
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