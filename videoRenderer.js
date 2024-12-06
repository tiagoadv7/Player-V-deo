const videoPlayer = document.getElementById('videoPlayer');

// Carrega o vídeo selecionado
window.electronAPI.onPlayVideo((videoPath) => {
  videoPlayer.src = videoPath;
  videoPlayer.play();
});

// Fecha o vídeo ao terminar
videoPlayer.addEventListener('ended', () => {
  window.close(0.1);
});

// Fecha o vídeo ao pressionar ESC
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.close();
  }
});
