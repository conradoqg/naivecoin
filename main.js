const {app, Menu, BrowserWindow, shell, Tray, Notification} = require('electron')
const concord = require('./lib/concord')

let win
let tray = null

function createWindow () {
  concord('::', 3001, [], 6, '1')
  //  tray = new Tray('concordLogoSmall.ico')
  const contextMenu = Menu.buildFromTemplate([])
  // tray.setToolTip('Concord Core')
  // tray.setContextMenu(contextMenu)

  // var mainMenu = new Menu()
  Menu.setApplicationMenu(null)
  const ipc = require('electron').ipcMain

  win = new BrowserWindow({show: true, width: 810, height: 600, opacity: 0.97, minWidth: 810, minHeight: 600, backgroundColor: '#36393e', icon: 'img/concordLogoSmall.ico', frame: false})

  ipc.on('invokeAction', function (event, data) {
    event.sender.send('actionReply')
    setTimeout(function () { app.quit() }, 100)
  })
  win.loadFile('index.html')

  win.setThumbarButtons([])
  app.setUserTasks([])
  win.focus()
  win.webContents.openDevTools() // This opens the developer console, comment/uncomment to enable/disable for now.

  /* tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
  win.on('show', () => {
    tray.setHighlightMode('always')
  })
  win.on('hide', () => {
    tray.setHighlightMode('never')
  }) */

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
		    if (tray) {
			   tray.destroy()
		  }
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
