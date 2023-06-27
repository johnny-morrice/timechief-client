import { createSignal, onCleanup } from 'solid-js';
import { addDataCallback, addDeviceStatusCallback, removeDataCallback, removeDeviceStatusCallback } from './ipc';
import { callbackName } from "./callback";
import { Loading } from './loading';
import { textTransitionSignal } from "./textGlitch";

class Signals {
    constructor() {
        [this.ipAddress, this.setIpAddress] = textTransitionSignal("");
        [this.activeTargetVersion, this.setActiveTargetVersion] = createSignal("");
        [this.clientVersion, this.setClientVersion] = createSignal("");
        [this.clientVersionText, this.setClientVersionText] = textTransitionSignal("");
        [this.activeTargetVersionText, this.setActiveTargetVersionText] = textTransitionSignal("");
    }
}

function hasDeviceInfo(signals) {
    const clientVersion = signals.clientVersion();
    return clientVersion.length > 0;
}

function hasUpdateVersion(signals) {
    const activeTargetVersion = signals.activeTargetVersion();
    const clientVersion = signals.clientVersion();
    return activeTargetVersion.length > 0 && clientVersion.length > 0 && activeTargetVersion !== clientVersion;
}

function updateSignalsForAPIData(signals, data) {
    if ("LauncherState" in data) {
        let launcherState = data["LauncherState"];
        if ("ActiveTargetVersion" in launcherState) {
            let activeTargetVersion = launcherState["ActiveTargetVersion"];
            signals.setActiveTargetVersion(activeTargetVersion);
            signals.setActiveTargetVersionText(activeTargetVersion);
        }
    }
}

function updateSignalsForElectronStatus(signals, statusResponse) {
    const ipAddress = statusResponse["ip_address"];
    const clientVersion = statusResponse["client_version"];
    signals.setClientVersionText(clientVersion);
    signals.setClientVersion(clientVersion);
    signals.setIpAddress(ipAddress);
}

export const DeviceInfo = () => {
    const signals = new Signals();
    const cbName = callbackName("DeviceInfo");

    addDataCallback(cbName, (data) => updateSignalsForAPIData(signals, data));
    addDeviceStatusCallback(cbName, (statusResponse) => updateSignalsForElectronStatus(signals, statusResponse));
    onCleanup(() => {
        removeDataCallback(cbName);
        removeDeviceStatusCallback(cbName);
    });

    return <div class="device-control flex-column flex-grow">
        <Show when={!hasDeviceInfo(signals)}>
            <Loading />
        </Show>
        <Show when={hasDeviceInfo(signals)}>
            <div class="flex-row flex-grow">
                <div class="device-info-labels flex-column flex-grow">
                    <div class="data-label flex-grow">IP</div>
                    <div class="data-label flex-grow">Software version</div>
                    <Show when={hasUpdateVersion(signals)}>
                        <div class="data-label flex-grow">Update version</div>
                    </Show>
                </div>
                <div class="device-info-values flex-column flex-grow">
                    <div class="data-value flex-grow">{signals.ipAddress}</div>
                    <div class="data-value flex-grow">{signals.clientVersionText}</div>
                    <Show when={hasUpdateVersion(signals)}>
                        <div class="data-value flex-grow">{signals.activeTargetVersionText}</div>
                    </Show>
                </div>
            </div>
        </Show>
    </div>;
};