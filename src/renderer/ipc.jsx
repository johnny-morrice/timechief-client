export function sendClockDataRequest() {
    window.api.send("getClockData");
}

const clockDataCallbacks = [];
function receiveClockData() {
    window.api.receive("clockDataResult", (data) => {
        // let debugElement = document.getElementById('debug');
        // debugElement.innerText = JSON.stringify(data);
        clockDataCallbacks.forEach(cb => {
            cb(data);
        });
    });
}

const redeployCallbacks = [];
function receiveRedeployStatus() {
    window.dev.receive("redeployStatus", (status) => {
        console.log(`redeploy status: ${status}`)
        redeployCallbacks.forEach(cb => {
            cb(status)
        });
    });
}

function sendInit() {
    window.init.send('init');
}

export function triggerRedeploy() {
    console.log("triggering redeploy...");
    window.dev.send('redeploy');
}

export function addRedeployCallback(callback) {
    redeployCallbacks.push(callback);
}

export function addClockDataCallback(callback) {
    clockDataCallbacks.push(callback);
}

export function initializeIPC() {
    let tenMinutes = 1000 * 60 * 10;
    let interval = setInterval(
        sendClockDataRequest,
        tenMinutes
    );
    sendInit();
    receiveRedeployStatus();
    receiveClockData();
    return interval;
}
