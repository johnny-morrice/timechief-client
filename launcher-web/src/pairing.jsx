import { linkAccount, getPairingStatus, ping } from "./api";
import { appRedirect } from "./redirect";
import { onMount, createSignal } from "solid-js";

const pairingCodeLength = 9;

export const Pairing = () => {
    let [isLoggedIn, setLoggedIn] = createSignal(false);
    onMount(() => {
        ping().then(() => setLoggedIn(true));
        const queryParams = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
          });
        const pairingCodeParam = queryParams.pairingCode;
        if (pairingCodeParam) {
            const elem = document.getElementById("pairing-code-input");
            elem.value = pairingCodeParam;
            submitPairingCode();
        }
    });
    function submitPairingCode() {
        clearPairingLinkError();
        clearPairingMessage();
        const pairingCode = readPairingCodeInput();
        if (pairingCode.length == pairingCodeLength) {
            pairDevice(pairingCode);
        }
    }
    function readPairingCodeInput() {
        const elem = document.getElementById("pairing-code-input");
        return elem.value.trim();
    }
    function setPairingCodeEnabled(isEnabled) {
        const elem = document.getElementById("pairing-code-input");
        if (!isEnabled) {
            elem.setAttribute("disabled", "true")
        } else {
            elem.removeAttribute("disabled");
        }
    }
    function pairDevice(pairingCode) {
        linkAccount(pairingCode).then(resp => {
            clearPairingLinkError();
            if (resp.status == 204) {
                waitForCompletion();  
            } else if (resp.status == 401) {
                console.log("pairing auth failure");
            } else {
                console.log("pairing failure...")
                console.log(resp);
                setPairingLinkError("Pairing failed");
            }
        }).catch(err => {
            setPairingLinkError(`Error pairing device: ${err}`);
        });
    }
    var completionInterval = null;
    function waitForCompletion() {
        removePairingLinkError();
        setPairingMessage("Code accepted, please wait...")
        setPairingCodeEnabled(false);
        completionInterval = setInterval(() => {
            clearPairingCompleteError();
            setPairingMessage("Code accepted, please wait...")
            const pairingCode = readPairingCodeInput();
            getPairingStatus(pairingCode).then(resp => {
                if (resp["Status"] == "complete") {
                    appRedirect();
                    if (completionInterval != null) {
                        clearInterval(completionInterval);
                    }
                }
            }).catch(err => {
                console.log(err);
                setPairingCodeEnabled(true);
                clearPairingMessage();
                setPairingCompleteError("Error getting pairing code status");
            })
        }, 300);
    }

    function removePairingLinkError() {
        const wrapperElem = document.getElementById("pairing-link-error-wrapper");
        const errorElem = document.getElementById("pairing-link-error");
        wrapperElem.removeChild(errorElem);
    }
    function clearPairingLinkError() {
        setPairingLinkError("");
    }
    
    function setPairingLinkError(errorText) {
        const errorElem = document.getElementById("pairing-link-error");
        if (errorElem) {
            errorElem.innerText = errorText;
        } else {
            console.log(`link error has been removed, cannot display: ${errorText}`);
        }
    }
    function clearPairingCompleteError() {
        setPairingCompleteError("");
    }
    
    function setPairingCompleteError(errorText) {
        const errorElem = document.getElementById("pairing-complete-error");
        errorElem.innerText = errorText;
    }
    function clearPairingMessage() {
        setPairingMessage("");
    }
    
    function setPairingMessage(messageText) {
        console.log(`setting pairing message: ${messageText}`);
        const messageElem = document.getElementById("pairing-complete-message");
        messageElem.innerText = messageText;
    }
    function handlePairingCodeKeyup() {
        const pairingCode = readPairingCodeInput();
        if (pairingCode.length == pairingCodeLength) {
            submitPairingCode();
        }
    }
    
    return <Show when={isLoggedIn()} fallback={<div id="loading-message">Loading...</div>}>
        <div class="pairing-root">
            <div class="site-nav-bar">
                <div class="site-name-home">Timechief</div>
            </div>
            <div class="pairing-content">
                <h1 class="pairing-title">Link your device</h1>
                <div class="pairing-instructions">Enter nine digit pairing code or scan device QR code</div>
                <div class="pairing-input-wrapper">
                    <input class="pairing-code-input" id="pairing-code-input" onKeyUp={handlePairingCodeKeyup} onBlur={submitPairingCode}></input>
                </div>
                <div id="pairing-complete-message"></div>
                <div id="pairing-link-error-wrapper">
                    <div id="pairing-link-error"></div>
                </div>
                <div id="pairing-complete-error"></div>
            </div>
        </div>
    </Show>
}