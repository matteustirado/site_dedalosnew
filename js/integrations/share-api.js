/**
 * @file share-api.js
 * @description API de compartilhamento para redes sociais e serviços de mensagens
 * Permite compartilhar conteúdo do Dédalos Bar em várias plataformas
 */

// Event Bus para comunicação com outros módulos
import { EventBus } from '../core/event-bus.js';

/**
 * Configurações para compartilhamento
 */
const SHARE_CONFIG = {
  siteName: 'Dédalos Bar',
  defaultTitle: 'Dédalos Bar - O próximo Level!',
  defaultDescription: 'Bar exclusivo para homens maiores de 18 anos com unidades em São Paulo, Belo Horizonte e Rio de Janeiro.',
  defaultImage: 'https://dedalosbar.com/assets/images/social/og-image.jpg',
  defaultUrl: 'https://dedalosbar.com',
  hashtags: ['dedalosbar', 'barsp', 'barbh', 'barrj', 'proximolevel'],
  twitterHandle: '@dedalosbar'
};

/**
 * Verifica se o navegador suporta a Web Share API nativa
 * @returns {boolean} true se suportar a API nativa
 */
function isWebShareSupported() {
  return navigator.share !== undefined;
}

/**
 * Compartilha conteúdo usando a API nativa do navegador quando disponível
 * @param {Object} shareData Dados para compartilhamento
 * @returns {Promise} Promessa resolvida quando o compartilhamento for concluído
 */
async function shareNative(shareData) {
  if (!isWebShareSupported()) {
    console.warn('Web Share API não suportada neste navegador');
    return Promise.reject(new Error('Web Share API não suportada'));
  }

  try {
    await navigator.share(shareData);
    EventBus.publish('share:success', { method: 'native', data: shareData });
    return Promise.resolve('Conteúdo compartilhado com sucesso');
  } catch (error) {
    // Usuário cancelou ou ocorreu um erro
    if (error.name !== 'AbortError') {
      console.error('Erro ao compartilhar:', error);
      EventBus.publish('share:error', { method: 'native', error: error.message });
    }
    return Promise.reject(error);
  }
}

/**
 * Compartilha no Twitter (método fallback quando Web Share API não é suportada)
 * @param {Object} data Dados para compartilhamento
 * @returns {boolean} true se a janela foi aberta
 */
function shareTwitter(data) {
  const text = encodeURIComponent(data.text || data.title);
  const url = encodeURIComponent(data.url);
  const hashtags = SHARE_CONFIG.hashtags.join(',');
  const via = SHARE_CONFIG.twitterHandle.replace('@', '');
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}&via=${via}`;
  
  const windowFeatures = 'width=550,height=420,resizable=yes,scrollbars=yes';
  const success = window.open(twitterUrl, 'Compartilhar no Twitter', windowFeatures);
  
  if (success) {
    EventBus.publish('share:success', { method: 'twitter', data });
    return true;
  }
  
  // Possível bloqueio de pop-up
  EventBus.publish('share:error', { 
    method: 'twitter', 
    error: 'Não foi possível abrir a janela de compartilhamento. Verifique se os pop-ups estão permitidos.' 
  });
  return false;
}

/**
 * Compartilha no Facebook (método fallback quando Web Share API não é suportada)
 * @param {Object} data Dados para compartilhamento
 * @returns {boolean} true se a janela foi aberta
 */
function shareFacebook(data) {
  const url = encodeURIComponent(data.url);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  
  const windowFeatures = 'width=626,height=436,resizable=yes,scrollbars=yes';
  const success = window.open(facebookUrl, 'Compartilhar no Facebook', windowFeatures);
  
  if (success) {
    EventBus.publish('share:success', { method: 'facebook', data });
    return true;
  }
  
  // Possível bloqueio de pop-up
  EventBus.publish('share:error', { 
    method: 'facebook', 
    error: 'Não foi possível abrir a janela de compartilhamento. Verifique se os pop-ups estão permitidos.' 
  });
  return false;
}

/**
 * Compartilha no WhatsApp (método fallback quando Web Share API não é suportada)
 * @param {Object} data Dados para compartilhamento
 * @returns {boolean} true se a janela foi aberta
 */
function shareWhatsApp(data) {
  const text = encodeURIComponent(`${data.title || SHARE_CONFIG.defaultTitle}\n\n${data.text || ''}\n${data.url}`);
  const whatsappUrl = `https://wa.me/?text=${text}`;
  
  const success = window.open(whatsappUrl, '_blank');
  
  if (success) {
    EventBus.publish('share:success', { method: 'whatsapp', data });
    return true;
  }
  
  // Possível bloqueio
  EventBus.publish('share:error', { 
    method: 'whatsapp', 
    error: 'Não foi possível abrir o WhatsApp. Verifique se você tem o aplicativo instalado.' 
  });
  return false;
}

/**
 * Compartilha no Telegram (método fallback quando Web Share API não é suportada)
 * @param {Object} data Dados para compartilhamento
 * @returns {boolean} true se a janela foi aberta
 */
function shareTelegram(data) {
  const text = encodeURIComponent(`${data.title || SHARE_CONFIG.defaultTitle}\n\n${data.text || ''}\n${data.url}`);
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${text}`;
  
  const success = window.open(telegramUrl, '_blank');
  
  if (success) {
    EventBus.publish('share:success', { method: 'telegram', data });
    return true;
  }
  
  // Possível bloqueio
  EventBus.publish('share:error', { 
    method: 'telegram', 
    error: 'Não foi possível abrir o Telegram.' 
  });
  return false;
}

/**
 * Copia o link para a área de transferência
 * @param {Object} data Dados para compartilhamento
 * @returns {Promise} Promessa resolvida quando o link é copiado
 */
async function copyToClipboard(data) {
  try {
    await navigator.clipboard.writeText(data.url);
    EventBus.publish('share:success', { method: 'clipboard', data });
    return Promise.resolve('Link copiado para a área de transferência');
  } catch (error) {
    console.error('Erro ao copiar para área de transferência:', error);
    EventBus.publish('share:error', { method: 'clipboard', error: error.message });
    return Promise.reject(error);
  }
}

/**
 * Prepara dados para compartilhamento de um evento
 * @param {Object} eventData Dados do evento
 * @returns {Object} Dados formatados para compartilhamento
 */
function prepareEventShareData(eventData) {
  const eventDate = new Date(eventData.date);
  const formattedDate = eventDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  return {
    title: `${eventData.title} - Dédalos Bar`,
    text: `Vem para o evento ${eventData.title} no Dédalos Bar ${eventData.location} dia ${formattedDate}! ${eventData.description}`,
    url: eventData.url || `https://dedalosbar.com/eventos/${eventData.id || 'proximos-eventos'}`,
    image: eventData.image || SHARE_CONFIG.defaultImage
  };
}

/**
 * Compartilha um evento específico
 * @param {string|Object} eventIdOrData ID do evento ou objeto com dados do evento
 * @param {string} [platform] Plataforma específica para compartilhamento
 * @returns {Promise} Promessa resolvida quando o compartilhamento for concluído
 */
async function shareEvent(eventIdOrData, platform) {
  let eventData;
  
  // Se for passado apenas o ID, busca os dados do evento
  if (typeof eventIdOrData === 'string') {
    try {
      // Aqui seria uma integração com alguma API ou dados locais
      // Por enquanto, simulamos com dados mock
      eventData = {
        id: eventIdOrData,
        title: 'Evento no Dédalos Bar',
        description: 'Venha curtir com a gente!',
        date: new Date().toISOString(),
        location: 'São Paulo',
        url: `https://dedalosbar.com/eventos/${eventIdOrData}`,
        image: `https://dedalosbar.com/assets/images/events/${eventIdOrData}.jpg`
      };
    } catch (error) {
      console.error('Erro ao buscar dados do evento:', error);
      return Promise.reject(new Error('Evento não encontrado'));
    }
  } else {
    eventData = eventIdOrData;
  }
  
  const shareData = prepareEventShareData(eventData);
  
  // Se for especificada uma plataforma, usa o método específico
  if (platform) {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return shareTwitter(shareData);
      case 'facebook':
        return shareFacebook(shareData);
      case 'whatsapp':
        return shareWhatsApp(shareData);
      case 'telegram':
        return shareTelegram(shareData);
      case 'clipboard':
        return copyToClipboard(shareData);
      default:
        console.warn(`Plataforma ${platform} não suportada, usando método nativo`);
    }
  }
  
  // Tenta usar a API nativa primeiro
  if (isWebShareSupported()) {
    return shareNative({
      title: shareData.title,
      text: shareData.text,
      url: shareData.url
    });
  }
  
  // Fallback para abrir um modal de compartilhamento personalizado
  EventBus.publish('share:showModal', shareData);
  return Promise.resolve('Modal de compartilhamento aberto');
}

/**
 * Compartilha a página atual ou uma URL específica
 * @param {Object} [options] Opções de compartilhamento
 * @param {string} [platform] Plataforma específica para compartilhamento
 * @returns {Promise} Promessa resolvida quando o compartilhamento for concluído
 */
async function sharePage(options = {}, platform) {
  const shareData = {
    title: options.title || document.title || SHARE_CONFIG.defaultTitle,
    text: options.text || document.querySelector('meta[name="description"]')?.content || SHARE_CONFIG.defaultDescription,
    url: options.url || window.location.href,
    image: options.image || document.querySelector('meta[property="og:image"]')?.content || SHARE_CONFIG.defaultImage
  };
  
  // Se for especificada uma plataforma, usa o método específico
  if (platform) {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return shareTwitter(shareData);
      case 'facebook':
        return shareFacebook(shareData);
      case 'whatsapp':
        return shareWhatsApp(shareData);
      case 'telegram':
        return shareTelegram(shareData);
      case 'clipboard':
        return copyToClipboard(shareData);
      default:
        console.warn(`Plataforma ${platform} não suportada, usando método nativo`);
    }
  }
  
  // Tenta usar a API nativa primeiro
  if (isWebShareSupported()) {
    return shareNative({
      title: shareData.title,
      text: shareData.text,
      url: shareData.url
    });
  }
  
  // Fallback para abrir um modal de compartilhamento personalizado
  EventBus.publish('share:showModal', shareData);
  return Promise.resolve('Modal de compartilhamento aberto');
}

/**
 * Inicializa os handlers para botões de compartilhamento na página
 */
function initShareButtons() {
  document.addEventListener('click', (event) => {
    // Botões de compartilhamento genéricos
    if (event.target.matches('[data-share]') || event.target.closest('[data-share]')) {
      const button = event.target.matches('[data-share]') ? event.target : event.target.closest('[data-share]');
      
      const platform = button.dataset.sharePlatform;
      const options = {
        url: button.dataset.shareUrl,
        title: button.dataset.shareTitle,
        text: button.dataset.shareText,
        image: button.dataset.shareImage
      };
      
      event.preventDefault();
      sharePage(options, platform);
    }
    
    // Botões de compartilhamento de eventos
    if (event.target.matches('[data-share-event]') || event.target.closest('[data-share-event]')) {
        const button = event.target.matches('[data-share-event]') ? event.target : event.target.closest('[data-share-event]');
        
        const eventId = button.dataset.shareEvent;
        const platform = button.dataset.sharePlatform;
        
        // Se o botão tem dados completos do evento, usamos eles diretamente
        if (button.dataset.eventData) {
          try {
            const eventData = JSON.parse(button.dataset.eventData);
            event.preventDefault();
            shareEvent(eventData, platform);
            return;
          } catch (error) {
            console.error('Erro ao parsear dados do evento:', error);
          }
        }
        
        // Caso contrário, buscamos pelo ID
        event.preventDefault();
        shareEvent(eventId, platform);
      }
    });
    
    // Inicializa modal de compartilhamento customizado
    const createShareModal = () => {
      // Verifica se o modal já existe
      if (document.getElementById('shareModal')) {
        return;
      }
      
      const modal = document.createElement('div');
      modal.id = 'shareModal';
      modal.className = 'share-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-labelledby', 'shareModalTitle');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('hidden', '');
      
      modal.innerHTML = `
        <div class="share-modal-content">
          <div class="share-modal-header">
            <h3 id="shareModalTitle">Compartilhar</h3>
            <button class="share-modal-close" aria-label="Fechar">&times;</button>
          </div>
          <div class="share-modal-body">
            <div class="share-platforms">
              <button class="share-btn share-twitter" data-platform="twitter">
                <i class="fab fa-twitter"></i>
                <span>Twitter</span>
              </button>
              <button class="share-btn share-facebook" data-platform="facebook">
                <i class="fab fa-facebook-f"></i>
                <span>Facebook</span>
              </button>
              <button class="share-btn share-whatsapp" data-platform="whatsapp">
                <i class="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
              </button>
              <button class="share-btn share-telegram" data-platform="telegram">
                <i class="fab fa-telegram-plane"></i>
                <span>Telegram</span>
              </button>
              <button class="share-btn share-clipboard" data-platform="clipboard">
                <i class="fas fa-link"></i>
                <span>Copiar Link</span>
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Adiciona event listeners
      const closeButton = modal.querySelector('.share-modal-close');
      closeButton.addEventListener('click', () => {
        modal.setAttribute('hidden', '');
        modal.classList.remove('active');
      });
      
      const platforms = modal.querySelectorAll('.share-btn');
      platforms.forEach(button => {
        button.addEventListener('click', () => {
          const platform = button.dataset.platform;
          const currentShareData = modal.shareData || {};
          
          if (currentShareData.eventId) {
            shareEvent(currentShareData.eventId, platform);
          } else {
            sharePage(currentShareData, platform);
          }
          
          modal.setAttribute('hidden', '');
          modal.classList.remove('active');
        });
      });
      
      // Fechar ao clicar fora
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          modal.setAttribute('hidden', '');
          modal.classList.remove('active');
        }
      });
      
      return modal;
    };
    
    // Registra listener para abrir o modal de compartilhamento
    EventBus.subscribe('share:showModal', (shareData) => {
      const modal = document.getElementById('shareModal') || createShareModal();
      
      // Armazena os dados para compartilhamento
      modal.shareData = shareData;
      
      // Exibe o modal
      modal.removeAttribute('hidden');
      modal.classList.add('active');
      
      // Atualiza o título do modal conforme o conteúdo
      const title = modal.querySelector('#shareModalTitle');
      if (shareData.eventId || shareData.title?.includes('evento')) {
        title.textContent = 'Compartilhar Evento';
      } else {
        title.textContent = 'Compartilhar';
      }
    });
  }
  
  /**
   * Configuração de notificações para sucesso/erro de compartilhamento
   */
  function setupShareNotifications() {
    EventBus.subscribe('share:success', (data) => {
      const method = data.method;
      let message = 'Compartilhado com sucesso!';
      
      if (method === 'clipboard') {
        message = 'Link copiado para a área de transferência!';
      }
      
      // Mostra notificação de sucesso
      if (window.Notifications) {
        window.Notifications.showSuccess(message);
      } else {
        console.log(message);
      }
    });
    
    EventBus.subscribe('share:error', (data) => {
      const error = data.error || 'Não foi possível compartilhar o conteúdo.';
      
      // Mostra notificação de erro
      if (window.Notifications) {
        window.Notifications.showError(error);
      } else {
        console.error(error);
      }
    });
  }
  
  /**
   * Inicializa o módulo de compartilhamento
   */
  function initShare() {
    initShareButtons();
    setupShareNotifications();
    
    // Adiciona atributos data-share nos cards de eventos dinamicamente
    document.querySelectorAll('.event-card:not([data-share])').forEach(card => {
      const eventId = card.dataset.eventId;
      if (eventId) {
        const shareButton = card.querySelector('.btn-event-share, .share-icon');
        if (shareButton) {
          shareButton.setAttribute('data-share-event', eventId);
        }
      }
    });
  }
  
  // Exporta funções públicas para uso em outros módulos
  export {
    shareEvent,
    sharePage,
    initShare,
    copyToClipboard,
    isWebShareSupported,
    SHARE_CONFIG
  };
  
  // Inicialização automática quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShare);
  } else {
    initShare();
  }
  