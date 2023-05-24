import { createSignal } from 'solid-js';
import { addDataCallback } from './ipc';
import { HomePage } from './homePage';
import { showHome } from './routes';

class WebSetupPageSignals {
  constructor() {
      [this.setupState, this.setupState] = createSignal("");
      [this.deviceIP, this.setDeviceIP] = createSignal("");
      [this.hotspotSSID, this.setHotspotKey] = createSignal("");
  }
}

function updateWebSetupPageSignals(signals, data) {
    if ("LauncherState" in data) {
        let launcherState = data["LauncherState"];
        if ("SetupState" in launcherState) {
            let setupState = launcherState["SetupState"];
            signals.setSetupState(setupState);
        }
        if ("WifiState" in launcherState) {
            let wifiState = launcherState["WifiState"];
            let hotspotSSID = wifiState["HotspotSSID"];
            let hotspotKey = wifiState["HotspotKey"];
            if (hotspotSSID.length > 0 && hotspotKey.length > 0) {
                signals.setHotspotSSID(hotspotSSID);
                signals.setHotspotKey(hotspotKey);
            }
        }
    }
}

function isInternetConnectedState(signals) {
    return signals.setupState() === "InternetConnected";
}

function isHotspotReady(signals) {
    return signals.setupState() === "WaitUserSelectNetwork" && signals.hotspotSSID().length > 0 && signals.hotspotKey().length > 0;
}

function isLoading(signals) {
    return signals.setupState() !== "InternetConnected" && signals.setupState() !== "WaitUserSelectNetwork";
}

var initialised = false;
let signals = new WebSetupPageSignals();
export const WebSetupPage = () => {
  if (!initialised) {
        addDataCallback((data) => updateWebSetupPageSignals(signals, data));
    initialised = true;
  }

  return <div id="web-setup">
        <Show when={isHotspotReady(signals)}>
            <div class="column-flex">
                <div class="flex-element section-name underline">Setup your device</div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Hotspot SSID</div>
                    <div class="flex-element data-value">{signals.hotspotSSID}</div>
                </div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Hotspot SSID</div>
                    <div class="flex-element data-value">{signals.hotspotKey}</div>
                </div>
            </div>
        </Show>
        <Show when={isInternetConnectedState(signals)}>
            <HomePage/>
        </Show>
        <Show when={isLoading(signals)}>
            <div class="flex-element section-name underline">Loading...</div>
        </Show>
  </div>;
};