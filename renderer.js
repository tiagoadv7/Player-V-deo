const { ipcRenderer } = require('electron');

// Seletores
const openVideoBtn = document.getElementById('openVideoBtn');
const videoList = document.getElementById('queueList');  // Lista de vídeos
const modal = document.getElementById('modal');  // O modal de alerta
const closeModalBtn = document.getElementById('closeModal');  // Botão para fechar o modal
const aboutBtn = document.getElementById('aboutBtn'); // Botão "Sobre"
const aboutModal = document.getElementById('aboutModal'); // Modal "Sobre o App"
const closeAboutModalBtn = document.getElementById('closeAboutModal'); // Botão de fechar o modal
const errorMessage = document.getElementById('errorMessage'); // Mensagem de erro

// Fila de vídeos
let videoQueue = [];
const MAX_QUEUE_SIZE = 8;  // Limite de vídeos na fila

// Quando o botão for clicado, abre o diálogo para selecionar vídeos
openVideoBtn.addEventListener('click', () => {
  if (videoQueue.length < MAX_QUEUE_SIZE) {
    ipcRenderer.send('open-file-dialog');
  } else {
    openModal();  // Exibe o modal se a fila estiver cheia
  }
});

// Recebe os arquivos selecionados
ipcRenderer.on('selected-files', (event, files) => {
  files.forEach(file => {
    if (videoQueue.length < MAX_QUEUE_SIZE) {
      addVideoToQueue(file.path, file.name);
    }
  });
});

// Função para adicionar vídeo à fila
function addVideoToQueue(path, name) {
  const videoElement = document.createElement('video');
  videoElement.src = path;
  videoElement.preload = 'metadata';

  // Espera o vídeo carregar os metadados (duração)
  videoElement.onloadedmetadata = () => {
    const duration = formatTime(videoElement.duration);

    // Cria o item de vídeo na lista com o ícone, nome, duração e botão de remover
    const videoItem = document.createElement('li');
    videoItem.classList.add('video-item', 'flex', 'justify-between', 'gap-x-4', 'py-3', 'rounded-md', 'bg-gray-800', 'hover:bg-blue-500', 'cursor-pointer', 'transition-all');
    videoItem.dataset.path = path;  // Armazena o caminho do vídeo no dataset

    // Adiciona o conteúdo HTML dentro do item de vídeo
    videoItem.innerHTML = `
      <div class="flex min-w-0 flex-auto items-center">
        <p class="text-sm font-semibold leading-6 text-white truncate ml-2"><i class="fas fa-film"></i> ${name}</p>
      </div>
      <div class="flex items-center space-x-2 mr-2">
        <span class="text-sm text-gray-300">${duration}</span>
        <button class="remove-btn w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center" data-path="${path}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Adiciona evento de clique para abrir o vídeo no segundo monitor
    videoItem.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-btn') && !e.target.closest('.remove-btn')) {
        ipcRenderer.send('play-video', path); // Se o clique não foi no botão de remover
      }
    });

    // Adiciona evento de remoção ao botão de lixeira
    const removeBtn = videoItem.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
      removeVideoFromQueue(path);  // Remove o vídeo da fila e da interface
    });

    // Adiciona o vídeo à fila e exibe na lista
    videoList.appendChild(videoItem);
    videoQueue.push({ name, path });
  };
}

// Função para remover o vídeo da fila e da lista
function removeVideoFromQueue(videoPath) {
  // Remove o vídeo da fila
  videoQueue = videoQueue.filter(video => video.path !== videoPath);

  // Remove o item da lista de vídeos
  const videoItems = document.querySelectorAll('.video-item');
  videoItems.forEach(item => {
    if (item.dataset.path === videoPath) {
      item.remove();
    }
  });
}

// Recebe o sinal de que o vídeo foi reproduzido e remove da fila
ipcRenderer.on('video-played', (event, videoPath) => {
  removeVideoFromQueue(videoPath);
});

// Função para abrir o modal de alerta
function openModal() {
  modal.classList.remove('hidden');  // Exibe o modal
}

// Função para fechar o modal de alerta
function closeModal() {
  modal.classList.add('hidden');  // Oculta o modal
}

// Fecha o modal quando o botão "Ok" for clicado
closeModalBtn.addEventListener('click', closeModal);

// Função para abrir o modal de "Sobre o App"
aboutBtn.addEventListener('click', () => {
  aboutModal.classList.remove('hidden');
});

// Função para fechar o modal de "Sobre o App"
closeAboutModalBtn.addEventListener('click', () => {
  aboutModal.classList.add('hidden');
});

// Função para formatar o tempo em horas, minutos e segundos
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// ----------------------- Funções de Arrastar e Soltar -----------------------

// Função para lidar com o arrastar sobre a área
function handleDragOver(event) {
  event.preventDefault(); // Necessário para permitir o drop
  document.getElementById('dragMessage').classList.remove('hidden');
}

// Função para lidar com a saída da área de arraste
function handleDragLeave(event) {
  document.getElementById('dragMessage').classList.add('hidden');
}

// Função para lidar com o drop do vídeo
function handleDrop(event) {
  event.preventDefault();
  document.getElementById('dragMessage').classList.add('hidden');

  const files = event.dataTransfer.files;
  let invalidFiles = []; // Array para armazenar arquivos inválidos

  // Verifica se o arquivo é um vídeo e adiciona à lista
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.type.startsWith('video/')) {
      addVideoToQueue(URL.createObjectURL(file), file.name);
    } else {
      invalidFiles.push(file.name); // Adiciona arquivos inválidos ao array
    }
  }

  // Exibe mensagem de erro se houver arquivos inválidos
  if (invalidFiles.length > 0) {
    displayErrorMessage(`Arquivo inválido: ${invalidFiles.join(', ')}`);
  }
}

// Função para exibir a mensagem de erro
function displayErrorMessage(message) {
  errorMessage.textContent = message; // Define a mensagem de erro
  errorMessage.classList.remove('hidden'); // Exibe o erro
  setTimeout(() => {
    errorMessage.classList.add('hidden'); // Oculta o erro após 5 segundos
  }, 5000);
}

// Adiciona eventos de arrastar e soltar à área da fila de vídeos
videoList.addEventListener('dragover', handleDragOver);
videoList.addEventListener('dragleave', handleDragLeave);
videoList.addEventListener('drop', handleDrop);

// ----------------------- Controles de Reprodução de Vídeo -----------------------

// Variável de estado para alternar entre Play e Pause
let isPlaying = false;  // Começa em false para mostrar "Play" inicialmente

// Volume e configurações de transição
let currentVolume = 1.0;  // Volume inicial em 100%
const volumeStep = 0.1;   // Passo para ajuste gradual do volume
const volumeInterval = 100;  // Intervalo de ajuste do volume em milissegundos
let fadeInterval;  // Variável para armazenar o intervalo de fade

// Seletores
// const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const fadeOutBtn = document.getElementById('fadeOutBtn');
const volumeNormalBtn = document.getElementById('volumeNormalBtn');
const repeatBtn = document.getElementById('repeatBtn');

const playPauseBtn = document.getElementById('playPauseBtn');
    // const video = document.getElementById('myVideo');
    let isPaused = true;

    // Função simplificada para alternar o ícone
    function togglePlayPauseIcon() {
      const icon = playPauseBtn.querySelector('i');
      icon.classList.toggle('fa-play');
      icon.classList.toggle('fa-pause');
    }

    // Evento de clique no botão play/pause
    playPauseBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      video.paused ? video.play() : video.pause();
      togglePlayPauseIcon();
    });
  
// Função para aumentar o volume gradualmente até o nível atual do `targetVolume`
function fadeInVolume(targetVolume = 1.0) {
  clearInterval(fadeInterval);  // Interrompe qualquer fade-out em andamento

  fadeInterval = setInterval(() => {
    if (currentVolume < 1.0) { // Volume alvo é 100% (1.0)
      currentVolume = Math.min(currentVolume + 0.02, 1.0); // Incrementa suavemente o volume em 0.02
      ipcRenderer.send('video-control', { action: 'volume', value: currentVolume }); // Aplica o novo volume
    } else {
      clearInterval(fadeInterval); // Interrompe o fade-in quando atinge 100%
    }
  }, 50); // Intervalo de 50ms para atualizações suaves
}
// Função para diminuir o volume gradualmente até 0 ao pausar ou parar
function fadeOutVolume(targetVolume = 0, stopAfterFade = false, callback) {
  clearInterval(fadeInterval); // Interrompe qualquer fade-in em andamento

  fadeInterval = setInterval(() => {
    if (currentVolume > targetVolume) {
      currentVolume = Math.max(currentVolume - 0.02, targetVolume); // Reduz suavemente o volume
      ipcRenderer.send('video-control', { action: 'volume', value: currentVolume });
    } else {
      clearInterval(fadeInterval); // Interrompe o fade-out quando atinge o volume alvo
      if (stopAfterFade) ipcRenderer.send('video-control', { action: 'pause' }); // Pausa após o fade-out
      if (callback) callback(); // Executa o callback após o fade-out
    }
  }, 40); // Intervalo reduzido para suavidade
}
// Função para iniciar o volume baixo e fazer fade-in ao pressionar Play
function startPlayWithFadeIn() {
  clearInterval(fadeInterval); // Interrompe qualquer fade-out em andamento
  currentVolume = 0; // Garante que o volume inicial seja zero
  ipcRenderer.send('video-control', { action: 'volume', value: currentVolume }); // Aplica o volume inicial

}

// Modificação no evento Play/Pause para utilizar o efeito de fade-in suave ao iniciar
playPauseBtn.addEventListener('click', () => {
  ipcRenderer.send('video-control', { action: 'playPause' });

  if (isPlaying) {
    fadeOutVolume(0.2);  // Diminui o volume ao pausar
  } else {
    startPlayWithFadeIn();  // Aumenta o volume suavemente ao iniciar o play
  }

  isPlaying = !isPlaying;
  togglePlayPauseIcon();
});

// Evento Stop
stopBtn.addEventListener('click', () => {
  fadeOutVolume(0, true, () => {
    ipcRenderer.send('video-control', { action: 'stop' });
    ipcRenderer.send('close-window');  // Fecha a janela após o fade-out

    // Reseta o estado para o próximo uso
    isPlaying = false;
    currentVolume = 1.0;  // Define o volume inicial ao máximo para o próximo play
    togglePlayPauseIcon();
  });
});

// Evento Atenuar Volume (para 20%)
fadeOutBtn.addEventListener('click', () => {
  fadeOutVolume(currentVolume * 0.2);  // Atenua o volume para 20% do volume atual
});

// Evento Restaurar Volume para 100%
volumeNormalBtn.addEventListener('click', () => {
  fadeInVolume(1.0);  // Restaura o volume ao máximo
});

// Evento Repetir
repeatBtn.addEventListener('click', () => {
  ipcRenderer.send('video-control', { action: 'repeat' });
});
