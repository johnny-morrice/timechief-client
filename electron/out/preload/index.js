"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld(
  "api",
  {
    send: (channel, ...args) => {
      let validChannels = [
        "getClockData",
        "pairingCreate",
        "pairingGet",
        "reboot",
        "shutdown",
        "setupBegin",
        "setupCancel",
        "setupRestart",
        "loggedIn",
        "logOut",
        "refreshMyDevices",
        "sshPasswordRegen",
        "setSSHEnabled",
        "apiKeyRegen",
        "setAPIEnabled",
        "selectMyDevice"
      ];
      if (validChannels.includes(channel)) {
        electron.ipcRenderer.send(channel, ...args);
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
        "apiKeyRegenResult"
      ];
      if (validChannels.includes(channel)) {
        electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);
electron.contextBridge.exposeInMainWorld(
  "device",
  {
    send: (channel, ...args) => {
      let validChannels = ["deviceCommand"];
      if (validChannels.includes(channel)) {
        electron.ipcRenderer.send(channel, ...args);
      }
    },
    receive: (channel, func) => {
      let validChannels = ["deviceStatus"];
      if (validChannels.includes(channel)) {
        electron.ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);
