import { createSignal, onCleanup } from 'solid-js';
import { addDataCallback, sendSetupCancel, sendSetupRestart, sendReboot, sendShutdown, removeDataCallback } from './ipc';
import { callbackName } from "./callback";
import { buttonGlitchStyle, runButtonGlitch } from './textGlitch';
import { Loading } from './loading';
import { textTransitionSignal } from './textGlitch';
import { random } from './fakeRandom';
import { labelMaker, textMaker } from './label';
import { fadeTransition } from './fadeTransition';
import { generateWifiQRCode } from 'wifi-qr-code-generator';
import { NoConnection } from './noconnection';
import { recordInteraction, sendClockDataRequest, sendSetNetworkTypeManual, sendSetNetworkTypeWifi } from './ipc';

class Signals {
    constructor() {
        [this.connectedToLocalService, this.setConnectedToLocalService] = createSignal(false);
        [this.setupState, this.setSetupState] = createSignal("");
        [this.deviceSetupURL, this.setDeviceSetupURL] = createSignal("");
        [this.hotspotSSID, this.setHotspotSSID] = createSignal("");
        [this.hotspotKey, this.setHotspotKey] = createSignal("");

        [this.deviceSetupURLText, this.setDeviceSetupURLText] = textTransitionSignal("");
        [this.hotspotSSIDText, this.setHotspotSSIDText] = textTransitionSignal("");
        [this.hotspotKeyText, this.setHotspotKeyText] = textTransitionSignal("");
        [this.hotspotQRData, this.setHotspotQRData] = createSignal("");

        [this.wifiError, this.setWifiError] = createSignal(false);
        [this.activeSSID, this.setActiveSSID] = createSignal("");
        [this.firstTimeSetupDone, this.setFirstTimeSetupDone] = createSignal(false);
        [this.isUpdating, this.setUpdating] = createSignal(false);
        [this.rebootGlitch, this.setRebootGlitch] = createSignal("Reboot");
        [this.shutdownGlitch, this.setShutdownGlitch] = createSignal("Shutdown");
        [this.displayStateBuffer, this.setDisplayStateBuffer] = createSignal([true, false, false]);
        [this.displayState, this.setDisplayState] = createSignal([false, false, false]);
        [this.crtRootTransition, this.setCrtRootTransition] = createSignal("no-transition");
    }
}

function isUpdating(signals) {
    return signals.isUpdating();
}

function updateDisplayBuffer(signals) {
    signals.setDisplayStateBuffer([isLoading(signals), isHotspotReady(signals), isInternetConnectedState(signals), isNetworkTypeChooseState(signals)]);
}

function applyDisplayBuffer(signals) {
    const displayStateBuffer = signals.displayStateBuffer();
    const displayState = signals.displayState();
    if (displayStateBuffer[0] !== displayState[0] || displayStateBuffer[1] !== displayState[1] || displayStateBuffer[2] !== displayState[2] || displayStateBuffer[3] !== displayState[3]) {
        fadeTransition(signals.setCrtRootTransition, () => signals.setDisplayState(displayStateBuffer));
    }
}

function updateSignals(signals, data) {
    signals.setConnectedToLocalService(true);
    if ("launcher_state" in data) {
        let launcherState = data["launcher_state"];
        if ("first_time_setup_done" in launcherState) {
            let firstTimeSetupDone = launcherState["first_time_setup_done"];
            signals.setFirstTimeSetupDone(firstTimeSetupDone);
        } else {
            signals.setFirstTimeSetupDone(false);
        }
        if ("setup_state" in launcherState) {
            let setupState = launcherState["setup_state"];
            signals.setSetupState(setupState);
        }
        if ("web_url" in launcherState) {
            let setupURL = launcherState["web_url"];
            signals.setDeviceSetupURL(setupURL);
            signals.setDeviceSetupURLText(setupURL);
        }

        let isUpdating = launcherState["flags"].includes("isUpdating");
        signals.setUpdating(isUpdating);

        if ("wifi_state" in launcherState) {
            let wifiState = launcherState["wifi_state"];
            let hotspotSSID = wifiState["hotspot_ssid"];
            let hotspotKey = wifiState["hotspot_key"];
            let activeSSID = wifiState["active_ssid"];
            let wifiError = wifiState["is_wifi_error"];
            signals.setActiveSSID(activeSSID);
            signals.setWifiError(wifiError);

            if (hotspotSSID && hotspotKey && hotspotSSID.length > 0 && hotspotKey.length > 0) {
                signals.setHotspotSSID(hotspotSSID);
                signals.setHotspotSSIDText(hotspotSSID);
                signals.setHotspotKey(hotspotKey);
                signals.setHotspotKeyText(hotspotKey);
                generateHotspotQRCode(hotspotSSID, hotspotKey).then((data) => {
                    signals.setHotspotQRData(data);
                }).catch((error) => {
                    console.log("Error generating hotspot QR code");
                    console.log(error);
                });
            }
        }
    }
    runButtonGlitch(() => isUpdating(signals), signals.setRebootGlitch, "Reboot", 150);
    runButtonGlitch(() => isUpdating(signals), signals.setShutdownGlitch, "Shutdown", 150);
    updateDisplayBuffer(signals);
    applyDisplayBuffer(signals);
}

function generateHotspotQRCode(hotspotSSID, hotspotKey) {
    return generateWifiQRCode({
        ssid: hotspotSSID,
        password: hotspotKey,
        encryption: 'WPA2',
        hiddenSSID: false,
        outputFormat: { type: 'image/png' }
    });
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
    return signals.setupState() !== "InternetConnected" && signals.setupState() !== "WaitUserSelectNetwork" && signals.setupState() !== "WaitUserChooseSetupType";
}

function isNetworkTypeChooseState(signals) {
    return signals.setupState() === "WaitUserChooseSetupType";
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

function isDisplayStateLoading(signals) {
    return signals.displayState()[0];
}

function isDisplayStateHotspot(signals) {
    return signals.displayState()[1];
}

function isDisplayStateInternet(signals) {
    return signals.displayState()[2];
}

function isDisplayStateChooseNetworkType(signals) {
    return signals.displayState()[3];
}

export const WebSetupPage = (props) => {
    console.log("WebSetupPage render");
    const signals = new Signals();
    const cbName = callbackName("WebSetupPage");
    addDataCallback(cbName, (data) => updateSignals(signals, data));
    onCleanup(() => {
        removeDataCallback(cbName);
    });

    const applyCRTJank = () => {
        // There is a 1 in 120 chance of the CRT jank being applied.
        if (random() < 0.008333) {
            // Get the crt-root element
            const crtRoot = document.getElementById("crt-root");
            const boxes = document.getElementsByClassName("crt-box");
            // The CRT jank is applied crt-jank class to the crt-root element.
            crtRoot.classList.add("crt-jank");
            // Add jank to all the boxes;
            for (let i = 0; i < boxes.length; i++) {
                boxes[i].classList.add("crt-box-jank");
            }
            // console.log("CRT Jank applied");
            // Set a timeout to remove the CRT jank after 1.6 + n second.
            // Where n is between 1.6 second and 2.4 second.
            const timeout = 2800 + (random() * 800);
            const timer = setTimeout(removeCRTJank, timeout);
            // Always clean up after 5 minutes
            // Is this strictly necessary?
            setTimeout(() => {
                clearTimeout(timer);
            }, 1000 * 60 * 5);
        }
    };

    const removeCRTJank = () => {
        // Get the crt-root element
        const crtRoot = document.getElementById("crt-root");
        const boxes = document.getElementsByClassName("crt-box");
        const currentClasses = crtRoot.classList;
        if (!currentClasses.contains("crt-jank")) {
            return;
        }
        // The CRT jank is removed by removing the crt-jank class from the crt-root element.
        crtRoot.classList.remove("crt-jank");
        // Remove jank from all the boxes;
        for (let i = 0; i < boxes.length; i++) {
            boxes[i].classList.remove("crt-box-jank");
        }
        // console.log("CRT Jank removed");
    };

    const jankInterval = setInterval(applyCRTJank, 1000);

    // When doing setup, trigger interactivity every second.
    const interactionInterval = setInterval(() => {
        if (!isDisplayStateInternet(signals)) {
            recordInteraction();
        }
    }, 1000);


    onCleanup(() => {
        clearInterval(jankInterval);
        clearInterval(interactionInterval);
    });

    const label = labelMaker("web-setup");
    const plainText = textMaker("web-setup");
    const handleOnClickAnywhere = (e) => {
        recordInteraction();
        if (e.target.classList.contains("action-button")) {
            sendClockDataRequest();
        }
    };

    function onClickManualNetworkType(e) {
        sendSetNetworkTypeManual();
    }

    function onClickWifiNetworkType(e) {
        sendSetNetworkTypeWifi();
    }

    return <div id="crt-root" className={`crt ${signals.crtRootTransition()}`} onClick={handleOnClickAnywhere}>
        <Show when={signals.connectedToLocalService()}>
            <Show when={isDisplayStateHotspot(signals)}>
                <div class="setup-wrapper flex-column flex-grow">
                    <div class="setup-title">Welcome to Timechief</div>
                    <div class="setup-content-wrapper flex-row">
                        <div class="setup-button-box border flex-column crt-box home-box">
                            <Show when={isUpdating(signals)}>
                                <button class='action-button crt-box' style={buttonGlitchStyle(plainText("reboot"))} disabled onClick={onClickReboot}>{signals.rebootGlitch} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                                <button class='action-button crt-box' style={buttonGlitchStyle(plainText("shutdown"))} disabled onClick={onClickShutdown}>{signals.shutdownGlitch} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                            </Show>
                            <Show when={!isUpdating(signals)}>
                                <button class='action-button crt-box' onClick={onClickReboot}>{plainText("reboot")} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                                <button class='action-button crt-box' onClick={onClickShutdown}>{plainText("shutdown")} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                            </Show>
                            <Show when={isDisplayBackButton(signals)}>
                                <button class='action-button crt-box' onClick={onClickBack}>{plainText("cancel-setup")} &nbsp;&nbsp; <i class="fa-solid fa-xmark"></i></button>
                            </Show>
                            <Show when={isUpdating(signals)}>
                                <div class="setup-button-box-isUpdating">
                                    <i class='fa-solid fa-floppy-disk fa-fade api-error-indicator'></i>
                                </div>
                            </Show>
                        </div>
                        <div class="setup-instructions flex-column exposed">
                            <div class='flex-row'>
                                <div class="data-label">{label("connect-wifi")}</div>
                                <div class="data-value">{signals.hotspotSSIDText}</div>
                            </div>
                            <div class='flex-row'>
                                <div class="data-label">{label("wifi-key")}</div>
                                <div class="data-value">{signals.hotspotKeyText}</div>
                            </div>
                            <div class='flex-row'>
                                <div class="data-label">{label("continue-via-browser")}</div>
                                <div class="data-value">{signals.deviceSetupURLText}</div>
                            </div>
                            <div class='flex-row'>
                                <img class="hotspot-qr" src={signals.hotspotQRData()} alt='Hotspot QR Code' />
                            </div>
                            <Show when={isConnectionError(signals)}>
                                <div class='flex-row'>
                                    <div class="hotspot-error">{label("connection-error")}</div>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Show>
            <Show when={isDisplayStateChooseNetworkType(signals)}>
                <div class="setup-wrapper flex-column flex-grow">
                    <div class="setup-title">Welcome to Timechief</div>
                    <div class="setup-content-wrapper flex-row">
                        <div class="setup-button-box border flex-column crt-box home-box">
                            <Show when={isUpdating(signals)}>
                                <button class='action-button crt-box' style={buttonGlitchStyle(plainText("reboot"))} disabled onClick={onClickReboot}>{signals.rebootGlitch} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                                <button class='action-button crt-box' style={buttonGlitchStyle(plainText("shutdown"))} disabled onClick={onClickShutdown}>{signals.shutdownGlitch} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                            </Show>
                            <Show when={!isUpdating(signals)}>
                                <button class='action-button crt-box' onClick={onClickReboot}>{plainText("reboot")} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                                <button class='action-button crt-box' onClick={onClickShutdown}>{plainText("shutdown")} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                            </Show>
                            <Show when={isDisplayBackButton(signals)}>
                                <button class='action-button crt-box' onClick={onClickBack}>{plainText("cancel-setup")} &nbsp;&nbsp; <i class="fa-solid fa-xmark"></i></button>
                            </Show>
                            <Show when={isUpdating(signals)}>
                                <div class="setup-button-box-isUpdating">
                                    <i class='fa-solid fa-floppy-disk fa-fade api-error-indicator'></i>
                                </div>
                            </Show>
                        </div>
                        <div class="setup-instructions flex-column exposed">
                            <div class='flex-row'>
                                <button class="action-button crt-box" onClick={onClickWifiNetworkType}>{plainText("wifi-network-button")} <i class="fa-solid fa-wifi"></i></button>
                            </div>
                            <div class='flex-row'>
                            <button class="action-button crt-box" onClick={onClickManualNetworkType}>{plainText("manual-network-button")} <i class="fa-solid fa-network-wired"></i></button>
                            </div>
                            <Show when={isConnectionError(signals)}>
                                <div class='flex-row'>
                                    <div class="hotspot-error">{label("connection-error")}</div>
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>
            </Show>
            <Show when={isDisplayStateLoading(signals)}>
                <div class="setup-wrapper flex-column flex-grow">
                    <div class="setup-title">Welcome to Timechief</div>
                    <div class="setup-action-wrapper flex-row">
                        <div class="setup-button-box border flex-column crt-box home-box">
                            <Show when={isUpdating(signals)}>
                                <button disabled class='action-button crt-box' style={buttonGlitchStyle(plainText("reboot"))} onClick={onClickReboot}>{signals.rebootGlitch} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                                <button disabled class='action-button crt-box' style={buttonGlitchStyle(plainText("shutdown"))} onClick={onClickShutdown}>{signals.shutdownGlitch} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                            </Show>
                            <Show when={!isUpdating(signals)}>
                                <button class='action-button crt-box' onClick={onClickReboot}>{plainText("reboot")} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                                <button class='action-button crt-box' onClick={onClickShutdown}>{plainText("shutdown")} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                            </Show>
                            <button class='action-button crt-box' onClick={onClickRestartSetup}>{plainText("restart-setup")} &nbsp;&nbsp; <i class='fa-solid fa-backward'></i></button>
                            <Show when={isDisplayBackButton(signals)}>
                                <button class='action-button crt-box' onClick={onClickBack}>{plainText("cancel-setup")} &nbsp;&nbsp; <i class="fa-solid fa-xmark"></i></button>
                            </Show>
                            <Show when={isUpdating(signals)}>
                                <div class="setup-button-box-isUpdating">
                                    <i class='fa-solid fa-floppy-disk fa-fade api-error-indicator'></i>
                                </div>
                            </Show>
                        </div>
                        <div class="flex-column flex-grow exposed">
                            <Loading />
                        </div>
                    </div>
                </div>
            </Show>
            <Show when={isDisplayStateInternet(signals)}>
                {props.element}
            </Show>
        </Show>
        <Show when={!signals.connectedToLocalService()}>
            <NoConnection />
        </Show>
    </div>;
};