import { refreshInterval, ecoRefreshInterval } from "./util/timing";

class APIResultReceiver {
    constructor(channel) {
        this.callbacks = {};
        this.channel = channel;
        this.lastData = null;
    }

    receive() {
        window.api.receive(this.channel, (data) => {
            if ("APIError" in data) {
                console.log(`error calling API for channel ${this.channel}: ${data["APIError"]}`);
            } else {
                this.lastData = data;
                for (const [_, cb] of Object.entries(this.callbacks)) {
                    cb(data);
                }
            }
        });
    }

    addCallback(name, cb) {
        if (this.lastData) {
            cb(this.lastData);
        }
        this.callbacks[name] = cb;
    }

    removeCallback(name) {
        delete this.callbacks[name];
    }
}

export const pairingCreateReceiver = new APIResultReceiver("pairingCreateResult");
export const pairingGetReceiver = new APIResultReceiver("pairingGetResult");
export const clockDataReceiver = new APIResultReceiver("clockDataResult");
export const rebootReceiver = new APIResultReceiver("rebootResult");
export const shutdownReceiver = new APIResultReceiver("shutdownResult");
export const setupBeginReceiver = new APIResultReceiver("setupBeginResult");
export const sshPasswordRegenReceiver = new APIResultReceiver("sshPasswordRegenResult");
export const apiKeyRegenReceiver = new APIResultReceiver("apiKeyRegenResult");
export const debugReceiver = new APIResultReceiver("debugSystemResult");

const deviceCallbacks = {};
function receiveDeviceStatus() {
    window.device.receive("deviceStatus", (status) => {
        for (const [_, cb] of Object.entries(deviceCallbacks)) {
            cb(status);
        }
    });
}

export function addDeviceStatusCallback(name, cb) {
    deviceCallbacks[name] = cb;
}

export function removeDeviceStatusCallback(name) {
    delete deviceCallbacks[name];
}

export function addServiceDataCallback(name, cb) {
    clockDataReceiver.addCallback(name, (data) => {
        if ("service_data" in data && !isEmpty(data["service_data"])) {
            cb(data["service_data"]);
        }
    });
}

function isEmpty(obj) {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }

    return true;
}

export function addDebugSystemCallback(name, cb) {
    debugReceiver.addCallback(name, cb);
}

export function removeDebugSystemCallback(name) {
    debugReceiver.removeCallback(name);
}

export function addSSHPasswordRegenCallback(name, cb) {
    sshPasswordRegenReceiver.addCallback(name, cb);
}

export function removeSSHPasswordRegenCallback(name) {
    sshPasswordRegenReceiver.removeCallback(name);
}

export function addAPIRegenKeyCallback(name, cb) {
    apiKeyRegenReceiver.addCallback(name, cb);
}

export function removeAPIRegenKeyCallback(name) {
    apiKeyRegenReceiver.removeCallback(name);
}

export function addDataCallback(name, cb) {
    clockDataReceiver.addCallback(name, cb);
}

export function removeDataCallback(name) {
    clockDataReceiver.removeCallback(name);
}

export function addPairingCreateCallback(name, cb) {
    pairingCreateReceiver.addCallback(name, cb);
}

export function removePairingCreateCallback(name) {
    pairingCreateReceiver.removeCallback(name);
}

export function addPairingGetCallback(name, cb) {
    pairingGetReceiver.addCallback(name, cb);
}

export function removePairingGetCallback(name) {
    pairingGetReceiver.removeCallback(name);
}

export function sendDebugSystem() {
    window.api.send("debugSystem");
}

export function sendLoadDefaultCSS() {
    window.api.send("loadDefaultCSS");
}

export function sendResizeBrowserWindow(width, height) {
    window.api.send("resizeBrowserWindow", {width: width, height: height});
}

export function sendSSHRegenPassword() {
    window.api.send("sshPasswordRegen");
}

export function sendSetSSHEnabled(isEnabled) {
    window.api.send("setSSHEnabled", { "state": isEnabled });
}

export function sendSetNetworkTypeWifi() {
    window.api.send("setNetworkType", { "network_type": "wifi"});
}

export function sendSetNetworkTypeManual() {
    window.api.send("setNetworkType", { "network_type": "manual"});
}

export function sendAPIRegenKey() {
    window.api.send("apiKeyRegen");
}

export function sendSetAPIEnabled(isEnabled) {
    window.api.send("setAPIEnabled", { "state": isEnabled });
}

export function sendDeviceHeartbeat() {
    window.device.send("deviceCommand", { 'command': 'heartbeat' });
}

export function sendClockDataRequest() {
    window.api.send("getClockData");
}

export function sendPairingCreateRequest() {
    window.api.send("pairingCreate");
}

export function sendPairingGetRequest() {
    window.api.send("pairingGet");
}

export function sendReboot() {
    window.api.send("reboot");
}

export function sendRefreshMyDevices() {
    window.api.send("refreshMyDevices");
}

export function sendSelectMyDevice(uuid) {
    window.api.send("selectMyDevice", { "uuid": uuid });
}

export function sendSetupBegin() {
    window.api.send("setupBegin");
}

export function sendLogOut() {
    window.api.send("logOut");
}

export function sendSetupCancel() {
    window.api.send("setupCancel");
}

export function sendSetupRestart() {
    window.api.send("setupRestart");
}

export function sendShutdown() {
    window.api.send("shutdown");
}

export function sendLoggedIn() {
    window.api.send("loggedIn");
}

var lastInteracted = new Date();

export function recordInteraction() {
    const interactionDebug = false;
    if (interactionDebug) {
        console.log("recorded interaction");
    }
    lastInteracted = new Date();
}

export function isEcoMode() {
    const interactionDuration = 30 * 1000; // 30 seconds marks an interaction period.
    const now = new Date();
    return now - lastInteracted > interactionDuration;
}

export function initializeIPC() {
    lastInteracted = new Date();
    let fastDeviceInterval = setInterval(() => {
        if (!isEcoMode()) {
            sendDeviceHeartbeat();
        }
    }, refreshInterval
    );
    let fastApiInterval = setInterval(() => {
        if (!isEcoMode()) {
            sendClockDataRequest();
        }
    }, refreshInterval
    );
    let ecoApiInterval = setInterval(() => {
        if (isEcoMode()) {
            sendClockDataRequest();
        }
    }, ecoRefreshInterval
    );
    let ecoDeviceInterval = setInterval(() => {
        if (isEcoMode()) {
            sendDeviceHeartbeat();
        }
    }, ecoRefreshInterval
    );
    sendClockDataRequest();
    sendDeviceHeartbeat();
    receiveDeviceStatus();
    clockDataReceiver.receive();
    pairingCreateReceiver.receive();
    pairingGetReceiver.receive();
    rebootReceiver.receive();
    shutdownReceiver.receive();
    setupBeginReceiver.receive();
    sshPasswordRegenReceiver.receive();
    apiKeyRegenReceiver.receive();
    debugReceiver.receive();
    sendLoggedIn();
    return [fastDeviceInterval, fastApiInterval, ecoApiInterval, ecoDeviceInterval];
}
