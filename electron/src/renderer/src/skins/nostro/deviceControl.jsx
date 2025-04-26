import { createSignal, onCleanup } from 'solid-js';
import { callbackName } from "../../util/callback";
import { addDataCallback, addDeviceStatusCallback, removeDataCallback, removeDeviceStatusCallback, sendReboot, sendSetupBegin, sendLogOut, sendShutdown } from '../../ipc';
import { LineLoading } from './loading';
import { labelMaker, textMaker } from '../../components/label';

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
    if ("flags" in launcherState) {
        const isUpdating = launcherState["flags"].includes("updating");
        if (isUpdating) {
            return "updating";
        }
        const isCalendarError = launcherState["flags"].includes("calendar-error");
        if (isCalendarError) {
            return "error";
        }
        const isDeviceDataError = launcherState["flags"].includes("device-data-error");
        if (isDeviceDataError) {
            return "error";
        }
    }
    if ("active_target_version" in launcherState) {
        let activeTargetVersion = launcherState["active_target_version"];
        let currentVersion = signals.clientVersion();
        if (currentVersion && activeTargetVersion && activeTargetVersion !== currentVersion) {
            return "restart"
        }
    }
    return signals.deviceStatus();
}

function updateSignalsForAPIData(signals, data) {
    var disableShutdown = false;
    if ("launcher_state" in data) {
        let launcherState = data["launcher_state"];
        signals.setLauncherState(launcherState);
        if ("flags" in launcherState) {
            let isUpdating = launcherState["flags"].includes("updating");
            if (isUpdating) {
                disableShutdown = true;
            }
        }
    }
    signals.setDisableShutdown(disableShutdown);
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

function onClickLogout() {
    console.log("logout clicked")
    sendLogOut();
}

export const DeviceControl = () => {
    console.log("DeviceControl render");
    const signals = new Signals();
    const cbName = callbackName("DeviceControl")
    addDataCallback(cbName, (data) => updateSignalsForAPIData(signals, data));
    addDeviceStatusCallback(cbName, (status) => updateSignalsForElectronStatus(signals, status));

    onCleanup(() => {
        removeDataCallback(cbName);
        removeDeviceStatusCallback(cbName);
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
                    <button class='action-button crt-box flex-grow' disabled onClick={onClickReboot}>{plainText("reboot")} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                </Show>
            </div>
            <div class="flex-grow flex-row">
                <Show when={!isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' onClick={onClickShutdown}>{plainText("shutdown")} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                </Show>
                <Show when={isShutdownDisabled(signals)}>
                    <button class='action-button crt-box flex-grow' disabled onClick={onClickShutdown}>{plainText("shutdown")} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                </Show>
            </div>
            <div class="flex-grow flex-row">
                <button class='action-button crt-box flex-grow' onClick={onClickSetup}>{plainText("setup-wifi")} &nbsp;&nbsp; <i class="fa-solid fa-gear"></i></button>
            </div>
            <div class="flex-grow flex-row">
                <button class='action-button crt-box flex-grow' onClick={onClickLogout}>{plainText("logout")} &nbsp;&nbsp; <i class="fa-solid fa-right-from-bracket"></i></button>
            </div>
            <Show when={hasDeviceStatus(signals)}>
                <div class="flex-row flex-grow">
                    <div class="data-label">{label("status")}</div>
                    <div class="data-value">{getDeviceStatus(signals)}</div>
                </div>
            </Show>
            <Show when={!hasDeviceStatus(signals)}>
                <LineLoading />
            </Show>
        </div>
    </div>;
};