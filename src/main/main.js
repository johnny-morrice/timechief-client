// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const { v4: uuidv4 } = require('uuid');
const path = require('path')
const axios = require('axios');
const { exec } = require('child_process');

let mainWindow;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../renderer/preload.js'),
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile('dist/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

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
  options["headers"]["X-Fish-Tag"] = uuidv4();
}

function addAuthHeader(options, authHeader) {
  if (authHeader) {
    options["headers"]["Authorization"] = authHeader;
  }
}

function httpGetAsync(url, authHeader, callback)
{
    const config = {
      url: url,
      method: 'get',
      headers: {},
    };
    addFishTag(config);
    addAuthHeader(config, authHeader);
    axios(config).then(function (response) {
      console.log(`GET ${url} ${response.status}`);
      callback(response)
    });
}

function httpPostAsync(url, authHeader, body, callback)
{
  const config = {
    url: url,
    method: 'post',
    data: body,
    headers: {},
  };
  addFishTag(config);
  addAuthHeader(config, authHeader);
  axios(config).then(function (response) {
    console.log(`POST ${url} ${response.status}`);
    callback(response)
  });
}

// TODO make class.
var jwt = undefined;
var authorised = false;
function getClockData(callback) {
  let clockSerial = process.env.clockSerial;
  let clockSecret = process.env.clockSecret;
  let baseURL = process.env.clockAPIBaseURL;
  console.log(`device serial: ${clockSerial}`)
  console.log(`API Base URL: ${baseURL}`);
  let apiURL = baseURL + '/api/clockdata';
  let authnURL = baseURL + '/authn/token/clock';
  let doGetClockData = function () {
    httpGetAsync(apiURL, jwt, function(response) {
      if (response.status == 401) {
        console.log("unauthorised on clockdata API")
        // TODO helper methods to set jwt and authorization status.
        authorised = false;
        jwt = undefined;
        getClockDataWithAuthorisation();
      } else if (response.status = 200) {
        console.log("successfully hit clockdata API");
        callback(response.data);
      } else {
        authorised = false;
        jwt = undefined;
        console.log(`bad status getting clock data: ${response.status}`);
      }
    });
  };
  let authBody = {
    'DeviceSerial': clockSerial,
    'DeviceSecret': clockSecret,
  }
  let getClockDataWithAuthorisation = function() {
    if (authorised) {
      doGetClockData();
    } else {
      httpPostAsync(authnURL, undefined, authBody, function(response) {
        if (response.status == 401) {
          authorised = false;
          jwt = undefined;
          console.log("bad serial or secret");
        } else if (response.status == 200) {
          console.log("success getting JWT")
          jwt = `Bearer ${response.data["JWT"]}`;
          authorised = true;
          doGetClockData()
        } else {
          authorised = false;
          jwt = undefined;
          console.log(`bad status getting jwt: ${response.status}`)
        }
      });
    }
  };
  getClockDataWithAuthorisation();
}

function redeployDevEnvironment(callback) {
  exec('./script/redeployDevEnvironment.sh', (err, stdout, stderr) => {
    if (err) {
      callback({'redeploy_enabled': true, 'status': "fail", 'error': err});
    } else {
      callback({'redeploy_enabled': true, 'status': "ok"});
    }
  
    // the *entire* stdout and stderr (buffered)
    console.log(`redeploy stdout: ${stdout}`);
    console.log(`redeploy stderr: ${stderr}`);
  });
}

ipcMain.on("getClockData", (event, args) => {
  getClockData(function(clockDataResult) {
    mainWindow.webContents.send("clockDataResult", clockDataResult);
  });
});

let isDevMode = process.env.devMode == 'true';
mainWindow.webContents.send('redeployStatus', {'redeploy_enabled': isDevMode, 'status': "not started"});
if (isDevMode) {
  ipcMain.on("redeploy", (event, args) => {
    redeployDevEnvironment(function(redeployStatus) {
      mainWindow.webContents.send("redeployStatus", redeployStatus);
    });
  });
}

process.env.OPEN_WEATHER_API_KEY