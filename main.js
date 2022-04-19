// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const https = require('https');

let mainWindow;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

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

function httpGetAsync(hostname, path, authHeader, callback)
{
    const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: 'GET'
    };

    if (authHeader) {
      options["headers"] = {
        "Authorization": authHeader
      };
    }

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);

        res.on('data', d => {
            callback(res.statusCode, d);
        });
    })

    req.on('error', error => {
      console.error(error);
    });

    req.end();
}

function httpPostAsync(hostname, path, authHeader, body, callback)
{
    const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: 'POST',
        body: body,
    };

    if (authHeader) {
      options["headers"] = {
        "Authorization": authHeader
      };
    }

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);

        res.on('data', d => {
            callback(res.statusCode, d);
        });
    })

    req.on('error', error => {
      console.error(error);
    });

    req.end();
}

// TODO make class.
var jwt = undefined;
var authorised = false;
function getClockData(callback) {
  let hostname = process.env.apiHostname;
  let clockSerial = process.env.clockSerial;
  let clockSecret = process.env.clockSecret;
  let apiPath = '/api/clockdata'
  let authnPath = '/authn/token/clock'
  let doGetClockData = function () {
    httpGetAsync(hostname, apiPath, jwt, function(statusCode, clockDataText) {
      if (statusCode == 401) {
        // TODO helper methods to set jwt and authorization status.
        authorised = false;
        jwt = undefined;
        getClockDataWithAuthorisation();
      } else if (statusCode = 200) {
        callback(clockDataText);
      } else {
        authorised = false;
        jwt = undefined;
        console.log("bad status getting clock data: " + statusCode);
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
      httpPostAsync(hostname, authnPath, undefined, authBody, function(statusCode, tokenData) {
        if (statusCode == 401) {
          authorised = false;
          jwt = undefined;
          console.log("bad serial or secret");
        } else if (statusCode == 200) {
          let tokenText = String.fromCharCode(...data)
          let token = JSON.parse(tokenText);
          jwt = token["JWT"];
          authorised = true;
          doGetClockData()
        } else {
          authorised = false;
          jwt = undefined;
          console.log("bad status getting jwt: " + statusCode)
        }
      });
    }
  };
  getClockDataWithAuthorisation();
}

ipcMain.on("getClockData", (event, args) => {
  getClockData(function(responseText) {
    mainWindow.webContents.send("clockDataResult", responseText);
  });

});

process.env.OPEN_WEATHER_API_KEY