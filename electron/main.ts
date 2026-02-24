import { app, BrowserWindow, desktopCapturer, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import https from 'node:https'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let gamePollInterval: NodeJS.Timeout | null = null
let isGameActive = false

function emitGameStatus(active: boolean) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('game-status', { active })
  }
}

function checkLiveGameState(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = https.request(
      {
        hostname: '127.0.0.1',
        port: 2999,
        path: '/liveclientdata/allgamedata',
        method: 'GET',
        rejectUnauthorized: false,
        timeout: 2000,
      },
      (response) => {
        response.resume()
        resolve(response.statusCode === 200)
      },
    )

    request.on('timeout', () => {
      request.destroy()
      resolve(false)
    })
    request.on('error', () => resolve(false))
    request.end()
  })
}

async function pollGameStatus() {
  const active = await checkLiveGameState()
  if (active !== isGameActive) {
    isGameActive = active
    emitGameStatus(active)
  }
}

function startGamePoller() {
  if (gamePollInterval) {
    return
  }

  void pollGameStatus()
  gamePollInterval = setInterval(() => {
    void pollGameStatus()
  }, 3000)
}

function stopGamePoller() {
  if (!gamePollInterval) {
    return
  }

  clearInterval(gamePollInterval)
  gamePollInterval = null
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('-')
}

function registerIpcHandlers() {
  ipcMain.handle('get-desktop-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 0, height: 0 },
      fetchWindowIcons: false,
    })

    return sources.map((source) => ({
      id: source.id,
      name: source.name,
    }))
  })

  ipcMain.handle('save-recording', async (_event, recordingBuffer: ArrayBuffer) => {
    const recordingsDir = path.join(app.getPath('videos'), 'LeagueRecordings')
    await fs.mkdir(recordingsDir, { recursive: true })

    const fileName = `league-${formatTimestamp(new Date())}.webm`
    const filePath = path.join(recordingsDir, fileName)
    const data = Buffer.from(new Uint8Array(recordingBuffer))
    await fs.writeFile(filePath, data)

    return filePath
  })
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopGamePoller()
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  registerIpcHandlers()
  startGamePoller()
  createWindow()
})
