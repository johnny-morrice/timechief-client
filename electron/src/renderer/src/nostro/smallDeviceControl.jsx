import { createSignal, onCleanup } from 'solid-js';
import { callbackName } from "./callback";
import { addDataCallback, removeDataCallback, removeDeviceStatusCallback, sendReboot, sendShutdown } from './ipc';

class Signals {
    constructor() {
        [this.deviceStatus, this.setDeviceStatus] = createSignal("");
        [this.launcherState, this.setLauncherState] = createSignal({});
        [this.disableShutdown, this.setDisableShutdown] = createSignal(false);
    }
}

function isShutdownDisabled(signals) {
    return signals.disableShutdown();
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

function onClickShutdown() {
    console.log("shutdown clicked")
    sendShutdown();
}

function onClickReboot() {
    console.log("reboot clicked")
    sendReboot();
}

export const SmallDeviceControl = () => {
    console.log("SmallDeviceControl render");
    const signals = new Signals();
    const cbName = callbackName("SmallDeviceControl")
    addDataCallback(cbName, (data) => updateSignalsForAPIData(signals, data));

    onCleanup(() => {
        removeDataCallback(cbName);
        removeDeviceStatusCallback(cbName);
    });

    return <div class="device-control flex-grow">
        <div class="flex-column flex-grow">
            <Show when={!isShutdownDisabled(signals)}>
                <button class='action-button crt-box flex-grow' onClick={onClickReboot}><i class='fa-solid fa-refresh'></i></button>
            </Show>
            <Show when={isShutdownDisabled(signals)}>
                <button class='action-button crt-box flex-grow' disabled onClick={onClickReboot}>{signals.rebootGlitch} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
            </Show>
            <Show when={!isShutdownDisabled(signals)}>
                <button class='action-button crt-box flex-grow' onClick={onClickShutdown}><i class='fa-solid fa-power-off'></i></button>
            </Show>
            <Show when={isShutdownDisabled(signals)}>
                <button class='action-button crt-box flex-grow' disabled onClick={onClickShutdown}><i class='fa-solid fa-power-off'></i></button>
            </Show>
        </div>
    </div>;
};