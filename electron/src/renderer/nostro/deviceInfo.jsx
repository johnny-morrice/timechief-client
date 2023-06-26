import { createSignal, onCleanup } from 'solid-js';
import { addDataCallback, addDeviceStatusCallback, sendReboot, sendShutdown, sendSetupBegin, removeDataCallback, removeDeviceStatusCallback } from './ipc';

class Signals {
    constructor() {
        [this.ipAddress, this.setIpAddress] = createSignal("");
        [this.activeTargetVersion, this.setActiveTargetVersion] = createSignal("");
        [this.clientVersion, this.setClientVersion] = createSignal("");
    }
}

function hasDeviceInfo(signals) {
    const ipAddress = signals.ipAddress();
    const clientVersion = signals.clientVersion();
    return ipAddress.length > 0 && clientVersion.length > 0;
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
        }
    }
}

function updateSignalsForElectronStatus(signals, statusResponse) {
    const ipAddress = statusResponse["ip_address"];
    const clientVersion = statusResponse["client_version"];
    signals.setClientVersion(clientVersion);
    signals.setIpAddress(ipAddress);
}

export const DeviceInfo = () => {
    const signals = new Signals();
    addDataCallback("DeviceInfo", (data) => updateSignalsForAPIData(signals, data));
    addDeviceStatusCallback("DeviceInfo", (statusResponse) => updateSignalsForElectronStatus(signals, statusResponse));
    onCleanup(() => {
        removeDataCallback("DeviceInfo");
        removeDeviceStatusCallback("DeviceInfo");
    });

    return <div class="device-control flex-grow">
        <Show when={!hasDeviceInfo(signals)}>
            <div class="device-info-loading-indicator"><i class="fa-solid fa-spinner fa-spin"></i></div>
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
                    <div class="data-value flex-grow">{signals.clientVersion}</div>
                    <Show when={hasUpdateVersion(signals)}>
                        <div class="data-value flex-grow">{signals.activeTargetVersion}</div>
                    </Show>
                </div>
            </div>
        </Show>
    </div>;
};