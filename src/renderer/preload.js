const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel) => {
            let validChannels = ["getClockData", "pairingCreate", "pairingGet", "pairingComplete"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["clockDataResult", "pairingCreateResult", "pairingGetResult", "pairingCompleteResult"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);

contextBridge.exposeInMainWorld(
    "device", {
        send: (channel, ...args) => {
            let validChannels = ["deviceCommand"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, ...args);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["deviceStatus"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);
