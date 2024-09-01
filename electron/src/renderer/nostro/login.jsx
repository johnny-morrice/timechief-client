import { For, Show, createSignal, onCleanup } from "solid-js";
import { callbackName } from "./callback";
import { sendPairingCreateRequest, sendPairingGetRequest, sendRefreshMyDevices, sendSelectMyDevice } from "./ipc";
import { toCanvas } from 'qrcode';
import { addPairingCreateCallback, addPairingGetCallback, addDataCallback, removeDataCallback, removeDeviceStatusCallback, removePairingCreateCallback, removePairingGetCallback } from "./ipc";
import { Loading } from "./loading";
import { labelMaker, textMaker } from "./label";

class Signals {
    constructor() {
        [this.userCode, this.setUserCode] = createSignal("");
        [this.loginURL, this.setLoginURL] = createSignal("");
        [this.qrCodeURL, this.setQrCodeURL] = createSignal("");
        [this.hasAccessCode, this.setHasAccessCode] = createSignal(false);
        [this.hasDeviceUUID, this.setHasDeviceUUID] = createSignal(false);
        [this.devices, this.setDevices] = createSignal([]);
    }
}

function onDataUpdate(data, signals) {
    const dataState = data["service_data_state"];
    if (!dataState) {
        return;
    }
    const hasAccessCode = dataState["has_access_token"];
    const deviceUUID = dataState["my_device_uuid"];
    const devices = dataState["my_devices"];
    signals.setHasDeviceUUID(deviceUUID.length > 0);
    signals.setHasAccessCode(hasAccessCode);
    signals.setDevices(devices);
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
    onCleanup(() => {
        if (pairingGetInterval != null) {
            clearInterval(pairingGetInterval);
        }
        removeDataCallback(cbName);
        removeDeviceStatusCallback(cbName);
        removePairingCreateCallback(cbName);
        removePairingGetCallback(cbName);
        removeQrCode();
    });
    addPairingCreateCallback(cbName, () => {
        pairingGetInterval = setInterval(() => {
            sendPairingGetRequest();
        }, 300);
    });
    addPairingGetCallback(cbName, (data) => {
        const userCode = data["code"];
        if (userCode.length > 0) {
            signals.setUserCode(userCode);
        }
        const loginURL = data["url"];
        if (loginURL.length > 0) {
            signals.setLoginURL(loginURL);
        }
        const qrCodeURL = data["qr_code_url"];
        if (qrCodeURL.length > 0) {
            signals.setQrCodeURL(qrCodeURL);
        }

        if (pairingQrCodeCanvas == null) {
            let canvasWrapper = document.getElementById("pairing-qrcode-canvas-wrapper");
            if (canvasWrapper && canvasWrapper.childElementCount == 0) {
                pairingQrCodeCanvas = <canvas id="pairing-qrcode-canvas"></canvas>;
                canvasWrapper.appendChild(pairingQrCodeCanvas);
                toCanvas(pairingQrCodeCanvas, signals.qrCodeURL());
            }
        }
        // Pairing is complete if we've got a code and the state is now none.
        if (data["status"] == "none" && signals.userCode().length > 0) {
            signals.setUserCode("");
            if (pairingGetInterval != null) {
                clearInterval(pairingGetInterval);
            }
            removeQrCode();
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

    return <>
        <Show when={isLoggedIn(signals)}>
            {props.element}
        </Show>
        <Show when={!isLoggedIn(signals)}>
            <div class="login-screen exposed">
                <Show when={isWaitingForSubscription(signals)}>
                    <div class="login-box">
                        <div>Waiting for subscription activation</div>
                        <Loading />
                    </div>
                </Show>
                <Show when={isSelectingDevice(signals)}>
                    <div class="login-box">
                        <div class="pairing-title">{label("select-device")}</div>
                        <For each={signals.devices()}>{(device) => {
                            return <button class="action-button crt-box flex-grow" onClick={() => sendSelectMyDevice(device.uuid)}>{formatDevice(device)}</button>;
                        }}</For>
                    </div>
                </Show>
                <Show when={!signals.hasAccessCode() && !isLoginStarted(signals)}>
                    <div class="login-box begin-login">
                        <div class="pairing-title">{label("title")}</div>
                        <button class="action-button crt-box flex-grow" onClick={onClickLogin}>{plainText("login-button-text")} &nbsp;&nbsp; <i class="fa-solid fa-user"></i></button>
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
                        <div class="data-label">{label("scan-qr")}</div>
                        <div id="pairing-qrcode-canvas-wrapper"></div>
                    </div>
                </Show>
            </div>
        </Show>
    </>;
}