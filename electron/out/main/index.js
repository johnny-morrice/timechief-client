"use strict";
const electron = require("electron");
const axios = require("axios");
const axiosDebugLog = require("axios-debug-log");
const winston = require("winston");
const os = require("os");
const path = require("path");
function getIpAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        return net.address;
      }
    }
  }
  return "unknown";
}
function getClientVersion() {
  return process.env.clientVersion;
}
function getWwwBaseURL() {
  return process.env.wwwBaseURL;
}
function baseDeviceStatus() {
  return {
    "status": "ok",
    "ip_address": getIpAddress(),
    "www_base_url": getWwwBaseURL(),
    "client_version": getClientVersion()
  };
}
function isShowDevTools() {
  return process.env.showDevTools == "true";
}
function getWidth() {
  return parseInt(process.env.timechief_width);
}
function getHeight() {
  return parseInt(process.env.timechief_height);
}
function isFullScreen() {
  return process.env.timechief_fullscreen == "true";
}
let isDevMode = process.env.devMode == "true";
let mainWindow;
function getMainWindow() {
  return mainWindow;
}
function createWindow(callback) {
  mainWindow = new electron.BrowserWindow({
    width: getWidth(),
    height: getHeight(),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js")
    },
    autoHideMenuBar: true,
    fullscreen: isFullScreen(),
    backgroundColor: "#000000",
    show: false
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isShowDevTools()) {
      mainWindow.webContents.openDevTools();
    }
    callback();
  });
}
function startTimechiefApp(logger2, callback) {
  var refreshInterval = null;
  electron.app.whenReady().then(() => {
    createWindow(callback);
    logger2.info("GPU status: ", electron.app.getGPUFeatureStatus());
    electron.app.on("activate", function() {
      if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    const refreshIntervalDuration = 60 * 60 * 18 * 1e3;
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
      logger2.info("Refreshing page");
      mainWindow.webContents.reloadIgnoringCache();
    }, refreshIntervalDuration);
  });
  electron.app.on("window-all-closed", function() {
    if (process.platform !== "darwin") electron.app.quit();
  });
  logger2.info(`Starting in ${isDevMode ? "dev" : "prod"} mode`);
  logger2.info(`Width: ${getWidth()} Height: ${getHeight()}`);
  logger2.info(`Fullscreen: ${isFullScreen()}`);
}
class LauncherClient {
  constructor(axios2) {
    this.axios = axios2;
    this.baseURL = getAPIBaseURL();
  }
  reboot() {
    let cfg = {
      url: this.baseURL + "/api/system/reboot",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status != 204) {
        logger.error(`reboot failed: ${resp.status}`);
        return {
          "APIError": "reboot failed"
        };
      }
      return {};
    });
  }
  shutdown() {
    let cfg = {
      url: this.baseURL + "/api/system/shutdown",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status != 204) {
        logger.error(`shutdown failed: ${resp.status}`);
        return {
          "APIError": "shutdown failed"
        };
      }
      return {};
    });
  }
  postLoggedIn() {
    let cfg = {
      url: this.baseURL + "/api/launcher/on-login",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 204) {
        return {};
      }
    });
  }
  createPairing() {
    let cfg = {
      url: this.baseURL + "/api/data/pairing",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 204) {
        return {};
      }
    });
  }
  getPairing() {
    let cfg = {
      url: this.baseURL + "/api/data/pairing",
      method: "get"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }
  postSetupBeginState() {
    let cfg = {
      url: this.baseURL + "/api/launcher/setup",
      method: "post",
      data: {
        "State": "Begin"
      }
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return {};
      }
    });
  }
  postSetupInternetConnectedState() {
    let cfg = {
      url: this.baseURL + "/api/launcher/setup",
      method: "post",
      data: {
        "State": "InternetConnected"
      }
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return {};
      }
    });
  }
  postWifiConnect() {
    let cfg = {
      url: this.baseURL + "/api/system/wifi/connect",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return {};
      }
    });
  }
  postWifiMarkReady() {
    let cfg = {
      url: this.baseURL + "/api/system/wifi/state",
      method: "post",
      data: {
        "Ready": true
      }
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return {};
      }
    });
  }
  postLogOut() {
    let cfg = {
      url: this.baseURL + "/api/data/logout",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 204) {
        return {};
      }
    });
  }
  postWifiMarkNotReady() {
    let cfg = {
      url: this.baseURL + "/api/system/wifi/state",
      method: "post",
      data: {
        "Ready": false
      }
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return {};
      }
    });
  }
  postRefreshMyDevices() {
    let cfg = {
      url: this.baseURL + "/api/data/mydevice/refresh",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 204) {
        return {};
      }
    });
  }
  postSelectMyDevice(uuid) {
    let cfg = {
      url: this.baseURL + "/api/data/mydevice",
      method: "post",
      data: {
        "UUID": uuid
      }
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 204) {
        return {};
      }
    });
  }
  getDeviceData() {
    let cfg = {
      url: this.baseURL + "/api/data/device",
      method: "get"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }
  postSSHEnabled(isEnabled) {
    if (typeof isEnabled !== "boolean") {
      console.log("isEnabled must be a boolean but was: " + JSON.stringify(isEnabled));
      return Promise.reject("isEnabled must be a boolean");
    }
    let cfg = {
      url: this.baseURL + "/api/system/firewall/ssh",
      method: "post",
      data: {
        "state": isEnabled
      }
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return {};
      }
    });
  }
  postAPIEnabled(isEnabled) {
    let cfg = {
      url: this.baseURL + "/api/system/firewall/api",
      method: "post",
      data: {
        "state": isEnabled
      }
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return {};
      }
    });
  }
  postSSHRegenPassword() {
    let cfg = {
      url: this.baseURL + "/api/system/ssh/regenerate",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }
  postAPIRegenKey() {
    let cfg = {
      url: this.baseURL + "/api/launcher/api-key/user",
      method: "post"
    };
    return this.axios(cfg).then((resp) => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }
}
function getAPIBaseURL() {
  return process.env.clockAPIBaseURL;
}
class Themer {
  constructor() {
    this.lastThemeCssKey = null;
    this.lastThemeCSS = null;
  }
  setThemeFromData(data) {
    if (data && data.media && data.media.theme_css) {
      this.setTheme(data.media.theme_css);
    }
  }
  setDefaultTheme() {
    this.setTheme(getDefaultThemeCSS());
  }
  setTheme(theme) {
    if (theme !== this.lastThemeCSS) {
      console.log("changing theme");
      this.lastThemeCSS = theme;
      if (this.lastThemeCssKey) {
        getMainWindow().webContents.removeInsertedCSS(this.lastThemeCssKey);
      }
      getMainWindow().webContents.insertCSS(theme).then((key) => {
        this.lastThemeCssKey = key;
      });
    }
  }
}
class BackgroundImageThemer {
  constructor() {
    this.lastThemeCssKey = null;
    this.lastThemeCSS = null;
  }
  setThemeFromData(data) {
    if (data && data.media && data.media.background_picture && data.media.background_picture.background_picture_css && data.media.background_picture.background_picture_css.length > 0) {
      this.setTheme(data.media.background_picture.background_picture_css);
    } else {
      this.setTheme("");
    }
  }
  setTheme(theme) {
    if (theme !== this.lastThemeCSS) {
      console.log("changing background image CSS");
      this.lastThemeCSS = theme;
      if (this.lastThemeCssKey) {
        getMainWindow().webContents.removeInsertedCSS(this.lastThemeCssKey);
      }
      getMainWindow().webContents.insertCSS(theme).then((key) => {
        this.lastThemeCssKey = key;
      });
    }
  }
}
function getDefaultThemeCSS() {
  return `body {
        color: green;
        background-color: black;
        font-family: 'Titillium Web', sans-serif;
    }
    
    div.home-time {
        font-family: 'Seven Segment', monospace;
    }
    
    div.home-box {
        background-color: black;
    }
    
    div.border {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
    }
    
    button.action-button {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
        background-color: black;
        color: green;
    }
    
    button.forecast-control-button {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
        background-color: black;
        color: green;
    }
    
    button.event-calendar-control-button {
        border-radius: 0;
        border-width: 1px;
        border-color: green;
        background-color: black;
        color: green;
    }
    
    div.inverted-color, span.inverted-color {
        color: black;
        background-color: green;
    }`;
}
class MediaDecorator {
  constructor() {
    this.mediaRoot = `${process.env.clockAPIBaseURL}/media`;
  }
  makeVideoURL(fileName) {
    return `${this.mediaRoot}/video/${fileName}`;
  }
  makePictureURL(fileName) {
    return `${this.mediaRoot}/picture/${fileName}`;
  }
  decorateData(data) {
    if (data && data.media) {
      if (data.media.video && data.media.video.videos) {
        const myVideos = data.media.video.videos.map((video) => {
          video.url = this.makeVideoURL(video.filename);
          return video;
        });
        data.media.video.videos = myVideos;
      }
      if (data.media.background_picture && data.media.background_picture.pictures) {
        const myPictures = data.media.background_picture.pictures.map((picture) => {
          picture.url = this.makePictureURL(picture.filename);
          return picture;
        });
        data.media.background_picture.pictures = myPictures;
        if (myPictures.length > 0) {
          const firstURL = myPictures[0].url;
          if (data.media.background_picture.background_picture_css) {
            let updatedCSS = data.media.background_picture.background_picture_css.replace(/__BACKGROUND_IMAGE_URL__/, firstURL);
            data.media.background_picture.background_picture_css = updatedCSS;
          }
        }
      }
    }
    return data;
  }
}
const logger$1 = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: {},
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});
if (process.env.NODE_ENV !== "production") {
  logger$1.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp(), winston.format.simple())
  }));
}
const themer = new Themer();
startTimechiefApp(logger$1, () => {
  console.log("app ready, setting default theme");
  themer.setDefaultTheme();
});
const axiosAPI = axios.create({
  timeout: 10 * 1e3
});
axiosAPI.defaults.headers.common["Authorization"] = `Bearer ${process.env.API_KEY}`;
axiosDebugLog.addLogger(axiosAPI, logger$1.debug);
var client = new LauncherClient(axiosAPI);
function handleIPCAPICall(sendChan, receiveChan, apiCall) {
  electron.ipcMain.on(sendChan, (event, args) => {
    apiCall(args).then((json) => {
      logger$1.info(`returning results to channel: ${receiveChan}`);
      getMainWindow().webContents.send(receiveChan, json);
    }).catch((error) => {
      logger$1.error(`error calling ${sendChan} API: ${error}`);
      getMainWindow().webContents.send(receiveChan, { "APIError": "error calling API" });
    });
  });
}
const mediaDecorator = new MediaDecorator();
const backgroundImageThemer = new BackgroundImageThemer();
function handleDataRequest() {
  return client.getDeviceData().then((data) => {
    let myData = mediaDecorator.decorateData(data);
    themer.setThemeFromData(myData);
    backgroundImageThemer.setThemeFromData(myData);
    return myData;
  });
}
handleIPCAPICall("refreshMyDevices", "refreshMyDevicesResult", () => client.postRefreshMyDevices());
handleIPCAPICall("loggedIn", "loggedInResult", () => client.postLoggedIn());
handleIPCAPICall("logOut", "logOutResult", () => client.postLogOut());
handleIPCAPICall("pairingCreate", "pairingCreateResult", () => client.createPairing());
handleIPCAPICall("pairingGet", "pairingGetResult", () => client.getPairing());
handleIPCAPICall("getClockData", "clockDataResult", () => handleDataRequest());
handleIPCAPICall("reboot", "rebootResult", () => client.reboot());
handleIPCAPICall("shutdown", "shutdownResult", () => client.shutdown());
handleIPCAPICall("setupBegin", "setupBeginResult", () => client.postSetupBeginState());
handleIPCAPICall("setupCancel", "setupCancelResult", () => client.postSetupInternetConnectedState().then(() => client.postWifiMarkReady()).then(() => client.postWifiConnect()));
handleIPCAPICall("setupRestart", "setupRestartResult", () => client.postSetupBeginState().then(() => client.postWifiMarkNotReady()));
handleIPCAPICall("sshPasswordRegen", "sshPasswordRegenResult", () => client.postSSHRegenPassword());
handleIPCAPICall("apiKeyRegen", "apiKeyRegenResult", () => client.postAPIRegenKey());
handleIPCAPICall("selectMyDevice", "selectMyDeviceResult", (args) => client.postSelectMyDevice(args["uuid"]));
electron.ipcMain.on("setSSHEnabled", (event, args) => {
  client.postSSHEnabled(args["state"]).then((json) => {
    getMainWindow().webContents.send("setSSHEnabledResult", json);
  }).catch((error) => {
    logger$1.error(`error calling sshEnabled API: ${error}`);
    getMainWindow().webContents.send("setSSHEnabledResult", { "APIError": "error calling API" });
  });
});
electron.ipcMain.on("setAPIEnabled", (event, args) => {
  client.postAPIEnabled(args["state"]).then((json) => {
    getMainWindow().webContents.send("setAPIEnabledResult", json);
  }).catch((error) => {
    logger$1.error(`error calling apiEnabled API: ${error}`);
    getMainWindow().webContents.send("setAPIEnabledResult", { "APIError": "error calling API" });
  });
});
electron.ipcMain.on("deviceCommand", (event, command) => {
  switch (command["command"]) {
    case "heartbeat":
      logger$1.debug("handling device heartbeat");
      getMainWindow().webContents.send("deviceStatus", baseDeviceStatus());
      break;
    default:
      logger$1.error(`unknown device command: ${command["command"]}`);
      const deviceStatus = baseDeviceStatus();
      deviceStatus["status"] = "command failed";
      getMainWindow().webContents.send("deviceStatus", deviceStatus);
      break;
  }
});
