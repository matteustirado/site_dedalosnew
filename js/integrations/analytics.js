/**
 * @file analytics.js
 * @description Integração com ferramentas de analytics para o site Dédalos Bar
 * @requires js/core/config.js
 * @requires js/utils/dom.js
 * @requires js/utils/storage.js
 * @requires js/core/event-bus.js
 */

const DedaloAnalytics = (function() {
    'use strict';

    // Configurações padrão de analytics
    const DEFAULT_CONFIG = {
        enabled: true,
        trackPageViews: true,
        trackClicks: true,
        trackFormSubmissions: true,
        trackErrors: true,
        trackUserPreferences: false, // Desativado por padrão para privacidade
        gaId: 'UA-XXXXXXXX-X', // Substituir pelo ID do Google Analytics real
        gtmId: 'GTM-XXXXXXX',  // Substituir pelo ID do Google Tag Manager real
        anonymizeIp: true,
        respectDoNotTrack: true
    };

    // Cache de configurações atual
    let config = {};
    
    // Cache do estado do usuário
    let userState = {
        consentGiven: false,
        sessionStartTime: 0,
        lastActivityTime: 0,
        pageViewCount: 0,
        uniqueEventCount: 0,
        location: null
    };

    /**
     * Inicializa o sistema de analytics
     * @param {Object} customConfig - Configurações personalizadas para substituir os padrões
     */
    function init(customConfig = {}) {
        // Mesclar configurações padrão com as personalizadas
        config = {...DEFAULT_CONFIG, ...customConfig};
        
        // Verificar configurações do navegador (Do Not Track)
        if (config.respectDoNotTrack && doNotTrackEnabled()) {
            config.enabled = false;
            console.log('Analytics desativado devido à preferência Do Not Track do usuário');
            return;
        }

        // Verificar se o usuário já deu consentimento para analytics (LGPD/GDPR)
        const storedConsent = DedaloStorage?.getItem('analytics_consent');
        userState.consentGiven = storedConsent === 'true';

        // Iniciar a sessão de analytics
        userState.sessionStartTime = Date.now();
        userState.lastActivityTime = Date.now();
        
        // Registrar no barramento de eventos para eventos específicos da aplicação
        if (typeof DedaloEventBus !== 'undefined') {
            registerEventBusListeners();
        }

        // Carregar integrações de analytics específicas
        if (config.enabled && userState.consentGiven) {
            loadGoogleAnalytics();
            setupEventListeners();
            trackPageView(window.location.pathname + window.location.search);
        }

        console.log('DedaloAnalytics inicializado com sucesso.');
    }

    /**
     * Carrega o script do Google Analytics
     */
    function loadGoogleAnalytics() {
        if (!config.gaId) return;
        
        // Criar o script do Google Analytics
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
        
        // Inicializar o GA com as configurações adequadas
        ga('create', config.gaId, 'auto');
        
        // Configurar anonimização de IP se necessário
        if (config.anonymizeIp) {
            ga('set', 'anonymizeIp', true);
        }
        
        console.log('Google Analytics carregado com sucesso');
    }

    /**
     * Configura ouvintes de eventos para ações importantes
     */
    function setupEventListeners() {
        if (!config.enabled || !userState.consentGiven) return;

        // Rastrear cliques em elementos com atributos data-track
        if (config.trackClicks) {
            document.addEventListener('click', function(event) {
                // Encontrar o elemento clicável mais próximo com atributo data-track
                let element = event.target;
                let maxDepth = 5; // Evitar busca muito profunda no DOM
                let depth = 0;

                while (element && depth < maxDepth) {
                    // Verificar se o elemento possui atributos de rastreamento
                    if (element.hasAttribute('data-track')) {
                        const category = element.getAttribute('data-track-category') || 'UI Interaction';
                        const action = element.getAttribute('data-track-action') || 'Click';
                        const label = element.getAttribute('data-track-label') || element.innerText?.trim() || element.id || 'unnamed element';

                        trackEvent(category, action, label);
                        break;
                    }

                    // Subir na árvore do DOM
                    element = element.parentElement;
                    depth++;
                }
            });
        }

        // Rastrear envios de formulário
        if (config.trackFormSubmissions) {
            document.addEventListener('submit', function(event) {
                if (event.target.tagName === 'FORM') {
                    const formId = event.target.id || event.target.getAttribute('name') || 'unnamed form';
                    const formAction = event.target.getAttribute('action') || 'unknown action';
                    
                    trackEvent('Form Interaction', 'Submit', formId);
                }
            });
        }

        // Rastrear erros de JavaScript
        if (config.trackErrors) {
            window.addEventListener('error', function(event) {
                trackEvent('Error', 'JavaScript Error', `${event.message} at ${event.filename}:${event.lineno}`);
            });
        }

        // Atualizar hora da última atividade
        document.addEventListener('click', updateLastActivity);
        document.addEventListener('scroll', updateLastActivity);
        document.addEventListener('keypress', updateLastActivity);
    }

    /**
     * Registra ouvintes no barramento de eventos do sistema
     */
    function registerEventBusListeners() {
        if (typeof DedaloEventBus === 'undefined') return;

        // Escutar eventos específicos do aplicativo
        DedaloEventBus.subscribe('age:verification:success', function() {
            trackEvent('User Flow', 'Age Verification', 'Success');
        });

        DedaloEventBus.subscribe('age:verification:failed', function() {
            trackEvent('User Flow', 'Age Verification', 'Failed');
        });

        DedaloEventBus.subscribe('tab:changed', function(data) {
            trackEvent('UI Interaction', 'Tab Change', data.tabId || 'unnamed tab');
        });

        DedaloEventBus.subscribe('location:selected', function(data) {
            trackEvent('User Preference', 'Location Selected', data.locationName || 'unnamed location');
        });

        DedaloEventBus.subscribe('price:period:viewed', function(data) {
            trackEvent('User Interaction', 'Price Period Viewed', `${data.dayType || 'unknown'} - ${data.period || 'unknown'}`);
        });
    }

    /**
     * Rastreia uma visualização de página
     * @param {string} path - Caminho da página (opcional, usa a localização atual por padrão)
     * @param {Object} customData - Dados personalizados adicionais para enviar
     */
    function trackPageView(path = null, customData = {}) {
        if (!config.enabled || !userState.consentGiven) return;

        const pagePath = path || window.location.pathname + window.location.search;
        const pageTitle = document.title;

        try {
            if (window.ga) {
                ga('send', 'pageview', {
                    'page': pagePath,
                    'title': pageTitle,
                    ...customData
                });
            }
            
            userState.pageViewCount++;
            console.log(`Página rastreada: ${pagePath}`);
        } catch (error) {
            console.error('Erro ao rastrear visualização de página:', error);
        }
    }

    /**
     * Rastreia um evento específico
     * @param {string} category - Categoria do evento
     * @param {string} action - Ação do evento
     * @param {string} label - Rótulo do evento (opcional)
     * @param {number} value - Valor numérico para o evento (opcional)
     */
    function trackEvent(category, action, label = null, value = null) {
        if (!config.enabled || !userState.consentGiven) return;

        try {
            if (window.ga) {
                ga('send', 'event', {
                    eventCategory: category,
                    eventAction: action,
                    eventLabel: label,
                    eventValue: value
                });
            }
            
            userState.uniqueEventCount++;
            console.log(`Evento rastreado: ${category} / ${action} / ${label || 'sem rótulo'}`);
        } catch (error) {
            console.error('Erro ao rastrear evento:', error);
        }
    }

    /**
     * Rastreia interações com as abas de preços
     * @param {string} tabType - Tipo de aba (today, weekdays, weekend, holidays)
     * @param {string} period - Período de tempo (morning, afternoon, night)
     */
    function trackPriceTabInteraction(tabType, period) {
        trackEvent('Prices Section', 'Tab Interaction', `${tabType} - ${period}`);
    }

    /**
     * Rastreia interações com o mapa de localização
     * @param {string} location - Nome da localização
     * @param {string} action - Ação realizada (view, click, directions)
     */
    function trackLocationInteraction(location, action) {
        trackEvent('Location', action, location);
    }

    /**
     * Verifica se o Do Not Track está habilitado no navegador
     * @returns {boolean} Verdadeiro se o Do Not Track estiver habilitado
     */
    function doNotTrackEnabled() {
        if (navigator.doNotTrack === '1' || 
            navigator.doNotTrack === 'yes' || 
            navigator.msDoNotTrack === '1' || 
            window.doNotTrack === '1') {
            return true;
        }
        return false;
    }

    /**
     * Atualiza a hora da última atividade do usuário
     */
    function updateLastActivity() {
        userState.lastActivityTime = Date.now();
    }

    /**
     * Define o consentimento do usuário para rastreamento de analytics
     * @param {boolean} consent - Indica se o usuário consentiu com o rastreamento
     */
    function setUserConsent(consent) {
        userState.consentGiven = !!consent;
        
        // Armazenar o consentimento para sessões futuras
        if (typeof DedaloStorage !== 'undefined') {
            DedaloStorage.setItem('analytics_consent', consent ? 'true' : 'false');
        }

        // Se o usuário deu consentimento e o analytics não estava carregado, carregar agora
        if (consent && config.enabled && !window.ga) {
            loadGoogleAnalytics();
            setupEventListeners();
            trackPageView(window.location.pathname + window.location.search);
        }

        trackEvent('Privacy', 'Consent Updated', consent ? 'Granted' : 'Revoked');
        
        return userState.consentGiven;
    }

    /**
     * Obtém informações sobre a sessão atual
     * @returns {Object} Dados sobre a sessão atual
     */
    function getSessionInfo() {
        const now = Date.now();
        const sessionDuration = now - userState.sessionStartTime;
        const timeSinceLastActivity = now - userState.lastActivityTime;
        
        return {
            pageViews: userState.pageViewCount,
            events: userState.uniqueEventCount,
            durationSeconds: Math.floor(sessionDuration / 1000),
            inactiveSeconds: Math.floor(timeSinceLastActivity / 1000),
            consentGiven: userState.consentGiven
        };
    }

    /**
     * API pública
     */
    return {
        init,
        trackPageView,
        trackEvent,
        trackPriceTabInteraction,
        trackLocationInteraction,
        setUserConsent,
        getSessionInfo
    };
})();

// Inicialização automática se o evento DOMContentLoaded já não tiver ocorrido
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar quando a configuração estiver disponível
        if (typeof DedaloConfig !== 'undefined') {
            DedaloAnalytics.init(DedaloConfig.analytics || {});
        } else {
            // Inicializar com configurações padrão se o config não estiver disponível
            DedaloAnalytics.init();
        }
    });
} else {
    // Se o DOM já foi carregado, inicializar imediatamente
    if (typeof DedaloConfig !== 'undefined') {
        DedaloAnalytics.init(DedaloConfig.analytics || {});
    } else {
        DedaloAnalytics.init();
    }
}

// Exportar para uso global
window.DedaloAnalytics = DedaloAnalytics;
