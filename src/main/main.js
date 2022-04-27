// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const { v4: uuidv4 } = require('uuid');
const path = require('path')
const axios = require('axios');
const { exec } = require('child_process');
const Mutex = require('async-mutex').Mutex;

let isDevMode = process.env.devMode == 'true';

let mainWindow;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../renderer/preload.js'),
    },
    autoHideMenuBar: true,
    fullscreen: true,
  })

  // and load the index.html of the app.
  mainWindow.loadFile('dist/index.html');
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

class ClockDataAPI {
  constructor() {
    this.jwt = null;
    this.authorised = false;
    this.clockSerial = process.env.clockSerial;
    this.clockSecret = process.env.clockSecret;
    this.baseURL = process.env.clockAPIBaseURL;
    this.mutex = new Mutex();
  }

  getClockData(callback) {
    let self = this;
    this.mutex
      .acquire()
      .then(function(release) {
          self.getClockDataWithAuthorisation(function (data) {
            callback(data);
            release();
          });
      })
  }

  doGetClockData(callback) {
    let self = this;
    let apiURL = this.baseURL + '/api/clockdata';
    httpGetAsync(apiURL, this.jwt, function(response) {
      if (response.status == 401) {
        console.log("unauthorised on clockdata API")
        self.authorised = false;
        self.jwt = null;
        self.getClockDataWithAuthorisation(callback);
      } else if (response.status = 200) {
        console.log("successfully hit clockdata API");
        callback(response.data);
      } else {
        self.authorised = false;
        self.jwt = null;
        console.log(`bad status getting clock data: ${response.status}`);
        this.mutex.release()
      }
    });
  }

  getClockDataWithAuthorisation(callback) {
    let self = this;
    let authnURL = this.baseURL + '/authn/token/clock';
    if (this.authorised) {
      this.doGetClockData(callback);
    } else {
      let authBody = {
        'DeviceSerial': this.clockSerial,
        'DeviceSecret': this.clockSecret,
      }
      httpPostAsync(authnURL, null, authBody, function(response) {
        if (response.status == 401) {
          self.authorised = false;
          self.jwt = null;
          console.log("bad serial or secret");
          this.mutex.release();
        } else if (response.status == 200) {
          console.log("success getting JWT")
          self.jwt = `Bearer ${response.data["JWT"]}`;
          self.authorised = true;
          self.doGetClockData(callback)
        } else {
          self.authorised = false;
          self.jwt = null;
          console.log(`bad status getting jwt: ${response.status}`)
          this.mutex.release()
        }
      });
    }
  };
}

var clockDataAPI = new ClockDataAPI()

function redeployDevEnvironment(callback) {
  exec(process.env.redeployCommand, (err, stdout, stderr) => {
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

function sendInitialRedeployStatus() {
  let initialRedeployStatus = {'redeploy_enabled': isDevMode, 'status': "not started"};
  mainWindow.webContents.send("redeployStatus", initialRedeployStatus);
}

ipcMain.on('init', (event, args) => {
  sendInitialRedeployStatus();
  mainWindow.webContents.send("initStatus", {'init_status': "ok"});
})

ipcMain.on("getClockData", (event, args) => {
  clockDataAPI.getClockData(function(clockDataResult) {
    mainWindow.webContents.send("clockDataResult", clockDataResult);
  });
});

if (isDevMode) {
  ipcMain.on("redeploy", (event, args) => {
    redeployDevEnvironment(function(redeployStatus) {
      mainWindow.webContents.send("redeployStatus", redeployStatus);
    });
  });
}