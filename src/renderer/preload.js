const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel) => {
            let validChannels = ["getClockData"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["clockDataResult"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);

contextBridge.exposeInMainWorld(
    "init", {
        send: (channel) => {
            let validChannels = ["init"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["initStatus"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
)

contextBridge.exposeInMainWorld(
    "dev", {
        send: (channel) => {
            let validChannels = ["redeploy"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["redeployStatus"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);
