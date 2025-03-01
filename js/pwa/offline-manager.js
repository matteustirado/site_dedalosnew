/**
 * Dédalos Bar - Gerenciador de Recursos Offline
 * 
 * Este módulo gerencia os recursos offline da aplicação, detecta o status da conexão
 * e fornece métodos para acessar conteúdo quando o usuário estiver sem internet.
 * Integra-se com o Service Worker para gerenciar o cache e fornecer feedback visual.
 */

// Importa o barramento de eventos para comunicação com outros módulos
import { EventBus } from '../core/event-bus.js';

class OfflineManager {
    constructor() {
        // Status atual da conexão
        this.isOnline = navigator.onLine;
        
        // Lista de recursos críticos que devem sempre estar disponíveis offline
        this.criticalResources = [
            // Imagens essenciais
            '/assets/images/logo/logo.png',
            '/assets/images/logo/logo-main.png',
            '/assets/images/logo/favicon.png',
            
            // CSS essenciais
            '/css/core/reset.css',
            '/css/core/variables.css',
            '/css/core/typography.css',
            '/css/core/base.css',
            '/css/core/animations.css',
            
            // JavaScript essencial
            '/js/core/init.js',
            '/js/components/age-verification.js',
            '/js/effects/multichrome.js',
            
            // Páginas principais
            '/',
            '/index.html',
            '/offline.html',  // Página especial para quando estiver offline
            
            // Fontes
            '/assets/fonts/poppins-v20-latin-regular.woff2',
            '/assets/fonts/poppins-v20-latin-500.woff2',
            '/assets/fonts/poppins-v20-latin-600.woff2',
            '/assets/fonts/poppins-v20-latin-700.woff2'
        ];
        
        // Recursos dinâmicos que podem ser atualizados quando online
        this.dynamicResources = {
            events: {
                url: '/api/events',
                expiration: 24 * 60 * 60 * 1000, // 24 horas em milissegundos
                fallback: '/assets/data/default-events.json' // Dados padrão caso não tenha cache
            },
            prices: {
                url: '/api/prices',
                expiration: 12 * 60 * 60 * 1000, // 12 horas
                fallback: '/assets/data/default-prices.json'
            },
            checkIns: {
                url: '/api/check-ins',
                expiration: 15 * 60 * 1000, // 15 minutos
                fallback: { count: 42 } // Valor padrão 
            }
        };
        
        // Estado de notificação
        this.hasNotifiedOffline = false;
        
        // Inicializar listeners
        this.setupEventListeners();
    }

    /**
     * Configura os event listeners para detecção de status online/offline
     */
    setupEventListeners() {
        // Monitorar alterações de status da conexão
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
        
        // Registrar para mensagens do service worker
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    this.handleCacheUpdate(event.data.resource);
                }
            });
        }
        
        // Verificar status da conexão no carregamento da página
        document.addEventListener('DOMContentLoaded', () => {
            this.checkConnectionQuality();
        });
    }

    /**
     * Manipula mudanças no status de conexão
     * @param {boolean} isOnline - Se o dispositivo está online
     */
    handleOnlineStatusChange(isOnline) {
        const wasOffline = !this.isOnline && isOnline;
        this.isOnline = isOnline;
        
        // Publicar evento para que outros componentes possam reagir
        EventBus.publish('connection:status', { isOnline });
        
        if (!isOnline && !this.hasNotifiedOffline) {
            // Mostrar notificação de modo offline
            this.showOfflineNotification();
            this.hasNotifiedOffline = true;
        } else if (wasOffline) {
            // Se estava offline e voltou, mostrar notificação e sincronizar dados
            this.showOnlineNotification();
            this.syncDataWhenBackOnline();
            this.hasNotifiedOffline = false;
        }
        
        // Atualiza classes no <body> para aplicar estilos específicos em modo offline
        document.body.classList.toggle('is-offline', !isOnline);
    }

    /**
     * Exibe notificação de modo offline
     */
    showOfflineNotification() {
        // Verifica se o módulo de notificações está disponível
        if (typeof window.Notifications !== 'undefined') {
            window.Notifications.show({
                message: 'Você está offline. Algumas funcionalidades podem estar limitadas.',
                type: 'warning',
                duration: 5000,
                position: 'top-center'
            });
        } else {
            // Fallback caso o módulo de notificações não esteja carregado
            const offlineBar = document.createElement('div');
            offlineBar.className = 'offline-notification';
            offlineBar.innerHTML = `
                <span>Você está offline. Recursos limitados disponíveis.</span>
                <button class="close-notification">×</button>
            `;
            
            document.body.appendChild(offlineBar);
            
            // Remover ao clicar no botão de fechar
            offlineBar.querySelector('.close-notification').addEventListener('click', () => {
                offlineBar.remove();
            });
            
            // Auto-remover após 8 segundos
            setTimeout(() => {
                if (document.body.contains(offlineBar)) {
                    offlineBar.classList.add('fade-out');
                    setTimeout(() => offlineBar.remove(), 500);
                }
            }, 8000);
        }
    }

    /**
     * Exibe notificação de volta ao modo online
     */
    showOnlineNotification() {
        if (typeof window.Notifications !== 'undefined') {
            window.Notifications.show({
                message: 'Você está online novamente! Atualizando dados...',
                type: 'success',
                duration: 3000,
                position: 'top-center'
            });
        }
    }

    /**
     * Sincroniza dados quando a conexão é restabelecida
     */
    async syncDataWhenBackOnline() {
        if (!this.isOnline) return;
        
        try {
            // Avisa o service worker para atualizar o cache
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SYNC_CACHE',
                    resources: Object.keys(this.dynamicResources).map(key => this.dynamicResources[key].url)
                });
            }
            
            // Publicar evento para que componentes saibam que dados foram atualizados
            EventBus.publish('data:updated', { timestamp: Date.now() });
            
            console.log('✅ Sincronização de dados concluída');
        } catch (error) {
            console.error('❌ Erro ao sincronizar dados:', error);
        }
    }

    /**
     * Verifica a qualidade da conexão atual
     * @returns {Promise<Object>} Informações sobre a qualidade da conexão
     */
    async checkConnectionQuality() {
        if (!this.isOnline) {
            return { quality: 'offline', latency: Infinity };
        }
        
        try {
            const startTime = Date.now();
            const response = await fetch('/api/ping', { 
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' },
                cache: 'no-store'
            });
            const latency = Date.now() - startTime;
            
            let quality = 'good';
            if (latency > 300) quality = 'poor';
            else if (latency > 100) quality = 'medium';
            
            // Atualizar status de conexão no EventBus
            EventBus.publish('connection:quality', { quality, latency });
            
            return { quality, latency };
        } catch (error) {
            // Se houve erro na requisição, considerar conexão ruim ou offline
            console.warn('Erro ao verificar qualidade da conexão:', error);
            return { quality: 'poor', latency: 999 };
        }
    }

    /**
     * Pré-carrega recursos importantes quando estiver online
     */
    preloadCriticalResources() {
        if (!this.isOnline) return;
        
        try {
            // Avisar o service worker para pré-carregar recursos críticos
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'PRELOAD_RESOURCES',
                    resources: this.criticalResources
                });
            }
        } catch (error) {
            console.error('Erro ao pré-carregar recursos:', error);
        }
    }

    /**
     * Obtem dados dinâmicos, usando cache se necessário
     * @param {string} resourceKey - Chave do recurso (ex: 'events', 'prices')
     * @returns {Promise<Object>} Dados do recurso
     */
    async getDynamicData(resourceKey) {
        if (!this.dynamicResources[resourceKey]) {
            throw new Error(`Recurso '${resourceKey}' não está definido`);
        }
        
        const resource = this.dynamicResources[resourceKey];
        
        // Se estiver online, tenta buscar dados atualizados
        if (this.isOnline) {
            try {
                const response = await fetch(resource.url);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Salvar em localStorage com timestamp para gerenciar expiração
                    localStorage.setItem(`offline_${resourceKey}_data`, JSON.stringify(data));
                    localStorage.setItem(`offline_${resourceKey}_timestamp`, Date.now().toString());
                    
                    return data;
                }
            } catch (error) {
                console.warn(`Falha ao buscar ${resourceKey} online:`, error);
                // Se falhar, continuar e tentar usar dados em cache
            }
        }
        
        // Verificar dados em localStorage
        const cachedDataStr = localStorage.getItem(`offline_${resourceKey}_data`);
        const cachedTimestamp = localStorage.getItem(`offline_${resourceKey}_timestamp`);
        
        if (cachedDataStr && cachedTimestamp) {
            // Verificar se os dados não expiraram
            const timestamp = parseInt(cachedTimestamp, 10);
            const isExpired = Date.now() - timestamp > resource.expiration;
            
            if (!isExpired) {
                try {
                    return JSON.parse(cachedDataStr);
                } catch (e) {
                    console.error(`Erro ao analisar dados em cache para ${resourceKey}:`, e);
                }
            }
        }
        
        // Se chegou aqui, usar dados de fallback
        if (typeof resource.fallback === 'string' && resource.fallback.startsWith('/')) {
            try {
                // Se o fallback for um caminho de arquivo, buscar esse arquivo
                const response = await fetch(resource.fallback);
                return await response.json();
            } catch (e) {
                console.error(`Erro ao buscar fallback para ${resourceKey}:`, e);
                return {};
            }
        }
        
        // Retornar objeto fallback diretamente
        return resource.fallback || {};
    }

    /**
     * Manipula atualizações de cache vindas do service worker
     * @param {string} resource - Recurso que foi atualizado no cache
     */
    handleCacheUpdate(resource) {
        console.log(`Recurso atualizado no cache: ${resource}`);
        // Publicar evento para componentes interessados neste recurso específico
        EventBus.publish('cache:updated', { resource });
    }

    /**
     * Limpa dados antigos do cache
     */
    cleanupCache() {
        // Iterar sobre todos os recursos dinâmicos
        Object.keys(this.dynamicResources).forEach(key => {
            const resource = this.dynamicResources[key];
            const timestampKey = `offline_${key}_timestamp`;
            const dataKey = `offline_${key}_data`;
            
            // Verificar se há timestamp salvo
            const cachedTimestamp = localStorage.getItem(timestampKey);
            if (cachedTimestamp) {
                const timestamp = parseInt(cachedTimestamp, 10);
                const isExpired = Date.now() - timestamp > resource.expiration;
                
                // Se expirado, remover do localStorage
                if (isExpired) {
                    localStorage.removeItem(timestampKey);
                    localStorage.removeItem(dataKey);
                    console.log(`Cache expirado removido: ${key}`);
                }
            }
        });
    }
}

// Criar instância e exportar como singleton
const offlineManager = new OfflineManager();

// Executar limpeza de cache na inicialização
offlineManager.cleanupCache();

// Exportar a instância para uso em outros módulos
export default offlineManager;
