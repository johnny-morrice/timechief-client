// Modules to control application life and create native browser window
const { ipcMain } = require('electron');
const axios = require('axios');
const winston = require('winston');
const { baseDeviceStatus } = require('./status.js');
const { startTimechiefApp, getMainWindow } = require('./window.js');
const { LauncherClient } = require('./launcherclient.js');
const { Themer } = require('./themer.js');
const { MediaDecorator } = require('./mediadecorator.js');

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

const themer = new Themer();
startTimechiefApp(logger, () => {
  console.log("app ready, setting default theme");
  themer.setDefaultTheme();
});

const axiosAPI = axios.create({
  timeout: 10 * 1000,

});
axiosAPI.defaults.headers.common['Authorization'] = `Bearer ${process.env.API_KEY}`;
require('axios-debug-log').addLogger(axiosAPI, logger.debug);

var client = new LauncherClient(axiosAPI);

function handleIPCAPICall(sendChan, receiveChan, apiCall) {
  ipcMain.on(sendChan, (event, args) => {
    apiCall(args)
      .then(json => {
        logger.info(`returning results to channel: ${receiveChan}`);
        getMainWindow().webContents.send(receiveChan, json)
      })
      .catch(error => {
        logger.error(`error calling ${sendChan} API: ${error}`)
        getMainWindow().webContents.send(receiveChan, { "APIError": "error calling API" });
      });
  });
}

const mediaDecorator = new MediaDecorator();

function handleDataRequest() {
  return client.getDeviceData().then(data => {
    themer.setThemeFromData(data);
    return mediaDecorator.decorateData(data);
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

ipcMain.on("setSSHEnabled", (event, args) => {
  client.postSSHEnabled(args["state"])
    .then(json => {
      getMainWindow().webContents.send("setSSHEnabledResult", json)
    })
    .catch(error => {
      logger.error(`error calling sshEnabled API: ${error}`)
      getMainWindow().webContents.send("setSSHEnabledResult", { "APIError": "error calling API" });
    });
});
ipcMain.on("setAPIEnabled", (event, args) => {
  client.postAPIEnabled(args["state"])
    .then(json => {
      getMainWindow().webContents.send("setAPIEnabledResult", json)
    })
    .catch(error => {
      logger.error(`error calling apiEnabled API: ${error}`)
      getMainWindow().webContents.send("setAPIEnabledResult", { "APIError": "error calling API" });
    });
});
ipcMain.on("deviceCommand", (event, command) => {
  switch (command["command"]) {
    case "heartbeat":
      logger.debug("handling device heartbeat")
      getMainWindow().webContents.send("deviceStatus", baseDeviceStatus());
      break;
    default:
      logger.error(`unknown device command: ${command["command"]}`)
      const deviceStatus = baseDeviceStatus();
      deviceStatus["status"] = "command failed";
      getMainWindow().webContents.send("deviceStatus", deviceStatus);
      break;
  }
});