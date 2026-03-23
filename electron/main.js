const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const DIST = path.join(__dirname, '..', 'dist');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 480,
    minHeight: 600,
    title: 'FluxMath',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#020c10',
    autoHideMenuBar: true,
  });

  win.loadFile(path.join(DIST, 'index.html'));
}

app.whenReady().then(() => {
  // Intercept file:// requests so that react-router paths resolve to index.html
  protocol.interceptFileProtocol('file', (request, callback) => {
    let filePath = url.fileURLToPath(request.url);

    // Normalise — strip any query / hash
    filePath = filePath.split('?')[0].split('#')[0];

    // If the file exists on disk, serve it as-is (JS, CSS, MP3, fonts …)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return callback({ path: filePath });
    }

    // Otherwise it's a client-side route → serve index.html (SPA fallback)
    return callback({ path: path.join(DIST, 'index.html') });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
