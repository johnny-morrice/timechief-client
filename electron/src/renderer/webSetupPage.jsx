import { createSignal } from 'solid-js';
import { addDataCallback, sendSetupCancel } from './ipc';

class WebSetupPageSignals {
  constructor() {
      [this.setupState, this.setSetupState] = createSignal("");
      [this.deviceIP, this.setDeviceIP] = createSignal("");
      [this.hotspotSSID, this.setHotspotSSID] = createSignal("");
      [this.hotspotKey, this.setHotspotKey] = createSignal("");
      [this.firstTimeSetupDone, this.setFirstTimeSetupDone] = createSignal(false);
  }
}

function updateWebSetupPageSignals(signals, data) {
    if ("LauncherState" in data) {
        let launcherState = data["LauncherState"];
        if ("FirstTimeSetupDone" in launcherState) {
            let firstTimeSetupDone = launcherState["FirstTimeSetupDone"];
            signals.setFirstTimeSetupDone(firstTimeSetupDone);
        } else {
            signals.setFirstTimeSetupDone(false);
        }
        if ("SetupState" in launcherState) {
            let setupState = launcherState["SetupState"];
            signals.setSetupState(setupState);
        }
        if ("NetworkState" in launcherState) {
            let networkState = launcherState["NetworkState"];
            if ("IPAddress" in networkState) {
                let deviceIP = networkState["IPAddress"];
                signals.setDeviceIP(deviceIP);
            }
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

function isDisplayBackButton(signals) {
    return !isInternetConnectedState(signals) && signals.firstTimeSetupDone();
}

function onClickBack() {
    sendSetupCancel();
}

var initialised = false;
let signals = new WebSetupPageSignals();
export const WebSetupPage = (props) => {
  if (!initialised) {
        addDataCallback((data) => updateWebSetupPageSignals(signals, data));
    initialised = true;
  }

  return <div id="web-setup">
        <Show when={isHotspotReady(signals)}>
            <div class="column-flex">
                <div class="flex-element section-name underline">Setup your timechief</div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Connect to Wifi Network</div>
                    <div class="flex-element data-value">{signals.hotspotSSID}</div>
                </div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Wifi Key</div>
                    <div class="flex-element data-value">{signals.hotspotKey}</div>
                </div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Device IP</div>
                    <div class="flex-element data-value">{signals.deviceIP}</div>
                </div>
                <Show when={isDisplayBackButton(signals)}>
                    <div class='row-flex flex-element'>
                        <div class='flex-element data-name'>Cancel setup</div>
                        <button class='flex-element' onClick={onClickBack}><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </Show>
            </div>
        </Show>
        <Show when={isLoading(signals)}>
            <div class="column-flex">
                <div class="flex-element section-name underline">Setup your timechief</div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Loading...</div>
                </div>
                <Show when={isDisplayBackButton(signals)}>
                    <div class='row-flex flex-element'>
                        <div class='flex-element data-name'>Cancel setup</div>
                        <button class='flex-element' onClick={onClickBack}><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </Show>
            </div>
        </Show>
        <Show when={isInternetConnectedState(signals)}>
            {props.element}
        </Show>
  </div>;
};