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

window.addEventListener('DOMContentLoaded', () => {

})