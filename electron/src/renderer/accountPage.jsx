import { createSignal, onCleanup } from 'solid-js';
import { addClockDataCallback, addDeviceStatusCallback, sendPairingCreateRequest, sendPairingGetRequest, addPairingGetCallback, addPairingCreateCallback } from './ipc';
import { toCanvas } from 'qrcode';

class AccountPageSignals {
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

var initialised = false;
let accountSignals = new AccountPageSignals();
export const AccountPage = () => {
  var pairingGetInterval = null;
  var pairingQrCodeCanvas = null;
  onCleanup(() => {
    if (pairingGetInterval != null) {
        clearInterval(pairingGetInterval);
    }
    removeQrCode();
  });
  if (!initialised) {
    addClockDataCallback((data) => updateAccountPageSignals(accountSignals, data));
    addDeviceStatusCallback((data) => updateAccountPageSignalsFromDevice(accountSignals, data));
    addPairingCreateCallback((data) => {
        console.log(`pairing create result: ${JSON.stringify(data)}`);
        accountSignals.setPairingCode(data["Code"]);
        pairingGetInterval = setInterval(() => {
            let pairingCode = accountSignals.pairingCode();
            if (hasPairingCode(pairingCode)) {
                sendPairingGetRequest(accountSignals.pairingCode());
            }
            if (pairingQrCodeCanvas == null) {
                let canvasWrapper = document.getElementById("pairing-qrcode-canvas-wrapper");
                pairingQrCodeCanvas = <canvas id="pairing-qrcode-canvas"></canvas>;
                canvasWrapper.appendChild(pairingQrCodeCanvas);
                toCanvas(pairingQrCodeCanvas, `${accountSignals.wwwBaseURL()}/pairing?pairingCode=${encodeURIComponent(pairingCode)}`);
            }
        }, 300);
    });
    addPairingCompleteCallback((data) => {
        if (data["ok"]) {
            accountSignals.setPairingCode("");
            if (pairingGetInterval != null) {
                clearInterval(pairingGetInterval);
            }
            sendSessionRemoveRequest();
        }

        
    });
    addPairingGetCallback((data) => {
        if (data["Status"] == "linked") {
            let pairingCode = accountSignals.pairingCode();
            if (hasPairingCode(pairingCode)) {
                sendPairingCompleteRequest(pairingCode);
            } else {
                console.log("cannot complete pairing, lost pairing code");
            }
        }
    });
    initialised = true;
  }

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
      return pairingCode.length > 0;
  }

  function onClickLinkAccountButton() {
    sendPairingCreateRequest();
  }

  return <div id="account-screen">
        <Show when={hasPrincipalSerial(accountSignals.principalSerial())}>
        <div class="column-flex">
            <div class="flex-element section-name underline">Your account</div>
            <div class='row-flex flex-element'>
                <div class="flex-element data-name">Principal serial</div>
                <div class="flex-element data-value">{accountSignals.principalSerial}</div>
            </div>
            <Show when={!hasPairingCode(accountSignals.pairingCode())}>
                <div class='row-flex flex-element'>
                    <div class="flex-element">
                        <button onClick={onClickLinkAccountButton}>Link your account <i class="fa-solid fa-user-plus"></i></button>
                    </div>
                </div>
            </Show>
        </div>
        </Show>
        <Show when={!hasPrincipalSerial(accountSignals.principalSerial())}>
        <div class="column-flex">
            <div class="flex-element section-name underline">Link your account</div>
            <Show when={!hasPairingCode(accountSignals.pairingCode())}>
                <div class='row-flex flex-element'>
                    <div class="flex-element">
                        <button onClick={onClickLinkAccountButton}>Link your account <i class="fa-solid fa-user-plus"></i></button>
                    </div>
                </div>
            </Show>
        </div>
        </Show>
        <Show when={hasPairingCode(accountSignals.pairingCode())}>
            <div class="column-flex">
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">Go to</div>
                    <div class="flex-element data-value">{accountSignals.wwwBaseURL() + "/pairing"}</div>
                </div>
                <div class='row-flex flex-element'>
                    <div class="flex-element data-name">And enter your pairing code</div>
                    <div class="flex-element data-value">{accountSignals.pairingCode}</div>
                </div>
                <div class="flex-element data-name">Or scan the QR code</div>
                <div id="pairing-qrcode-canvas-wrapper">
                </div>
            </div>
        </Show>
  </div>;
};