import { createSignal } from 'solid-js';
import { addDataCallback, sendSetupCancel, sendSetupRestart, sendReboot, sendShutdown } from './ipc';

class WebSetupPageSignals {
  constructor() {
      [this.setupState, this.setSetupState] = createSignal("");
      [this.deviceSetupURL, this.setDeviceSetupURL] = createSignal("");
      [this.hotspotSSID, this.setHotspotSSID] = createSignal("");
      [this.hotspotKey, this.setHotspotKey] = createSignal("");
      [this.wifiError, this.setWifiError] = createSignal(false);
      [this.activeSSID, this.setActiveSSID] = createSignal("");
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
        if ("WebURL" in launcherState) {
            let setupURL = launcherState["WebURL"];
            signals.setDeviceSetupURL(setupURL);
        }

        if ("WifiState" in launcherState) {
            let wifiState = launcherState["WifiState"];
            let hotspotSSID = wifiState["HotspotSSID"];
            let hotspotKey = wifiState["HotspotKey"];
            let activeSSID = wifiState["ActiveSSID"];
            let wifiError = wifiState["IsWifiError"];
            signals.setActiveSSID(activeSSID);
            signals.setWifiError(wifiError);
        
            if (hotspotID && hotspotSSID.length > 0 && hotspotKey.length > 0) {
                signals.setHotspotSSID(hotspotSSID);
                signals.setHotspotKey(hotspotKey);
            }
        }
    }
}

function isConnectionError(signals) {
    return signals.wifiError();
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

function onClickRestartSetup() {
    sendSetupRestart();
}

function onClickShutdown() {
    console.log("shutdown clicked")
    sendShutdown();
}

function onClickReboot() {
    console.log("reboot clicked")
    sendReboot();
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
                <div class="flex-element section-name underline">Welcome to Timechief</div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Connect to Wifi Network</div>
                    <div class="flex-element data-value">{signals.hotspotSSID}</div>
                </div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Wifi Key</div>
                    <div class="flex-element data-value">{signals.hotspotKey}</div>
                </div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Continue setup via your browser</div>
                    <div class="flex-element data-value">{signals.deviceSetupURL}</div>
                </div>
                <Show when={isConnectionError(signals)}>
                    <div class='row-flex flex-element'>
                        <div class="flex-element data-name">Error connecting to network, please run through setup again</div>
                    </div>
                </Show>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Reboot</div>
                    <button class='flex-element' onClick={onClickReboot}><i class='fa-solid fa-refresh'></i></button>
                </div>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Shutdown</div>
                    <button class='flex-element' onClick={onClickShutdown}><i class='fa-solid fa-power-off'></i></button>
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
                <div class="flex-element section-name underline">Welcome to Timechief</div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Loading...</div>
                </div>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Reboot</div>
                    <button class='flex-element' onClick={onClickReboot}><i class='fa-solid fa-refresh'></i></button>
                </div>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Shutdown</div>
                    <button class='flex-element' onClick={onClickShutdown}><i class='fa-solid fa-power-off'></i></button>
                </div>
                <div class='row-flex flex-element'>
                    <div class='flex-element data-name'>Restart setup</div>
                    <button class='flex-element' onClick={onClickRestartSetup}><i class="fa-solid fa-arrows-spin"></i></button>
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