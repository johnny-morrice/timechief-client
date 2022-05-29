import { apiRefreshInterval } from "./timing";

export function sendClockDataRequest() {
    window.api.send("getClockData");
}

const clockDataCallbacks = [];
function receiveClockData() {
    window.api.receive("clockDataResult", (data) => {
        // let debugElement = document.getElementById('debug');
        // debugElement.innerText = JSON.stringify(data);
        if ("APIError" in data) {
            console.log(`error calling API: ${data["APIError"]}`);
        } else {
            clockDataCallbacks.forEach(cb => {
                cb(data);
            });
        }
    });
}

const deviceCallbacks = [];
function receiveRedeployStatus() {
    window.device.receive("deviceStatus", (status) => {
        console.log(`deviceStatus status: ${JSON.stringify(status)}`)
        deviceCallbacks.forEach(cb => {
            cb(status)
        });
    });
}

export function triggerRedeploy() {
    console.log("triggering redeploy...");
    window.device.send("deviceCommand", {'command': 'redeploy'});
}

export function sendDeviceHeartbeat() {
    console.log("sending device heartbeat...")
    window.device.send("deviceCommand", {'command': 'heartbeat'});
}

export function addDeviceStatusCallback(callback) {
    deviceCallbacks.push(callback);
}

export function addClockDataCallback(callback) {
    clockDataCallbacks.push(callback);
}

export function initializeIPC() {
    let interval = setInterval(() => {
        sendClockDataRequest();
        sendDeviceHeartbeat();
    },
        apiRefreshInterval
    );
    receiveRedeployStatus();
    receiveClockData();
    return interval;
}
