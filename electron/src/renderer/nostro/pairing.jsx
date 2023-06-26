import { createSignal, onCleanup } from 'solid-js';
import { addServiceDataCallback, addDeviceStatusCallback, sendPairingCreateRequest, sendPairingGetRequest, addPairingGetCallback, addPairingCreateCallback, removeDataCallback, removeDeviceStatusCallback, removePairingCreateCallback, removePairingGetCallback } from './ipc';
import { toCanvas } from 'qrcode';
import { callbackName } from "./callback";

class Signals {
    constructor() {
        [this.principalSerial, this.setPrincipalSerial] = createSignal("");
        [this.pairingCode, this.setPairingCode] = createSignal("");
        [this.wwwBaseURL, this.setWwwBaseURL] = createSignal("");
    }
}

function updateAccountPageSignals(signals, data) {
    let principal = data["LinkedPrincipal"];
    if ("PrincipalSerial" in principal) {
        signals.setPrincipalSerial(principal["PrincipalSerial"]);
    }
}

function updateAccountPageSignalsFromDevice(signals, deviceStatus) {
    signals.setWwwBaseURL(deviceStatus["www_base_url"]);
}

export const Pairing = () => {
    let signals = new Signals();
    const cbName = callbackName("Pairing");
    addServiceDataCallback(cbName, (data) => updateAccountPageSignals(signals, data));
    addDeviceStatusCallback(cbName, (data) => updateAccountPageSignalsFromDevice(signals, data));
    var pairingGetInterval = null;
    var pairingQrCodeCanvas = null;
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
        if (hasPairingCode(data["Code"])) {
            signals.setPairingCode(data["Code"]);
        }

        if (pairingQrCodeCanvas == null) {
            let canvasWrapper = document.getElementById("pairing-qrcode-canvas-wrapper");
            if (canvasWrapper) {
                pairingQrCodeCanvas = <canvas id="pairing-qrcode-canvas"></canvas>;
                canvasWrapper.appendChild(pairingQrCodeCanvas);
                toCanvas(pairingQrCodeCanvas, `${signals.wwwBaseURL()}/pairing?pairingCode=${encodeURIComponent(pairingCode)}`);
            }
        }
        // Pairing is complete if we've got a code and the state is now none.
        if (data["Status"] == "none" && hasPairingCode(signals.pairingCode())) {
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

    function hasPrincipalSerial(serial) {
        return serial.length > 0;
    }

    function hasPairingCode(pairingCode) {
        return pairingCode && pairingCode.length > 0;
    }

    function onClickLinkAccountButton() {
        sendPairingCreateRequest();
    }

    return <div class="pairing flex-column flex-grow">
        <div class="pairing-title flex-grow">Account Pairing</div>
        <Show when={hasPrincipalSerial(signals.principalSerial()) && !hasPairingCode(signals.pairingCode())}>
            <div class='pairing-button-wrapper flex-grow'>
                <button onClick={onClickLinkAccountButton} class="action-button crt-box">Relink your account &nbsp;&nbsp; <i class="fa-solid fa-user-plus"></i></button>
            </div>
        </Show>
        <Show when={!hasPrincipalSerial(signals.principalSerial()) && !hasPairingCode(signals.pairingCode())}>
            <div class="pairing-button-wrapper flex-grow">
                <button onClick={onClickLinkAccountButton} class="action-button crt-box">Link your account &nbsp;&nbsp; <i class="fa-solid fa-user-plus"></i></button>
            </div>
        </Show>
        <Show when={hasPairingCode(signals.pairingCode())}>
            <div class="flex-column flex-grow">
                <div class='flex-row'>
                    <div class="data-label">In your browser</div>
                    <div class="data-value">{signals.wwwBaseURL() + "/pairing"}</div>
                </div>
                <div class='flex-row'>
                    <div class="data-label">And enter your pairing code</div>
                    <div class="data-value">{signals.pairingCode}</div>
                </div>
                <div class="data-label">Or scan the QR code</div>
                <div id="pairing-qrcode-canvas-wrapper"></div>
            </div>
        </Show>
    </div>;
};