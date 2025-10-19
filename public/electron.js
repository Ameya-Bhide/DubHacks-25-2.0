const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, 'icon.png'), // You can add an icon later
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  })

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`
  
  console.log('Loading URL:', startUrl)
  
  // Add retry logic for development server
  const loadApp = async () => {
    try {
      // For development, wait a bit longer for the server to be ready
      if (isDev) {
        console.log('Waiting for Next.js development server to be ready...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      await mainWindow.loadURL(startUrl)
    } catch (error) {
      if (isDev) {
        console.log('Development server not ready, retrying in 3 seconds...')
        setTimeout(loadApp, 3000)
      } else {
        console.error('Failed to load app:', error)
      }
    }
  }
  
  loadApp()

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Study Group',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Handle new study group creation
            mainWindow.webContents.send('menu-new-study-group')
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
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
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Study Group App',
          click: () => {
            // Show about dialog
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Study Group App',
              message: 'Study Group App',
              detail: 'A collaborative study platform for students\nVersion 1.0.0'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    event.preventDefault()
    require('electron').shell.openExternal(navigationURL)
  })
})
