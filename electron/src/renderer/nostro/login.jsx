import { Show, createSignal } from "solid-js";
import { callbackName } from "./callback";
import { sendPairingCreateRequest, sendPairingGetRequest } from "./ipc";
import { toCanvas } from 'qrcode';
import { addPairingCreateCallback, addPairingGetCallback, addServiceDataCallback, removeDataCallback, removeDeviceStatusCallback, removePairingCreateCallback, removePairingGetCallback } from "./ipc";

class Signals {
    constructor() {
        [this.userCode, this.setUserCode] = createSignal("");
        [this.loginURL, this.setLoginURL] = createSignal("");
        [this.qrCodeURL, this.setQrCodeURL] = createSignal("");
        [this.hasAccessCode, this.setHasAccessCode] = createSignal(false);
    }
}

function onDataUpdate(data, signals) {
    const dataState = data["service_data_state"];
    const hasAccessCode = dataState["has_access_token"];
    signals.setHasAccessCode(hasAccessCode);
}

export function LoginPage(props) {
    const signals = new Signals();
    const cbName = callbackName("LoginPage");
    addServiceDataCallback(cbName, (data) => onDataUpdate(data, signals));
    var pairingGetInterval = null;
    var pairingQrCodeCanvas = null;
    function onClickLogin() {
        sendPairingCreateRequest();
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
        const pairingCode = data["code"];
        if (pairingCode.length > 0) {
            signals.setPairingCode(pairingCode);
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
            if (canvasWrapper) {
                pairingQrCodeCanvas = <canvas id="pairing-qrcode-canvas"></canvas>;
                canvasWrapper.appendChild(pairingQrCodeCanvas);
                toCanvas(pairingQrCodeCanvas, signals.qrCodeURL());
            }
        }
        // Pairing is complete if we've got a code and the state is now none.
        if (data["status"] == "none" && signals.pairingCode().length > 0) {
            signals.setPairingCode("");
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
    const label = labelMaker("pairing");
    const plainText = textMaker("pairing");

    return <>
        <Show when={signals.hasAccessCode()}>
            {props.element}
        </Show>
        <Show when={!signals.hasAccessCode() && !isLoginStarted(signals)}>
            <div class="flex-column flex-grow">
                <div class="pairing-title flex-grow">{label("title")}</div>
                <button onClick={onClickLogin}>{plainText("link-account")} &nbsp;&nbsp; <i class="fa-solid fa-user"></i></button>
            </div>
        </Show>
        <Show when={!signals.hasAccessCode() && isLoginStarted(signals)}>
        <div class="flex-column flex-grow">
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
    </>;
}