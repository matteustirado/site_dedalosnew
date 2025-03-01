/**
 * @file notifications.js
 * @description Sistema de notificações e alertas para o Dédalos Bar
 * Implementa diferentes tipos de mensagens: sucesso, erro, aviso e informação
 */

// Importando o barramento de eventos para comunicação com outros módulos
import { EventBus } from '../core/event-bus.js';

// Sistema de notificações
const Notifications = (function() {
    // Configurações padrão
    const config = {
        position: 'top-right',      // Posição padrão das notificações
        duration: 5000,             // Duração padrão em ms (5 segundos)
        maxVisible: 3,              // Máximo de notificações visíveis simultaneamente
        animation: {
            in: 'fadeInRight',      // Animação de entrada
            out: 'fadeOutRight'     // Animação de saída
        },
        closeOnClick: true,         // Fechar ao clicar
        showCloseButton: true,      // Mostrar botão de fechar
        container: null,            // Container será criado dinamicamente
        zIndex: 1050               // z-index para sobreposição
    };
    
    // Tipos de notificações disponíveis
    const TYPES = {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    };
    
    // Armazenamento e controle das notificações ativas
    let activeNotifications = [];
    let container = null;
    
    /**
     * Inicializa o sistema de notificações
     * @param {Object} options - Opções de configuração
     */
    function init(options = {}) {
        // Mescla as opções fornecidas com as configurações padrão
        Object.assign(config, options);
        
        // Cria o container de notificações se ainda não existir
        if (!container) {
            createContainer();
        }
        
        // Registra listeners para eventos globais de notificação
        EventBus.subscribe('notification:show', show);
        EventBus.subscribe('notification:clear', clearAll);
        
        // Log para debug
        console.log('Sistema de notificações inicializado');
    }
    
    /**
     * Cria o container principal para as notificações
     */
    function createContainer() {
        container = document.createElement('div');
        container.className = 'notification-container ' + config.position;
        container.setAttribute('role', 'alert');
        container.setAttribute('aria-live', 'polite');
        container.style.zIndex = config.zIndex;
        document.body.appendChild(container);
    }
    
    /**
     * Cria e exibe uma nova notificação
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de notificação (success, error, warning, info)
     * @param {Object} options - Opções específicas para esta notificação
     * @returns {Object} - Objeto de controle da notificação
     */
    function show(message, type = TYPES.INFO, options = {}) {
        // Mescla as opções desta notificação com configurações padrão
        const notificationOptions = Object.assign({}, config, options);
        
        // Cria o elemento HTML da notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'status');
        
        // Adiciona ícone conforme o tipo
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        
        // Define o ícone baseado no tipo
        switch (type) {
            case TYPES.SUCCESS:
                icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                break;
            case TYPES.ERROR:
                icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
                break;
            case TYPES.WARNING:
                icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            case TYPES.INFO:
            default:
                icon.innerHTML = '<i class="fas fa-info-circle"></i>';
                break;
        }
        
        notification.appendChild(icon);
        
        // Adiciona o conteúdo principal da mensagem
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.innerHTML = message;
        notification.appendChild(content);
        
        // Adiciona botão de fechar se necessário
        if (notificationOptions.showCloseButton) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.setAttribute('aria-label', 'Fechar notificação');
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                close(notification);
            };
            notification.appendChild(closeBtn);
        }
        
        // Adiciona evento de clique para fechar se configurado
        if (notificationOptions.closeOnClick) {
            notification.onclick = function() {
                close(notification);
            };
        }
        
        // Adiciona a notificação ao DOM
        container.appendChild(notification);
        
        // Aplica a animação de entrada
        notification.classList.add(notificationOptions.animation.in);
        
        // Adiciona à lista de notificações ativas
        const notificationId = Date.now().toString();
        activeNotifications.push({
            id: notificationId,
            element: notification,
            timeout: null
        });
        
        // Gerencia o limite de notificações visíveis
        manageVisibleCount();
        
        // Define o timeout para remover após a duração especificada
        const timeoutId = setTimeout(() => {
            close(notification);
        }, notificationOptions.duration);
        
        // Armazena o ID do timeout para possível cancelamento
        activeNotifications.find(n => n.element === notification).timeout = timeoutId;
        
        // Retorna um objeto de controle
        return {
            id: notificationId,
            close: () => close(notification),
            element: notification
        };
    }
    
    /**
     * Fecha uma notificação específica
     * @param {HTMLElement} notification - Elemento da notificação a ser fechada
     */
    function close(notification) {
        // Se a notificação já foi removida, retorna
        if (!notification || !notification.parentNode) {
            return;
        }
        
        // Encontra a notificação no array de ativos
        const notificationObj = activeNotifications.find(n => n.element === notification);
        
        if (notificationObj) {
            // Cancela o timeout se existir
            clearTimeout(notificationObj.timeout);
            
            // Aplica a animação de saída
            notification.classList.remove(config.animation.in);
            notification.classList.add(config.animation.out);
            
            // Remove do DOM após a animação
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                
                // Remove do array de ativos
                const index = activeNotifications.findIndex(n => n.element === notification);
                if (index !== -1) {
                    activeNotifications.splice(index, 1);
                }
                
                // Verifica se há notificações na fila para exibir
                manageVisibleCount();
            }, 300); // Tempo aproximado da animação
        }
    }
    
    /**
     * Gerencia a quantidade de notificações visíveis
     * e aplica regras de fila quando excede o máximo
     */
    function manageVisibleCount() {
        if (activeNotifications.length > config.maxVisible) {
            // Remove as notificações mais antigas além do limite
            const toRemove = activeNotifications.slice(0, activeNotifications.length - config.maxVisible);
            toRemove.forEach(notification => {
                close(notification.element);
            });
        }
    }
    
    /**
     * Remove todas as notificações ativas
     */
    function clearAll() {
        // Cria uma cópia do array para evitar problemas ao modificar durante a iteração
        const notifications = [...activeNotifications];
        notifications.forEach(notification => {
            close(notification.element);
        });
    }
    
    /**
     * Cria e exibe uma notificação de sucesso
     * @param {string} message - Mensagem de sucesso
     * @param {Object} options - Opções específicas
     * @returns {Object} - Objeto de controle da notificação
     */
    function success(message, options = {}) {
        return show(message, TYPES.SUCCESS, options);
    }
    
    /**
     * Cria e exibe uma notificação de erro
     * @param {string} message - Mensagem de erro
     * @param {Object} options - Opções específicas
     * @returns {Object} - Objeto de controle da notificação
     */
    function error(message, options = {}) {
        return show(message, TYPES.ERROR, options);
    }
    
    /**
     * Cria e exibe uma notificação de aviso
     * @param {string} message - Mensagem de aviso
     * @param {Object} options - Opções específicas
     * @returns {Object} - Objeto de controle da notificação
     */
    function warning(message, options = {}) {
        return show(message, TYPES.WARNING, options);
    }
    
    /**
     * Cria e exibe uma notificação informativa
     * @param {string} message - Mensagem informativa
     * @param {Object} options - Opções específicas
     * @returns {Object} - Objeto de controle da notificação
     */
    function info(message, options = {}) {
        return show(message, TYPES.INFO, options);
    }
    
    /**
     * Cria uma notificação modal que bloqueia a interação
     * @param {string} message - Mensagem para o modal
     * @param {Object} options - Opções do modal
     * @returns {Object} - Objeto de controle do modal
     */
    function modal(message, options = {}) {
        // Opções padrão para modais
        const modalOptions = Object.assign({
            title: 'Aviso',
            confirmButton: 'OK',
            cancelButton: null,
            closeOnOverlayClick: true,
            size: 'medium', // small, medium, large
            customClass: '',
            onConfirm: () => {},
            onCancel: () => {},
            type: TYPES.INFO
        }, options);
        
        // Cria o overlay
        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        
        // Cria o modal
        const modalElement = document.createElement('div');
        modalElement.className = `notification-modal ${modalOptions.customClass} notification-modal-${modalOptions.size}`;
        
        // Adiciona o header com título
        const header = document.createElement('div');
        header.className = `notification-modal-header notification-${modalOptions.type}`;
        
        const title = document.createElement('h3');
        title.className = 'notification-modal-title';
        title.textContent = modalOptions.title;
        header.appendChild(title);
        
        // Adiciona botão de fechar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-modal-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.setAttribute('aria-label', 'Fechar modal');
        header.appendChild(closeBtn);
        
        modalElement.appendChild(header);
        
        // Adiciona o corpo do modal
        const body = document.createElement('div');
        body.className = 'notification-modal-body';
        body.innerHTML = message;
        modalElement.appendChild(body);
        
        // Adiciona o footer com os botões
        const footer = document.createElement('div');
        footer.className = 'notification-modal-footer';
        
        // Botão de confirmar
        if (modalOptions.confirmButton) {
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn btn-primary notification-modal-confirm';
            confirmBtn.textContent = modalOptions.confirmButton;
            footer.appendChild(confirmBtn);
            
            confirmBtn.onclick = function() {
                modalOptions.onConfirm();
                closeModal();
            };
        }
        
        // Botão de cancelar
        if (modalOptions.cancelButton) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-secondary notification-modal-cancel';
            cancelBtn.textContent = modalOptions.cancelButton;
            footer.appendChild(cancelBtn);
            
            cancelBtn.onclick = function() {
                modalOptions.onCancel();
                closeModal();
            };
        }
        
        modalElement.appendChild(footer);
        overlay.appendChild(modalElement);
        document.body.appendChild(overlay);
        
        // Centraliza o modal
        modalElement.style.marginTop = `-${modalElement.offsetHeight / 2}px`;
        modalElement.style.marginLeft = `-${modalElement.offsetWidth / 2}px`;
        
        // Fecha o modal
        function closeModal() {
            document.body.removeChild(overlay);
        }
        
        // Define eventos
        closeBtn.onclick = closeModal;
        
        if (modalOptions.closeOnOverlayClick) {
            overlay.onclick = function(e) {
                if (e.target === overlay) {
                    closeModal();
                }
            };
        }
        
        // Retorna controle do modal
        return {
            close: closeModal,
            element: modalElement
        };
    }
    
    // API pública do módulo
    return {
        init,
        show,
        success,
        error,
        warning,
        info,
        modal,
        clearAll,
        TYPES
    };
})();

// Exporta o módulo
export default Notifications;
