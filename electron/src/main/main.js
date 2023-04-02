// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const { v4: uuidv4 } = require('uuid');
const path = require('path')
const axios = require('axios');
const { exec } = require('child_process');
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

function getWidth() {
  return process.env.width || 800;
}

function getHeight() {
  return process.env.height || 600;
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
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: getWidth(),
    height: getHeight(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    autoHideMenuBar: true,
    fullscreen: true,
    backgroundColor: '#000000',
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../../frontend-dist/index.html'));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

function addFishTag(options) {
  if (!("headers" in options)) {
    options["headers"] = {};
  }
  options["headers"]["X-Fish-Tag"] = uuidv4();
}

function addAuthHeader(options, authHeader) {
  if (!("headers" in options)) {
    options["headers"] = {};
  }
  if (authHeader) {
    options["headers"]["Authorization"] = authHeader;
  }
}

const axiosAPI = axios.create({
    timeout: 10 * 1000,
});
require('axios-debug-log').addLogger(axiosAPI, logger.debug);
function callAPI(config) {
  addFishTag(config);
  return axiosAPI(config);
}

class API {
  constructor() {
    this.jwt = "Bearer UninitialisedGarbage";
    this.authorised = false;
    this.clockSerial = process.env.clockSerial;
    this.clockSecret = process.env.clockSecret;
    this.baseURL = process.env.clockAPIBaseURL;
    this.jwtTimeout = new Date();
  }

  timeoutNow() {
    this.jwtTimeout = new Date();
  }

  incrementJwtTimeout() {
    let duration =  23 * 60 * 60 * 1000;
    this.jwtTimeout = new Date(this.jwtTimeout.getTime() + duration);
  }

  doGetClockData(jwt) {
    let apiURL = this.baseURL + '/api/clockdata';
    let config = {
      url: apiURL,
      method: "get",
    };
    addAuthHeader(config, jwt);
    return callAPI(config).then(resp => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }

  doSessionRemove(jwt) {
    let self = this;
    let apiURL = self.baseURL + '/api/session';
    let config = {
      url: apiURL,
      method: "delete",
    };
    addAuthHeader(config, jwt);
    return callAPI(config).then(resp => {
      self.timeoutNow();
      return {"ok" : resp.status == 204};
    });
  }

  doPairingCreate(jwt) {
    let apiURL = this.baseURL + '/api/pairing';
    let config = {
      url: apiURL,
      method: "post",
    };
    addAuthHeader(config, jwt);
    return callAPI(config).then(resp => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }

  doPairingGet(jwt, pairingCode) {
    let apiURL = this.baseURL + '/api/pairing/' + encodeURIComponent(pairingCode);
    let config = {
      url: apiURL,
      method: "get",
    };
    addAuthHeader(config, jwt);
    return callAPI(config).then(resp => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }

  doPairingComplete(jwt, pairingCode) {
    let apiURL = this.baseURL + '/api/pairing/' + encodeURIComponent(pairingCode);
    let config = {
      url: apiURL,
      method: "post",
    };
    addAuthHeader(config, jwt);
    return callAPI(config).then(resp => {
      return {"ok" : resp.status == 204};
    });
  }

  getClockData() {
    let self = this;
    return self.callAPIWithJWT((jwt) => self.doGetClockData(jwt));
  }

  pairingCreate() {
    let self = this;
    return self.callAPIWithJWT((jwt) => self.doPairingCreate(jwt));
  }

  pairingGet(pairingCode) {
    let self = this;
    return self.callAPIWithJWT((jwt) => self.doPairingGet(jwt, pairingCode));
  }

  pairingComplete(pairingCode) {
    let self = this;
    return self.callAPIWithJWT((jwt) => self.doPairingComplete(jwt, pairingCode));
  }

  sessionRemove() {
    let self = this;
    return self.callAPIWithJWT((jwt) => self.doSessionRemove(jwt));
  }

  callAPIWithJWT(cb) {
    let self = this;
    // Get a JWT if the old one has timed out.
    // The easiest way to be robust is simply to refresh login every so often.
    let now = new Date();
    if (self.jwtTimeout.getTime() < now.getTime()) {
      let authnURL = this.baseURL + '/authn/token';
      let authBody = {
        'DeviceSerial': this.clockSerial,
        'DeviceSecret': this.clockSecret,
        'TokenPolicy': 'Device',
        'Scopes': ['clock-data:read', 'pairing:create', 'pairing:get', 'pairing:complete']
      }
      let setJwtCache = (response) => {
        if (response.status == 401) {
          logger.error("bad serial or secret");
        } else if (response.status == 200) {
          logger.info("success getting JWT")
          self.jwt = `Bearer ${response.data["JWT"]}`;
          self.incrementJwtTimeout();
        } else {
          logger.error(`bad status getting jwt: ${response.status}`)
        }
        return self.jwt;
      }
      const authnConfig = {
        url: authnURL,
        method: 'post',
        data: authBody,
        headers: {
          "Content-Type": "application/json"
        }
      };
      return callAPI(authnConfig).then(setJwtCache).then(jwt => cb(jwt));
    }

    return cb(self.jwt);
  }

};

var api = new API()

function redeployDevEnvironment(callback) {
  exec(process.env.redeployCommand, (err, stdout, stderr) => {
    const deviceStatus = baseDeviceStatus();

    if (err) {
      deviceStatus["status"] = "command failed";
      deviceStatus["error"] = err;
    }
    callback(deviceStatus);
    // the *entire* stdout and stderr (buffered)
    logger.info(`redeploy stdout: ${stdout}`);
    logger.info(`redeploy stderr: ${stderr}`);
  });
}

function baseDeviceStatus() {
  return {
    "redeploy_enabled": isDevMode,
    "status": "ok",
    "ip_address": getIpAddress(),
    "www_base_url": getWwwBaseURL()
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
        api.timeoutNow();
        logger.error(`error calling ${sendChan} API: ${error}`)
        mainWindow.webContents.send(receiveChan, {"APIError": error});
      });
  });
}

handleIPCAPICall("pairingCreate", "pairingCreateResult", () => api.pairingCreate());
handleIPCAPICall("pairingGet", "pairingGetResult", (pairingCode) => api.pairingGet(pairingCode));
handleIPCAPICall("pairingComplete", "pairingCompleteResult", (pairingCode) => api.pairingComplete(pairingCode));
handleIPCAPICall("getClockData", "clockDataResult", () => api.getClockData());
handleIPCAPICall("sessionRemove", "sessionRemoveResult", () => api.sessionRemove());

ipcMain.on("deviceCommand", (event, command) => {
  switch (command["command"]) {
    case "redeploy":
      if (isDevMode) {
        logger.warn("redeploying device");
        redeployDevEnvironment(function (redeployStatus) {
          mainWindow.webContents.send("deviceStatus", redeployStatus);
        });
      } else {
        logger.error("requested redeploy but not dev mode");
        const deviceStatus = baseDeviceStatus();
        deviceStatus["status"] = "command failed";
        mainWindow.webContents.send("deviceStatus", deviceStatus)
      }
      break;
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