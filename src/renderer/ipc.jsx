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

export function addClockDataCallback(callback) {
    clockDataCallbacks.push(callback);
}

export function initializeIPC() {
    let tenMinutes = 1000 * 60 * 10;
    let interval = setInterval(
        sendClockDataRequest,
        tenMinutes
    );
    receiveClockData();
    return interval;
}
