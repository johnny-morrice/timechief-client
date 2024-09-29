import { app, BrowserWindow } from 'electron';
import path from 'path';

function isShowDevTools() {
    return process.env.showDevTools == 'true';
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

let isDevMode = process.env.devMode == 'true';
let mainWindow;

export function getMainWindow() {
    return mainWindow;
}

function createWindow(callback) {
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
        callback();
    })
}

export function startTimechiefApp(logger, callback) {
    var refreshInterval = null;

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(() => {
        createWindow(callback);
        logger.info("GPU status: ", app.getGPUFeatureStatus());
        app.on('activate', function () {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
        // const refreshIntervalDuration = 30 * 1000; // 30 seconds for testing
        const refreshIntervalDuration = 60 * 60 * 18 * 1000; // 18 hours

        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        refreshInterval = setInterval(() => {
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

    logger.info(`Starting in ${isDevMode ? 'dev' : 'prod'} mode`);
    logger.info(`Width: ${getWidth()} Height: ${getHeight()}`);
    logger.info(`Fullscreen: ${isFullScreen()}`);
}