// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  azeButtonClicked: (msg) => ipcRenderer.send('aze-button-click', msg),
  getPlaylist: async () => await ipcRenderer.invoke('get-playlist'),
  onPlaylistUpdate: (callback) => ipcRenderer.on("playlist-updated", (_, data) => callback(data))
});