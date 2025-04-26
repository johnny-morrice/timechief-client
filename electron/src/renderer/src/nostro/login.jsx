import { For, Show, createSignal, onCleanup } from "solid-js";
import { callbackName } from "../util/callback";
import { sendPairingCreateRequest, sendPairingGetRequest, sendRefreshMyDevices, sendSelectMyDevice, sendSetupBegin, sendLogOut, recordInteraction } from "./ipc";
import { toCanvas } from 'qrcode';
import { addPairingCreateCallback, addPairingGetCallback, addDataCallback, removeDataCallback, removeDeviceStatusCallback, removePairingCreateCallback, removePairingGetCallback } from "./ipc";
import { Loading } from "./loading";
import { labelMaker, textMaker } from "../components/label";

class Signals {
    constructor() {
        [this.userCode, this.setUserCode] = createSignal("");
        [this.loginURL, this.setLoginURL] = createSignal("");
        [this.qrCodeURL, this.setQrCodeURL] = createSignal("");
        [this.hasAccessCode, this.setHasAccessCode] = createSignal(false);
        [this.hasDeviceUUID, this.setHasDeviceUUID] = createSignal(false);
        [this.devices, this.setDevices] = createSignal([]);
        [this.isSmallMode, this.setSmallMode] = createSignal(false);
    }
}

function onDataUpdate(data, signals) {
    const dataState = data["service_data_state"];
    if (!dataState) {
        return;
    }
    const hasAccessCode = dataState["has_access_token"];
    const deviceUUID = dataState["my_device_uuid"];
    let devices = dataState["my_devices"];
    if (devices == null) {
        devices = [];
    }
    signals.setHasDeviceUUID(deviceUUID && deviceUUID.length > 0);
    signals.setHasAccessCode(hasAccessCode);
    signals.setDevices(devices);

    
    const serviceData = data["service_data"];
    if (!serviceData) {
        return;
    }

    const deviceProfileWrapper = serviceData["device_profile"];
    if (!deviceProfileWrapper) {
        return;
    }

    const deviceProfile = deviceProfileWrapper["value"];
    if (!deviceProfile) {
        return;
    }

    const theme = deviceProfile["theme"];
    if (!theme) {
        return;
    }

    const layoutType = theme["layout_type"];
    signals.setSmallMode(layoutType === "small");
}

export function LoginPage(props) {
    console.log("LoginPage render");
    const signals = new Signals();
    const cbName = callbackName("LoginPage");
    addDataCallback(cbName, (data) => onDataUpdate(data, signals));
    var pairingGetInterval = null;
    var pairingQrCodeCanvas = null;
    function onClickLogin() {
        sendPairingCreateRequest();
        sendRefreshMyDevices();
    }


    function isLoginStarted(signals) {
        return signals.userCode().length > 0;
    }
    function isLoggedIn(signals) {
        return signals.hasAccessCode() && signals.hasDeviceUUID();
    }
    function hasDevices(signals) {
        return signals.devices().length > 0;
    }
    function isWaitingForSubscription(signals) {
        return signals.hasAccessCode() && !signals.hasDeviceUUID() && !hasDevices(signals);
    }
    function isSelectingDevice(signals) {
        return signals.hasAccessCode() && !signals.hasDeviceUUID() && hasDevices(signals);
    }
    function formatDevice(device) {
        // TODO cope with missing nickname.
        return device.nickname ? `${device.nickname} - ${device.location}` : device.location;
    }

    const label = labelMaker("login");
    const plainText = textMaker("login");

    // Continuously poke interaction until cleaned up.
    var isReadyForRapidPoll = false;
    var rapidPollTimeoutReached = false;
    var pollTimout = null;
    const interactionInterval = setInterval(() => {
        if (!isLoggedIn(signals) && !rapidPollTimeoutReached) {
            console.log("login rapidly recording interaction")
            recordInteraction();
            if (!isReadyForRapidPoll) {
                console.log("login rapid polling will timeout eventually");
                pollTimout = setTimeout(() => {
                    console.log("login timeout, no longer recording interaction rapidly");
                    rapidPollTimeoutReached = true;
                }, 1000 * 60 * 20); // Stop polling rapidly after 20 minutes
            }
            isReadyForRapidPoll = true;
            console.log("setup process rapidly recording interaction")
            recordInteraction();
        } else {
            isReadyForRapidPoll = false;
            rapidPollTimeoutReached = false;
        }
    }, 1000);

    onCleanup(() => {
        clearInterval(interactionInterval);
        clearInterval(pairingGetInterval);
        clearTimeout(pollTimout);
        removeDataCallback(cbName);
        removeDeviceStatusCallback(cbName);
        removePairingCreateCallback(cbName);
        removePairingGetCallback(cbName);
        removeQrCode();
    });
    addPairingCreateCallback(cbName, () => {
        pairingGetInterval = setInterval(() => {
            sendPairingGetRequest();
        }, 500);
    });
    addPairingGetCallback(cbName, (data) => {
        // Pairing is complete if we've got a code and the state is now none.
        if (data["status"] == "none" && signals.userCode().length > 0) {
            signals.setUserCode("");
            if (pairingGetInterval != null) {
                clearInterval(pairingGetInterval);
            }
            removeQrCode();
        }
        const userCode = data["code"];
        if (userCode && userCode.length > 0) {
            signals.setUserCode(userCode);
        }
        const loginURL = data["url"];
        if (loginURL && loginURL.length > 0) {
            signals.setLoginURL(loginURL);
        }
        const qrCodeURL = data["qr_code_url"];
        if (qrCodeURL && qrCodeURL.length > 0) {
            signals.setQrCodeURL(qrCodeURL);
        }

        if (pairingQrCodeCanvas == null) {
            let canvasWrapper = document.getElementById("pairing-qrcode-canvas-wrapper");
            if (canvasWrapper && canvasWrapper.childElementCount == 0) {
                const qrCodeURL = signals.qrCodeURL();
                if (qrCodeURL) {
                    pairingQrCodeCanvas = <canvas id="pairing-qrcode-canvas"></canvas>;
                    canvasWrapper.appendChild(pairingQrCodeCanvas);
                    toCanvas(pairingQrCodeCanvas, qrCodeURL);
                }

            }
        }
    });
    function removeQrCode() {
        if (pairingQrCodeCanvas != null) {
            let wrapper = document.getElementById("pairing-qrcode-canvas-wrapper");
            if (wrapper) {
                wrapper.removeChild(pairingQrCodeCanvas);
                pairingQrCodeCanvas = null;
            }
        }
    }

    function onClickRestartSetup(e) {
        sendLogOut();
        sendSetupBegin();
    }

    function onClickNewCode(e) {
        sendPairingCreateRequest();
    }

    return <>
        <Show when={isLoggedIn(signals)}>
            {props.element}
        </Show>
        <Show when={!isLoggedIn(signals)}>
            <div class="login-screen exposed">
                <Show when={isWaitingForSubscription(signals)}>
                    <div class="login-box">
                        <Show when={!signals.isSmallMode()}>
                            <div>Waiting for subscription activation</div>
                        </Show>
                        <Show when={signals.isSmallMode()}>
                            <div>Loading...</div>
                        </Show>
                        <Loading />
                        <button class="action-button crt-box flex-grow" onClick={onClickRestartSetup}>{plainText("restart-setup")}</button>
                    </div>
                </Show>
                <Show when={isSelectingDevice(signals)}>
                    <div class="login-box">
                        <div class="pairing-title">{label("select-device")}</div>
                        <For each={signals.devices()}>{(device) => {
                            return <button class="action-button crt-box flex-grow" onClick={() => sendSelectMyDevice(device.uuid)}>{formatDevice(device)}</button>;
                        }}</For>
                        <button class="action-button crt-box flex-grow" onClick={onClickRestartSetup}>{plainText("restart-setup")}</button>
                    </div>
                </Show>
                <Show when={!signals.hasAccessCode() && !isLoginStarted(signals)}>
                    <div class="login-box begin-login">
                        <Show when={!signals.isSmallMode()}>
                            <div class="pairing-title">{label("title")}</div>
                        </Show>
                        <button class="action-button crt-box flex-grow" onClick={onClickLogin}>{plainText("login-button-text")} &nbsp;&nbsp; <i class="fa-solid fa-user"></i></button>
                        <button class="action-button crt-box flex-grow" onClick={onClickRestartSetup}>{plainText("restart-setup")}</button>
                    </div>
                </Show>
                <Show when={!signals.hasAccessCode() && isLoginStarted(signals)}>
                    <div class="login-box">
                        <div class='flex-row'>
                            <div class="data-label">{label("in-your-browser")}</div>
                            <div class="data-value">{signals.loginURL}</div>
                        </div>
                        <div class='flex-row'>
                            <div class="data-label">{label("enter-code")}</div>
                            <div class="data-value">{signals.userCode}</div>
                        </div>
                        <Show when={!signals.isSmallMode()}>
                            <div class="data-label">{label("scan-qr")}</div>
                            <div id="pairing-qrcode-canvas-wrapper"></div>
                        </Show>
                        <div class="login-code-buttons flex-row">
                            <button class="action-button crt-box flex-grow" onClick={onClickNewCode}>{plainText("new-code")}</button>
                            <button class="action-button crt-box flex-grow" onClick={onClickRestartSetup}>{plainText("restart-setup")}</button>
                        </div>
                    </div>
                </Show>
            </div>
        </Show>
    </>;
}