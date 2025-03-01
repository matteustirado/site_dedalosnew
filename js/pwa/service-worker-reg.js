/**
 * Service Worker Registration
 * Gerencia o registro e o ciclo de vida do service worker do Dédalos Bar
 * Parte do sistema PWA para suporte offline e instalação como aplicativo
 */

(function() {
    'use strict';

    // Importações e dependências (EventBus para comunicação entre módulos)
    const EventBus = window.EventBus || {
        publish: (topic, data) => console.warn(`EventBus não disponível ao publicar: ${topic}`),
        subscribe: () => console.warn('EventBus não disponível para inscrição')
    };

    // Configurações
    const SW_PATH = '/service-worker.js';
    const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60; // 1 hora
    
    // Estado do service worker
    let serviceWorkerRegistration = null;
    let periodicUpdateCheck = null;

    /**
     * Verifica se o navegador suporta Service Workers
     * @returns {boolean} Se há suporte
     */
    function isServiceWorkerSupported() {
        return 'serviceWorker' in navigator;
    }

    /**
     * Registra o service worker
     * @returns {Promise} Promessa que resolve com o registro ou rejeita com erro
     */
    function registerServiceWorker() {
        if (!isServiceWorkerSupported()) {
            const error = new Error('Service Workers não são suportados neste navegador');
            EventBus.publish('sw:not-supported', { error });
            return Promise.reject(error);
        }

        return navigator.serviceWorker.register(SW_PATH)
            .then(registration => {
                serviceWorkerRegistration = registration;
                EventBus.publish('sw:registered', { registration });
                
                // Configura checagem periódica de atualizações
                setupPeriodicUpdateCheck();
                
                // Configura handlers para eventos do service worker
                setupServiceWorkerEvents(registration);
                
                return registration;
            })
            .catch(error => {
                EventBus.publish('sw:registration-failed', { error });
                console.error('Falha ao registrar o Service Worker:', error);
                throw error;
            });
    }

    /**
     * Configura a verificação periódica de atualizações do service worker
     */
    function setupPeriodicUpdateCheck() {
        // Limpa qualquer verificação anterior
        if (periodicUpdateCheck) {
            clearInterval(periodicUpdateCheck);
        }

        // Configura nova verificação periódica
        periodicUpdateCheck = setInterval(() => {
            if (serviceWorkerRegistration) {
                serviceWorkerRegistration.update()
                    .then(() => EventBus.publish('sw:update-checked', {}))
                    .catch(error => EventBus.publish('sw:update-check-failed', { error }));
            }
        }, UPDATE_CHECK_INTERVAL);
    }

    /**
     * Configura os manipuladores de eventos para o ciclo de vida do service worker
     * @param {ServiceWorkerRegistration} registration - A instância de registro do SW
     */
    function setupServiceWorkerEvents(registration) {
        // Verificar se há uma nova versão do service worker em espera
        if (registration.waiting) {
            EventBus.publish('sw:update-waiting', { registration });
        }

        // Detecção de nova instalação
        registration.addEventListener('updatefound', () => {
            // Temos um service worker em instalação
            const newWorker = registration.installing;
            
            EventBus.publish('sw:update-found', { worker: newWorker });
            
            // Monitor de estados do novo worker
            newWorker.addEventListener('statechange', () => {
                EventBus.publish('sw:state-changed', { 
                    worker: newWorker, 
                    state: newWorker.state 
                });
                
                // Se o novo worker está em espera, significa que está pronto para tomar o controle
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    EventBus.publish('sw:update-ready', { worker: newWorker });
                }
            });
        });

        // Detecção de falha de controlador (acontece após reload)
        if (!navigator.serviceWorker.controller) {
            EventBus.publish('sw:no-controller', {});
        }

        // Detecção de mudança de controlador (quando um novo SW assume o controle)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            EventBus.publish('sw:controller-changed', {});
        });

        // Configuração de comunicação com o service worker
        navigator.serviceWorker.addEventListener('message', event => {
            EventBus.publish('sw:message', { data: event.data });
        });
    }

    /**
     * Solicita ao SW em espera que assuma o controle imediatamente
     */
    function skipWaiting() {
        if (serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
            // Envia mensagem para o SW em espera para que assuma o controle
            serviceWorkerRegistration.waiting.postMessage({ action: 'skipWaiting' });
        }
    }

    /**
     * Envia mensagem para o service worker ativo
     * @param {Object} message - A mensagem a ser enviada
     */
    function sendMessageToSW(message) {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message);
            return true;
        }
        return false;
    }

    /**
     * Verifica se o usuário está utilizando o site no modo offline
     * @returns {boolean} Se o usuário está offline
     */
    function isOffline() {
        return !navigator.onLine;
    }

    /**
     * Inicializa o módulo de registro de service worker
     */
    function init() {
        // Registra o service worker
        registerServiceWorker();

        // Monitora alterações no estado online/offline
        window.addEventListener('online', () => {
            EventBus.publish('network:online', {});
        });

        window.addEventListener('offline', () => {
            EventBus.publish('network:offline', {});
        });

        // Publica estado inicial da rede
        const initialNetworkState = isOffline() ? 'offline' : 'online';
        EventBus.publish(`network:${initialNetworkState}`, {});
    }

    // API pública
    window.ServiceWorkerManager = {
        init,
        register: registerServiceWorker,
        skipWaiting,
        sendMessage: sendMessageToSW,
        isSupported: isServiceWorkerSupported,
        isOffline
    };

    // Auto-inicialização quando o documento estiver totalmente carregado
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
