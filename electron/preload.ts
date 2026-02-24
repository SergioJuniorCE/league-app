import { ipcRenderer, contextBridge } from 'electron'

type GameStatusPayload = {
  active: boolean
}

type DesktopSource = {
  id: string
  name: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  onGameStatus(listener: (payload: GameStatusPayload) => void) {
    const wrappedListener = (_event: Electron.IpcRendererEvent, payload: GameStatusPayload) => {
      listener(payload)
    }

    ipcRenderer.on('game-status', wrappedListener)
    return () => {
      ipcRenderer.off('game-status', wrappedListener)
    }
  },
  getDesktopSources() {
    return ipcRenderer.invoke('get-desktop-sources') as Promise<DesktopSource[]>
  },
  saveRecording(recordingBuffer: ArrayBuffer) {
    return ipcRenderer.invoke('save-recording', recordingBuffer) as Promise<string>
  },
})
