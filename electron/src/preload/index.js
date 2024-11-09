import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
    "api", {
    send: (channel, ...args) => {
        let validChannels = [
            "getClockData",
            "pairingCreate",
            "pairingGet",
            "reboot",
            "shutdown",
            "setupBegin",
            "setupCancel",
            "setNetworkType",
            "setupRestart",
            "loggedIn",
            "logOut",
            "refreshMyDevices",
            "sshPasswordRegen",
            "setSSHEnabled",
            "apiKeyRegen",
            "setAPIEnabled",
            "selectMyDevice",
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, ...args);
        }
    },
    receive: (channel, func) => {
        let validChannels = [
            "clockDataResult",
            "pairingCreateResult",
            "pairingGetResult",
            "rebootResult",
            "shutdownResult",
            "sshPasswordRegenResult",
            "apiKeyRegenResult",
        ];
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
