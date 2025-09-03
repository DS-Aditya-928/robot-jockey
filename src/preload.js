// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPlaylist: async () => await ipcRenderer.invoke('get-playlist'),
  
  onPlaylistUpdate: (callback) => ipcRenderer.on("playlist-updated", (_, data) => callback(data)),
  onLibraryUpdate: (callback) => ipcRenderer.on("library-updated", (_, data) => callback(data)),

  selectPath: () => ipcRenderer.invoke("select-path"),
  scanLibrary: () => ipcRenderer.invoke("scan-library"),

  searchSongs: (query) => ipcRenderer.invoke("search-songs", query)
});