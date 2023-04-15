import { apiRefreshInterval, deviceRefreshInterval } from "./timing";

class APIResultReceiver {
    constructor(channel) {
        this.callbacks = [];
        this.channel = channel;
        this.lastData = null;
    }

    receive() {
        window.api.receive(this.channel, (data) => {
            if ("APIError" in data) {
                console.log(`error calling API for channel ${this.channel}: ${data["APIError"]}`);
            } else {
                this.lastData = data;
                console.log(`received data for channel: ${this.channel}: ${JSON.stringify(data)}`);
                this.callbacks.forEach(cb => {
                    cb(data);
                });
            }
        });
    }

    addCallback(cb) {
        if (this.lastData) {
            cb(this.lastData);
        }
        this.callbacks.push(cb);
    }
}

export const pairingCreateReceiver = new APIResultReceiver("pairingCreateResult");
export const pairingGetReceiver = new APIResultReceiver("pairingGetResult");
export const clockDataReceiver = new APIResultReceiver("clockDataResult");

const deviceCallbacks = [];
function receiveRedeployStatus() {
    window.device.receive("deviceStatus", (status) => {
        deviceCallbacks.forEach(cb => {
            cb(status)
        });
    });
}

export function addDeviceStatusCallback(cb) {
    deviceCallbacks.push(cb);
}

export function addClockDataCallback(cb) {
    clockDataReceiver.addCallback((data) => {
        if ("ServiceData" in data) {
            cb(data["ServiceData"])
        }
    });
}

export function addPairingCreateCallback(cb) {
    pairingCreateReceiver.addCallback(cb);
}

export function addPairingGetCallback(cb) {
    pairingGetReceiver.addCallback(cb);
}

export function triggerRedeploy() {
    console.log("triggering redeploy...");
    window.device.send("deviceCommand", {'command': 'redeploy'});
}

export function sendDeviceHeartbeat() {
    window.device.send("deviceCommand", {'command': 'heartbeat'});
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

export function initializeIPC() {
    let deviceInterval = setInterval(() => {
        sendDeviceHeartbeat();
    },
        deviceRefreshInterval
    );
    let apiInterval = setInterval(() => {
        sendClockDataRequest();
    },
        apiRefreshInterval
    );
    receiveRedeployStatus();
    clockDataReceiver.receive();
    pairingCreateReceiver.receive();
    pairingGetReceiver.receive();
    return [deviceInterval, apiInterval];
}
