import { createEffect, createSignal, onCleanup } from 'solid-js';
import { callbackName } from "./callback";
import { addDataCallback, addDeviceStatusCallback, removeDataCallback, removeDeviceStatusCallback, sendReboot, sendLoggedIn, sendSetupBegin } from './ipc';
import { buttonGlitchStyle, runButtonGlitch } from './textGlitch';
import { Loading } from './loading';
import { labelMaker, textMaker } from './label';

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
    // signals.setDisableShutdown(fakeIsShutdown());
    signals.setDisableShutdown(disableShutdown);
}

var fakeShutdownLastChanged = Date.now();
var fakeShutdownFlag = false;
function fakeIsShutdown() {
    const flipDuration = 10000;
    if (Date.now() - fakeShutdownLastChanged > flipDuration) {
        fakeShutdownLastChanged = Date.now();
        fakeShutdownFlag = !fakeShutdownFlag;
    }
    return fakeShutdownFlag;
}

function updateSignalsForElectronStatus(signals, statusResponse) {
    const status = statusResponse["status"];
    const clientVersion = statusResponse["client_version"];
    signals.setClientVersion(clientVersion);
    signals.setDeviceStatus(status);
}

function onClickShutdown() {
    console.log("shutdown clicked")
    sendLoggedIn();
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

    createEffect(() => {
        if (isShutdownDisabled(signals)) {
            runButtonGlitch(() => isShutdownDisabled(signals), signals.setRebootGlitch, "Reboot", 150);
            runButtonGlitch(() => isShutdownDisabled(signals), signals.setShutdownGlitch, "Shutdown", 150);
        }
    });

    const label = labelMaker("device-control");
    const plainText = textMaker("device-control");
    return <div class="device-control flex-grow">
        <div class="flex-column flex-grow">
            <div class="flex-grow flex-row">
                <Show when={!isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' onClick={onClickReboot}>{plainText("reboot")} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                </Show>
                <Show when={isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' style={buttonGlitchStyle(plainText("reboot"))} disabled onClick={onClickReboot}>{signals.rebootGlitch} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                </Show>
            </div>
            <div class="flex-grow flex-row">
                <Show when={!isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' onClick={onClickShutdown}>{plainText("shutdown")} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                </Show>
                <Show when={isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' style={buttonGlitchStyle(plainText("shutdown"))} disabled onClick={onClickShutdown}>{signals.shutdownGlitch} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                </Show>
            </div>
            <div class="flex-grow flex-row">
                <button class='action-button crt-box flex-grow' onClick={onClickSetup}>{plainText("setup")} &nbsp;&nbsp; <i class="fa-solid fa-gear"></i></button>
            </div>
            <Show when={hasDeviceStatus(signals)}>
                <div class="flex-row flex-grow">
                    <div class="data-label">{label("status")}</div>
                    <div class="data-value">{getDeviceStatus(signals)}</div>
                </div>
            </Show>
            <Show when={!hasDeviceStatus(signals)}>
                <Loading />
            </Show>
        </div>
    </div>;
};