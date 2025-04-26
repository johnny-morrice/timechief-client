import { createSignal, onCleanup } from 'solid-js';
import { addDataCallback, addDeviceStatusCallback, removeDataCallback, removeDeviceStatusCallback } from './ipc';
import { callbackName } from "../util/callback";
import { Loading } from './loading';
import { textTransitionSignal } from "../util/textGlitch";
import { labelMaker } from '../components/label';

class Signals {
    constructor() {
        [this.ipAddress, this.setIpAddress] = textTransitionSignal("");
        [this.networkType, this.setNetworkType] = textTransitionSignal("");
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
    if ("launcher_state" in data) {
        let launcherState = data["launcher_state"];
        if ("active_target_version" in launcherState) {
            let activeTargetVersion = launcherState["active_target_version"];
            signals.setActiveTargetVersion(activeTargetVersion);
            signals.setActiveTargetVersionText(activeTargetVersion);
        }
        const networkState = launcherState["network_state"];
        if (!networkState) {
            return;
        }
        const networkType = networkState["network_type"];
        if (!networkType) {
            return;
        }
        signals.setNetworkType(networkState["network_type"]);
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
    console.log("DeviceInfo render");
    const signals = new Signals();
    const cbName = callbackName("DeviceInfo");

    addDataCallback(cbName, (data) => updateSignalsForAPIData(signals, data));
    addDeviceStatusCallback(cbName, (statusResponse) => updateSignalsForElectronStatus(signals, statusResponse));
    onCleanup(() => {
        removeDataCallback(cbName);
        removeDeviceStatusCallback(cbName);
    });

    const label = labelMaker("device-info");
    return <div class="device-control flex-column flex-grow">
        <Show when={!hasDeviceInfo(signals)}>
            <Loading />
        </Show>
        <Show when={hasDeviceInfo(signals)}>
            <div class="flex-row flex-grow">
                <div class="device-info-labels flex-column flex-grow">
                    <div class="data-label flex-grow">{label("ip-address")}</div>
                    <div class="data-label flex-grow">{label("network-type")}</div>
                    <div class="data-label flex-grow">{label("software-version")}</div>
                    {/* <Show when={hasUpdateVersion(signals)}>
                        <div class="data-label flex-grow">{label("update-version")}</div>
                    </Show> */}
                </div>
                <div class="device-info-values flex-column flex-grow">
                    <div class="data-value flex-grow">{signals.ipAddress}</div>
                    <div class="data-value flex-grow">{signals.networkType}</div>
                    <div class="data-value flex-grow">{signals.clientVersionText}</div>
                    {/* <Show when={hasUpdateVersion(signals)}>
                        <div class="data-value flex-grow">{signals.activeTargetVersionText}</div>
                    </Show> */}
                </div>
            </div>
        </Show>
    </div>;
};