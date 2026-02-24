import { app, desktopCapturer, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'

import { formatTimestamp } from './utils'

export function registerIpcHandlers() {
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
    const recordingsDir = path.join(app.getPath('videos'), 'CruxRecordings')
    await fs.mkdir(recordingsDir, { recursive: true })

    const fileName = `crux-${formatTimestamp(new Date())}.webm`
    const filePath = path.join(recordingsDir, fileName)
    const data = Buffer.from(new Uint8Array(recordingBuffer))
    await fs.writeFile(filePath, data)

    return filePath
  })
}
