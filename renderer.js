const { ipcRenderer } = require('electron');

// Seletores
const openVideoBtn = document.getElementById('openVideoBtn');
const videoList = document.getElementById('queueList');  // Lista de vídeos
const modal = document.getElementById('modal');  // O modal de alerta
const closeModalBtn = document.getElementById('closeModal');  // Botão para fechar o modal
const aboutBtn = document.getElementById('aboutBtn'); // Botão "Sobre"
const aboutModal = document.getElementById('aboutModal'); // Modal "Sobre o App"
const closeAboutModalBtn = document.getElementById('closeAboutModal'); // Botão de fechar o modal

// Fila de vídeos
let videoQueue = [];
const MAX_QUEUE_SIZE = 5;  // Limite de vídeos na fila

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
      const videoElement = document.createElement('video');
      videoElement.src = file.path;
      videoElement.preload = 'metadata';

      // Espera o vídeo carregar os metadados (duração)
      videoElement.onloadedmetadata = () => {
        const duration = formatTime(videoElement.duration);
        // Função para formatar o tempo em horas, minutos e segundos
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600); // Converte segundos para horas
  const minutes = Math.floor((seconds % 3600) / 60); // Minutos restantes
  const remainingSeconds = Math.floor(seconds % 60); // Segundos restantes

  // Formatação com horas, se necessário
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}


        // Cria o item de vídeo na lista com o ícone, nome, duração e botão de remover
        const videoItem = document.createElement('li');
        videoItem.classList.add('video-item', 'flex', 'justify-between', 'items-center', 'bg-gray-800', 'p-1', 'rounded-lg', 'mb-2', 'cursor-pointer');
        videoItem.dataset.path = file.path;  // Armazena o caminho do vídeo no dataset

        videoItem.innerHTML = `
        <div class="flex justify-between items-center w-full max-w-2xl rounded mb-1 p-1 bg-gray-500 hover:bg-blue-500 bg-opacity-50 transition-opacity">
          <div class="flex items-center">
            <i class="fas fa-video mr-2"></i> 
            <span>${file.name}</span>
          </div>
          <div class="flex items-center space-x2">
            <span>${duration}</span>
            <button class="remove-btn w-full mx-1 text-white hover:text-red-600" data-path="${file.path}">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>
      `;
      

        // Adiciona evento de clique para abrir o vídeo no segundo monitor
        videoItem.addEventListener('click', (e) => {
          if (!e.target.classList.contains('remove-btn') && !e.target.closest('.remove-btn')) {
            ipcRenderer.send('play-video', file.path); // Se o clique não foi no botão de remover
          }
        });

        // Adiciona evento de remoção ao botão de lixeira
        const removeBtn = videoItem.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
          removeVideoFromQueue(file.path);  // Remove o vídeo da fila e da interface
        });

        // Adiciona o vídeo à fila e exibe na lista
        videoList.appendChild(videoItem);
        videoQueue.push({ name: file.name, path: file.path });
      };
    }
  });
});

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

// Função para formatar o tempo em minutos e segundos
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
