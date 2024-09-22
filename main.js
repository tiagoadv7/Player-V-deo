const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
let mainWindow, videoWindow;

app.on('ready', () => {
  // Criar a janela principal
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icons/icon.png')
  });

  mainWindow.setMenu(null);  // Remove o menu padrão do Electron
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Abrir o diálogo de seleção de arquivos
  ipcMain.on('open-file-dialog', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],  // Permitir múltiplos arquivos
      filters: [
        { name: 'Vídeos', extensions: ['mp4', 'mkv', 'avi', 'mov'] }
      ]
    });

    if (!result.canceled) {
      result.filePaths.forEach(filePath => {
        event.sender.send('selected-files', [{
          name: path.basename(filePath),
          path: filePath
        }]);
      });
    }
  });

  // Reproduz o vídeo selecionado em tela cheia
  ipcMain.on('play-video', (event, videoUrl) => {
    const displays = screen.getAllDisplays();
    const externalDisplay = displays.find(display => display.bounds.x !== 0 || display.bounds.y !== 0);
    const display = externalDisplay || screen.getPrimaryDisplay();

    videoWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.size.width,
      height: display.size.height,
      fullscreen: true,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      icon: path.join(__dirname, 'assets/icons/icon.png')
    });

    videoWindow.loadFile(path.join(__dirname, 'video.html'));

    videoWindow.webContents.once('dom-ready', () => {
      videoWindow.webContents.send('load-video', videoUrl);
    });

    // Envia uma mensagem para remover o vídeo da fila ao fechar a janela
    videoWindow.on('closed', () => {
      mainWindow.webContents.send('video-played', videoUrl);  // Informa ao renderer que o vídeo foi reproduzido
    });
  });
});
