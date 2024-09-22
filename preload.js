const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectVideo: (videoPath) => ipcRenderer.send('select-video', videoPath),
  closeVideo: () => ipcRenderer.send('close-video'),
  onPlayVideo: (callback) => ipcRenderer.on('play-video', callback)
});
