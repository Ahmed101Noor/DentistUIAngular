const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let splash;
let mainWindow;
let apiProcess;

function createSplash() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: false,
    show: true
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    icon: path.join(__dirname, 'assets/icons/icon.ico'),
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  const indexPath = path.join(__dirname, 'dist/DentistUI/browser/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      if (splash) splash.close();
      mainWindow.show();
    }, 2000);
  });
}

function startApi() {
  const apiExePath = path.join(process.resourcesPath, 'electron-api', 'DentalClinic.API.exe');

  try {
    apiProcess = spawn(apiExePath, [], {
      cwd: path.dirname(apiExePath),
      detached: true,
      stdio: 'ignore'
    });

    apiProcess.unref();
    console.log('✅ API started successfully');
  } catch (err) {
    console.error('❌ Failed to start API:', err);
  }
}

app.whenReady().then(() => {
  createSplash();    // ✅ اعرض Splash مباشرة
  startApi();        // ✅ شغّل الـ API

  // ✅ بعد ثانيتين افتح MainWindow (بعد ما يكون الـ API اشتغل)
  setTimeout(() => {
    createMainWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('before-quit', () => {
  if (apiProcess && !apiProcess.killed) {
    try {
      apiProcess.kill();
      console.log('🔴 API process killed on app quit.');
    } catch (e) {
      console.error('❌ Failed to kill API process:', e);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
