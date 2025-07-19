const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;

// Configuration
const SERVER_URL = 'http://casaos.local:6969';
const FALLBACK_URL = 'http://localhost:6969';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'Radio Player',
    show: false,
    titleBarStyle: 'default'
  });

  // Try to connect to the server
  connectToServer();

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function connectToServer() {
  // First try casaos.local:6969
  mainWindow.loadURL(SERVER_URL);
  
  // Handle load failures
  mainWindow.webContents.on('did-fail-load', async (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL === SERVER_URL) {
      console.log('Failed to connect to casaos.local:6969, trying localhost...');
      try {
        await mainWindow.loadURL(FALLBACK_URL);
      } catch (error) {
        showConnectionError();
      }
    } else if (validatedURL === FALLBACK_URL) {
      showConnectionError();
    }
  });
}

function showConnectionError() {
  const errorHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connection Error</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .error-container {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; }
        p { margin-bottom: 30px; line-height: 1.6; }
        button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 0 10px;
        }
        button:hover { background: #45a049; }
        .retry-btn { background: #2196F3; }
        .retry-btn:hover { background: #1976D2; }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>🎵 Radio Server Not Found</h1>
        <p>Cannot connect to the radio server.<br>
        Please make sure your radio server is running on:<br>
        <strong>casaos.local:6969</strong> or <strong>localhost:6969</strong></p>
        
        <button class="retry-btn" onclick="location.reload()">🔄 Retry Connection</button>
        <button onclick="window.close()">❌ Close App</button>
      </div>
    </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html,${encodeURIComponent(errorHTML)}`);
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reconnect',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            connectToServer();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle certificate errors for local connections
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('http://localhost') || url.startsWith('http://casaos.local')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});