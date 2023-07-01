import { createEffect, createSignal, onCleanup } from 'solid-js';
import { addDataCallback, sendSetupCancel, sendSetupRestart, sendReboot, sendShutdown, removeDataCallback } from './ipc';
import { callbackName } from "./callback";
import { buttonGlitchStyle, runButtonGlitch } from './textGlitch';
import { Loading } from './loading';
import { textTransitionSignal } from './textGlitch';
import { random } from './fakeRandom';
import { labelMaker, textMaker } from './label';
import { fadeTransition } from './fadeTransition';

class Signals {
    constructor() {
        [this.setupState, this.setSetupState] = createSignal("");
        [this.deviceSetupURL, this.setDeviceSetupURL] = createSignal("");
        [this.hotspotSSID, this.setHotspotSSID] = createSignal("");
        [this.hotspotKey, this.setHotspotKey] = createSignal("");

        [this.deviceSetupURLText, this.setDeviceSetupURLText] = textTransitionSignal("");
        [this.hotspotSSIDText, this.setHotspotSSIDText] = textTransitionSignal("");
        [this.hotspotKeyText, this.setHotspotKeyText] = textTransitionSignal("");

        [this.wifiError, this.setWifiError] = createSignal(false);
        [this.activeSSID, this.setActiveSSID] = createSignal("");
        [this.firstTimeSetupDone, this.setFirstTimeSetupDone] = createSignal(false);
        [this.isUpdating, this.setUpdating] = createSignal(false);
        [this.rebootGlitch, this.setRebootGlitch] = createSignal("Reboot");
        [this.shutdownGlitch, this.setShutdownGlitch] = createSignal("Shutdown");
        [this.displayStateBuffer, this.setDisplayStateBuffer] = createSignal([true, false, false]);
        [this.displayState, this.setDisplayState] = createSignal([false, false, false]);
    }
}

function isUpdating(signals) {
    return signals.isUpdating();
}

function updateSignals(signals, data) {
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
            signals.setDeviceSetupURLText(setupURL);
        }

        let isUpdating = launcherState["Flags"].includes("isUpdating");
        signals.setUpdating(isUpdating);

        if ("WifiState" in launcherState) {
            let wifiState = launcherState["WifiState"];
            let hotspotSSID = wifiState["HotspotSSID"];
            let hotspotKey = wifiState["HotspotKey"];
            let activeSSID = wifiState["ActiveSSID"];
            let wifiError = wifiState["IsWifiError"];
            signals.setActiveSSID(activeSSID);
            signals.setWifiError(wifiError);

            if (hotspotSSID && hotspotKey && hotspotSSID.length > 0 && hotspotKey.length > 0) {
                signals.setHotspotSSID(hotspotSSID);
                signals.setHotspotSSIDText(hotspotSSID);
                signals.setHotspotKey(hotspotKey);
                signals.setHotspotKeyText(hotspotKey);
            }
        }
    }
    runButtonGlitch(() => isUpdating(signals), signals.setRebootGlitch, "Reboot", 150);
    runButtonGlitch(() => isUpdating(signals), signals.setShutdownGlitch, "Shutdown", 150);
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

function isDisplayStateLoading(signals) {
    return signals.displayState()[0];
}

function isDisplayStateHotspot(signals) {
    return signals.displayState()[1];
}

function isDisplayStateInternet(signals) {
    return signals.displayState()[2];
}

export const WebSetupPage = (props) => {
    const signals = new Signals();
    const cbName = callbackName("WebSetupPage");
    addDataCallback(cbName, (data) => updateSignals(signals, data));
    onCleanup(() => {
        removeDataCallback(cbName);
    });

    createEffect(() => {
        signals.setDisplayStateBuffer([isLoading(signals), isHotspotReady(signals), isInternetConnectedState(signals)]);
    });
    createEffect(() => {
        const displayStateBuffer = signals.displayStateBuffer();
        const displayState = signals.displayState();
        if (displayStateBuffer[0] !== displayState[0] || displayStateBuffer[1] !== displayState[1] || displayStateBuffer[2] !== displayState[2]) {
            fadeTransition("crt-root", () => signals.setDisplayState(displayStateBuffer));
        }
    });

    const applyCRTJank = () => {
        // Get the crt-root element
        const crtRoot = document.getElementById("crt-root");
        const boxes = document.getElementsByClassName("crt-box");
        // There is a 1 in 120 chance of the CRT jank being applied.
        if (random() < 0.008333) {
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
            onCleanup(() => {
                clearTimeout(timer);
            });
        }
    };

    const removeCRTJank = () => {
        // Get the crt-root element
        const crtRoot = document.getElementById("crt-root");
        const boxes = document.getElementsByClassName("crt-box");
        // The CRT jank is removed by removing the crt-jank class from the crt-root element.
        crtRoot.classList.remove("crt-jank");
        // Remove jank from all the boxes;
        for (let i = 0; i < boxes.length; i++) {
            boxes[i].classList.remove("crt-box-jank");
        }
        // console.log("CRT Jank removed");
    };

    const jankInterval = setInterval(applyCRTJank, 1000);

    onCleanup(() => {
        clearInterval(jankInterval);
    });

    const label = labelMaker("web-setup");
    const plainText = textMaker("web-setup");
    return <div id="crt-root" class="crt">
        <Show when={isDisplayStateHotspot(signals)}>
            <div class="setup-wrapper flex-column flex-grow">
                <div class="setup-title">Welcome to Timechief</div>
                <div class="setup-content-wrapper flex-row">
                    <div class="setup-button-box border flex-column crt-box">
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
                    <div class="setup-instructions flex-column">
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
                    <div class="setup-button-box border flex-column crt-box">
                        <Show when={isUpdating(signals)}>
                            <button disabled class='action-button crt-box' style={buttonGlitchStyle(plainText("reboot"))} onClick={onClickReboot}>{signals.rebootGlitch} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                            <button disabled class='action-button crt-box' style={buttonGlitchStyle(plainText("shutdown"))} onClick={onClickShutdown}>{signals.shutdownGlitch} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                        </Show>
                        <Show when={!isUpdating(signals)}>
                            <button class='action-button crt-box' onClick={onClickReboot}>{plainText("reboot")} &nbsp;&nbsp; <i class='fa-solid fa-refresh'></i></button>
                            <button class='action-button crt-box' onClick={onClickShutdown}>{plainText("shutdown")} &nbsp;&nbsp; <i class='fa-solid fa-power-off'></i></button>
                        </Show>
                        <button class='action-button crt-box' onClick={onClickRestartSetup}>{plainText("restart-setup")} &nbsp;&nbsp; <i class='fa-solid <i class="fa-solid fa-backward"></i>'></i></button>
                        <Show when={isDisplayBackButton(signals)}>
                            <button class='action-button crt-box' onClick={onClickBack}>{plainText("cancel-setup")} &nbsp;&nbsp; <i class="fa-solid fa-xmark"></i></button>
                        </Show>
                        <Show when={isUpdating(signals)}>
                            <div class="setup-button-box-isUpdating">
                                <i class='fa-solid fa-floppy-disk fa-fade api-error-indicator'></i>
                            </div>
                        </Show>
                    </div>
                    <div class="flex-column flex-grow">
                        <Loading />
                    </div>
                </div>
            </div>
        </Show>
        <Show when={isDisplayStateInternet(signals)}>
            {props.element}
        </Show>
    </div>;
};