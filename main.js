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

function httpGetAsync(hostname, path, callback)
{
    const options = {
        hostname: hostname,
        port: 443,
        path: path,
        method: 'GET'
    };

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);

        res.on('data', d => {
            callback(d);
        });
    })

    req.on('error', error => {
      console.error(error);
    });

    req.end();
}

function getOpenWeather(callback) {
  let hostname = 'api.openweathermap.org';
  let path = '/data/2.5/weather?lat=55.953251&lon=-3.188267&appid=' + process.env.OPEN_WEATHER_API_KEY;
  httpGetAsync(hostname, path, function(responseText) {
      callback(responseText);
  });
}

ipcMain.on("getWeather", (event, args) => {
  getOpenWeather(function(responseText) {
    mainWindow.webContents.send("weatherResult", responseText);
  });

});

process.env.OPEN_WEATHER_API_KEY