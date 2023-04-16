// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
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

function getAPIBaseURL() {
  return process.env.clockAPIBaseURL;
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
logger.info(`Starting in ${isDevMode ? 'dev' : 'prod'} mode`);
logger.info(`Width: ${getWidth()} Height: ${getHeight()}`);
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

class LauncherClient {
  constructor(axios) {
    this.axios = axios;
    this.baseURL = getAPIBaseURL();
  }

  createPairing() {
    let cfg = {
      url: this.baseURL + '/api/pairing',
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
      url: this.baseURL + '/api/pairing',
      method: 'get'
    };
    return this.axios(cfg).then(resp => {
      if (resp.status == 200) {
        return resp.data;
      }
    });
  }
  getDeviceData() {
    let cfg = {
      url: this.baseURL + '/api/device',
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

function getClientVersion() {
  return process.env.clientVersion;
}

function baseDeviceStatus() {
  return {
    "redeploy_enabled": isDevMode,
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
        mainWindow.webContents.send(receiveChan, {"APIError": error});
      });
  });
}

handleIPCAPICall("pairingCreate", "pairingCreateResult", () => client.createPairing());
handleIPCAPICall("pairingGet", "pairingGetResult", () => client.getPairing());
handleIPCAPICall("getClockData", "clockDataResult", () => client.getDeviceData());

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