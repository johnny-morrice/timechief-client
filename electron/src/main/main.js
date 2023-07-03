// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios');
const winston = require('winston');
const { networkInterfaces } = require('os');

function getIpAddress() {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
          // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
          // Just return the first IP address
          const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
          if (net.family === familyV4Value && !net.internal) {
              return net.address;
          }
      }
  }

  return "unknown";
}

function getWwwBaseURL() {
  return process.env.wwwBaseURL;
}

function isShowDevTools() {
  return process.env.showDevTools == 'true';
}

function getAPIBaseURL() {
  return process.env.clockAPIBaseURL;
}

function getWidth() {
  return parseInt(process.env.timechief_width);
}

function getHeight() {
  return parseInt(process.env.timechief_height);
}

function isFullScreen() {
  return process.env.timechief_fullscreen == 'true';
}

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: {},
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  }));
}

let isDevMode = process.env.devMode == 'true';

let mainWindow;
logger.info(`Starting in ${isDevMode ? 'dev' : 'prod'} mode`);
logger.info(`Width: ${getWidth()} Height: ${getHeight()}`);
logger.info(`Fullscreen: ${isFullScreen()}`);
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: getWidth(),
    height: getHeight(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    autoHideMenuBar: true,
    fullscreen: isFullScreen(),
    backgroundColor: '#000000',
    show: false,
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../../frontend-dist/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isShowDevTools()) {
      mainWindow.webContents.openDevTools();
    }
  })
}

var refreshInterval = null;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  logger.info("GPU status: ", app.getGPUFeatureStatus());
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  const refreshIntervalDuration = 30 * 1000; // 30 seconds for testing
  // const refreshIntervalDuration = 60 * 60 * 12 * 1000; // 12 hours
  
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval= setInterval(() => {
    logger.info("Refreshing page");
    mainWindow.webContents.reloadIgnoringCache();
  }, refreshIntervalDuration);
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

class LauncherClient {
  constructor(axios) {
    this.axios = axios;
    this.baseURL = getAPIBaseURL();
  }

  reboot() {
    let cfg = {
      url: this.baseURL + '/api/system/reboot',
      method: 'post'
    };
    return this.axios(cfg).then(resp => {
      if (resp.status != 204) {
        logger.error(`reboot failed: ${resp.status}`);
        return {
          "APIError": "reboot failed"
        }
      }
      return {};
    });
  }

  shutdown() {
    let cfg = {
      url: this.baseURL + '/api/system/shutdown',
      method: 'post'
    };
    return this.axios(cfg).then(resp => {
      if (resp.status != 204) {
        logger.error(`shutdown failed: ${resp.status}`);
        return {
          "APIError": "shutdown failed"
        }
      }
      return {};
    });
  }

  postLoggedIn() {
    let cfg = {
      url: this.baseURL + '/api/launcher/on-login',
      method: 'post'
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 204) {
        return {};
      }
    });
  }

  createPairing() {
    let cfg = {
      url: this.baseURL + '/api/data/pairing',
      method: 'post'
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 204) {
        return {};
      }
    });
  }

  getPairing() {
    let cfg = {
      url: this.baseURL + '/api/data/pairing',
      method: 'get'
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }
  postSetupBeginState() {
    let cfg = {
      url: this.baseURL + '/api/launcher/setup',
      method: 'post',
      data: {
        "State": "Begin"
      }
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return {};
      }
    });
  }

  postSetupInternetConnectedState() {
    let cfg = {
      url: this.baseURL + '/api/launcher/setup',
      method: 'post',
      data: {
        "State": "InternetConnected"
      }
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return {};
      }
    });
  }

  postWifiConnect() {
    let cfg = {
      url: this.baseURL + '/api/system/wifi/connect',
      method: 'post',
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return {};
      }
    });
  }

  postWifiMarkReady() {
    let cfg = {
      url: this.baseURL + '/api/system/wifi/state',
      method: 'post',
      data: {
        "Ready": true
      }
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return {};
      }
    });
  }

  postWifiMarkNotReady() {
    let cfg = {
      url: this.baseURL + '/api/system/wifi/state',
      method: 'post',
      data: {
        "Ready": false
      }
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return {};
      }
    });
  }

  getDeviceData() {
    let cfg = {
      url: this.baseURL + '/api/data/device',
      method: 'get'
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }
}

const axiosAPI = axios.create({
    timeout: 10 * 1000,
});
require('axios-debug-log').addLogger(axiosAPI, logger.debug);

var client = new LauncherClient(axiosAPI);

function getClientVersion() {
  return process.env.clientVersion;
}

function baseDeviceStatus() {
  return {
    "status": "ok",
    "ip_address": getIpAddress(),
    "www_base_url": getWwwBaseURL(),
    "client_version": getClientVersion()
  }
}

function handleIPCAPICall(sendChan, receiveChan, apiCall) {
  ipcMain.on(sendChan, (event, args) => {
    apiCall(args)
      .then(json => {
        logger.info(`returning results to channel: ${receiveChan}`);
        mainWindow.webContents.send(receiveChan, json)
      })
      .catch(error => {
        logger.error(`error calling ${sendChan} API: ${error}`)
        mainWindow.webContents.send(receiveChan, {"APIError": "error calling API"});
      });
  });
}

handleIPCAPICall("loggedIn", "loggedInResult", () => client.postLoggedIn());
handleIPCAPICall("pairingCreate", "pairingCreateResult", () => client.createPairing());
handleIPCAPICall("pairingGet", "pairingGetResult", () => client.getPairing());
handleIPCAPICall("getClockData", "clockDataResult", () => client.getDeviceData());
handleIPCAPICall("reboot", "rebootResult", () => client.reboot());
handleIPCAPICall("shutdown", "shutdownResult", () => client.shutdown());
handleIPCAPICall("setupBegin", "setupBeginResult", () => client.postSetupBeginState());
handleIPCAPICall("setupCancel", "setupCancelResult", () => client.postSetupInternetConnectedState().then(() => client.postWifiMarkReady()).then(() => client.postWifiConnect()));
handleIPCAPICall("setupRestart", "setupRestartResult", () => client.postSetupBeginState().then(() => client.postWifiMarkNotReady()));

ipcMain.on("deviceCommand", (event, command) => {
  switch (command["command"]) {
    case "heartbeat":
      logger.debug("handling device heartbeat")
      mainWindow.webContents.send("deviceStatus", baseDeviceStatus());
      break;
    default:
      logger.error(`unknown device command: ${command["command"]}`)
      const deviceStatus = baseDeviceStatus();
      deviceStatus["status"] = "command failed";
      mainWindow.webContents.send("deviceStatus", deviceStatus);
      break;
  }
});