const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let ollamaProcess = null;
let mainWindow = null;

// Figure out where the bundled Ollama binary and models live.
// In dev (npm start) they're under ./resources
// In a packaged app they're under process.resourcesPath
function getResourcePath(...segments) {
  const base = app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, 'resources');
  return path.join(base, ...segments);
}

function startOllama() {
  const platform = process.platform; // 'win32', 'darwin', 'linux'
  const binaryName = platform === 'win32' ? 'ollama.exe' : 'ollama';
  const ollamaBinary = getResourcePath('ollama', binaryName);
  const modelsPath = getResourcePath('models');

  if (!fs.existsSync(ollamaBinary)) {
    console.error('Ollama binary not found at', ollamaBinary);
    console.error('See resources/README.md for how to place it.');
    return;
  }

  ollamaProcess = spawn(ollamaBinary, ['serve'], {
    env: {
      ...process.env,
      OLLAMA_MODELS: modelsPath, // point Ollama at the bundled model files
      OLLAMA_HOST: '127.0.0.1:11500' // non-default port, avoids clashing with any system Ollama install
    }
  });

  ollamaProcess.stdout.on('data', (data) => console.log(`[ollama] ${data}`));
  ollamaProcess.stderr.on('data', (data) => console.log(`[ollama] ${data}`));
  ollamaProcess.on('error', (err) => console.error('Failed to start Ollama:', err));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'TJ',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  startOllama();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (ollamaProcess) ollamaProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (ollamaProcess) ollamaProcess.kill();
});
