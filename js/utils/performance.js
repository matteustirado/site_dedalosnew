/**
 * @file performance.js
 * @description Utilitários para monitoramento de desempenho e otimizações como lazy-loading
 */

// Namespace do utilitário de performance
const Performance = (() => {
    // Cache de referências e configurações
    const config = {
        lazyLoadThreshold: 200, // px de distância para pré-carregamento
        metricsEnabled: true,
        debugMode: false, // Ativar para logs detalhados no console
        observerOptions: {
            root: null,
            rootMargin: '200px 0px',
            threshold: 0.01
        }
    };

    // Armazenamento de métricas coletadas
    const metrics = {
        navigationStart: performance.now(),
        firstPaintTime: 0,
        domContentLoaded: 0,
        fullyLoaded: 0,
        resourceMetrics: [],
        interactionMetrics: []
    };

    // Lazy loading para imagens, iframes e vídeos
    let lazyLoadObserver = null;

    /**
     * Inicia o monitoramento de performance e otimizações
     */
    function init() {
        if (window.performance && window.performance.mark) {
            captureNavigationTimings();
            setupPerformanceObserver();
        }

        setupLazyLoading();
        setupResourceTimingCollection();
        trackUserInteractions();

        // Log inicial
        if (config.debugMode) {
            console.log('🚀 Sistema de performance inicializado');
        }

        // Registrar eventos ao carregar a página
        window.addEventListener('DOMContentLoaded', () => {
            metrics.domContentLoaded = performance.now();
            if (config.debugMode) {
                console.log(`⏱️ DOMContentLoaded: ${Math.round(metrics.domContentLoaded)}ms`);
            }
        });

        window.addEventListener('load', () => {
            metrics.fullyLoaded = performance.now();
            if (config.debugMode) {
                console.log(`⏱️ Página totalmente carregada: ${Math.round(metrics.fullyLoaded)}ms`);
            }
            reportVitals();
        });
    }

    /**
     * Captura métricas de tempo de navegação
     */
    function captureNavigationTimings() {
        if (!window.performance || !window.performance.timing) return;
        
        // Capturar First Paint quando disponível
        if (window.performance.getEntriesByType) {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            
            if (firstPaint) {
                metrics.firstPaintTime = firstPaint.startTime;
                if (config.debugMode) {
                    console.log(`⏱️ First Paint: ${Math.round(metrics.firstPaintTime)}ms`);
                }
            }
        }
    }

    /**
     * Configura um PerformanceObserver para coletar métricas em tempo real
     */
    function setupPerformanceObserver() {
        if (!window.PerformanceObserver) return;

        try {
            // Observar métricas de Web Vitals
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (config.debugMode) {
                        console.log(`📊 Performance Entry: ${entry.name}`, entry);
                    }
                    
                    // Capturar métricas específicas (CLS, LCP, FID, etc)
                    if (entry.entryType === 'largest-contentful-paint') {
                        metrics.largestContentfulPaint = entry.startTime;
                    } else if (entry.entryType === 'layout-shift') {
                        metrics.cumulativeLayoutShift = (metrics.cumulativeLayoutShift || 0) + entry.value;
                    }
                });
            });
            
            // Observar diversos tipos de métricas
            observer.observe({ 
                entryTypes: ['largest-contentful-paint', 'layout-shift', 'first-input', 'paint'] 
            });
        } catch (error) {
            console.warn('PerformanceObserver não suportado neste navegador', error);
        }
    }

    /**
     * Configura lazy loading para imagens, iframes e vídeos
     */
    function setupLazyLoading() {
        // Se o navegador suporta lazy loading nativo, marcar elementos apropriados
        if ('loading' in HTMLImageElement.prototype) {
            document.querySelectorAll('img[data-src], iframe[data-src], video[data-src]').forEach(element => {
                element.loading = 'lazy';
                // Transferir o atributo data-src para src para imagens com lazy-loading nativo
                if (element.dataset.src) {
                    element.src = element.dataset.src;
                    delete element.dataset.src;
                }
            });
        } else {
            // Fallback para navegadores que não suportam lazy loading nativo
            initIntersectionObserver();
        }
    }

    /**
     * Inicializa o IntersectionObserver para lazy loading em navegadores sem suporte nativo
     */
    function initIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            lazyLoadObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        // Tratar diferentes tipos de elementos
                        if (element.hasAttribute('data-src')) {
                            if (element.tagName.toLowerCase() === 'img' || 
                                element.tagName.toLowerCase() === 'iframe' || 
                                element.tagName.toLowerCase() === 'video') {
                                element.src = element.dataset.src;
                                delete element.dataset.src;
                            } else if (element.tagName.toLowerCase() === 'source') {
                                element.srcset = element.dataset.src;
                                delete element.dataset.src;
                            }
                        }
                        
                        // Para imagens com srcset
                        if (element.hasAttribute('data-srcset')) {
                            element.srcset = element.dataset.srcset;
                            delete element.dataset.srcset;
                        }
                        
                        // Para elementos de fundo com CSS
                        if (element.hasAttribute('data-bg')) {
                            element.style.backgroundImage = `url('${element.dataset.bg}')`;
                            delete element.dataset.bg;
                        }
                        
                        // Adicionar classe quando carregado (para animações)
                        element.classList.add('loaded');
                        
                        // Parar de observar após carregar
                        observer.unobserve(element);
                        
                        if (config.debugMode) {
                            console.log(`🖼️ Lazy loaded: ${element.tagName.toLowerCase()}`);
                        }
                    }
                });
            }, config.observerOptions);
            
            // Começar a observar todos os elementos com data-src
            document.querySelectorAll('[data-src], [data-srcset], [data-bg]').forEach(element => {
                lazyLoadObserver.observe(element);
            });
        }
    }

    /**
     * Configura coleta de métricas de timing de recursos
     */
    function setupResourceTimingCollection() {
        if (!window.performance || !window.performance.getEntriesByType) return;
        
        // Coletamos recursos periodicamente para não perder entradas
        setInterval(() => {
            if (!config.metricsEnabled) return;
            
            const resources = performance.getEntriesByType('resource');
            if (resources.length > 0) {
                resources.forEach(resource => {
                    // Evitar duplicatas
                    const exists = metrics.resourceMetrics.some(r => r.name === resource.name && r.startTime === resource.startTime);
                    if (!exists) {
                        metrics.resourceMetrics.push({
                            name: resource.name,
                            type: resource.initiatorType,
                            size: resource.transferSize || 0,
                            duration: resource.duration,
                            startTime: resource.startTime
                        });
                    }
                });
                
                // Limpar buffer depois de coletar
                performance.clearResourceTimings();
            }
        }, 3000);
    }

    /**
     * Rastreia interações do usuário para métricas de responsividade
     */
    function trackUserInteractions() {
        ['click', 'input', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                if (!config.metricsEnabled) return;
                
                const timestamp = performance.now();
                const target = e.target.tagName || 'unknown';
                
                // Armazenar informações sobre a interação
                metrics.interactionMetrics.push({
                    type: eventType,
                    target: target,
                    timestamp: timestamp
                });
                
                // Limitar o tamanho do array para não consumir muita memória
                if (metrics.interactionMetrics.length > 100) {
                    metrics.interactionMetrics.shift();
                }
            }, { passive: true });
        });
    }

    /**
     * Envia as métricas vitais para análise ou console (em modo debug)
     */
    function reportVitals() {
        if (config.debugMode) {
            console.group('📊 Web Vitals Report');
            console.log('Tempo de carregamento completo:', Math.round(metrics.fullyLoaded), 'ms');
            console.log('First Paint:', Math.round(metrics.firstPaintTime), 'ms');
            console.log('LCP:', metrics.largestContentfulPaint ? Math.round(metrics.largestContentfulPaint) : 'N/A', 'ms');
            console.log('CLS:', metrics.cumulativeLayoutShift ? metrics.cumulativeLayoutShift.toFixed(3) : 'N/A');
            console.groupEnd();
        }
        
        // Aqui você pode enviar métricas para um sistema de analytics
        if (window.analytics && config.metricsEnabled) {
            try {
                window.analytics.trackPerformance({
                    loadTime: Math.round(metrics.fullyLoaded),
                    firstPaint: Math.round(metrics.firstPaintTime),
                    lcp: metrics.largestContentfulPaint ? Math.round(metrics.largestContentfulPaint) : null,
                    cls: metrics.cumulativeLayoutShift || null
                });
            } catch (error) {
                console.warn('Erro ao enviar métricas para analytics:', error);
            }
        }
    }

    /**
     * Fornece métricas coletadas para outras partes da aplicação
     */
    function getMetrics() {
        return { ...metrics };
    }

    /**
     * Força o carregamento imediato de um elemento específico
     * @param {HTMLElement} element - Elemento para carregar imediatamente
     */
    function loadElementNow(element) {
        if (!element) return;
        
        if (element.dataset.src) {
            element.src = element.dataset.src;
            delete element.dataset.src;
        }
        
        if (element.dataset.srcset) {
            element.srcset = element.dataset.srcset;
            delete element.dataset.srcset;
        }
        
        if (element.dataset.bg) {
            element.style.backgroundImage = `url('${element.dataset.bg}')`;
            delete element.dataset.bg;
        }
        
        element.classList.add('loaded');
        
        if (config.debugMode) {
            console.log(`🖼️ Forçando carregamento imediato: ${element.tagName.toLowerCase()}`);
        }
    }

    /**
     * Prefetch de recursos para melhorar experiência de navegação
     * @param {string} url - URL do recurso para fazer prefetch
     * @param {string} type - Tipo do recurso (style, script, image, font, fetch)
     */
    function prefetchResource(url, type = 'fetch') {
        if (!url || !navigator.onLine) return;
        
        // Criar link de prefetch apropriado
        const link = document.createElement('link');
        link.rel = (type === 'fetch') ? 'prefetch' : 
                   (type === 'style') ? 'preload' : 
                   (type === 'script') ? 'preload' : 
                   (type === 'image') ? 'preload' : 
                   (type === 'font') ? 'preload' : 'prefetch';
        
        link.href = url;
        
        if (type !== 'fetch') {
            link.as = type;
        }
        
        if (type === 'font') {
            link.crossOrigin = 'anonymous';
        }
        
        // Adicionar à cabeça do documento
        document.head.appendChild(link);
        
        if (config.debugMode) {
            console.log(`🔄 Prefetch iniciado para: ${url} (${type})`);
        }
    }

    /**
     * Configura prefetch de página para navegação mais rápida
     * @param {Array} urls - URLs para fazer prefetch
     */
    function setupPagePrefetch(urls = []) {
        if (!navigator.onLine || !Array.isArray(urls) || urls.length === 0) return;
        
        // Usar requestIdleCallback para não impactar a performance inicial
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
                urls.forEach(url => prefetchResource(url));
            }, { timeout: 2000 });
        } else {
            // Fallback para setTimeout
            setTimeout(() => {
                urls.forEach(url => prefetchResource(url));
            }, 2000);
        }
    }

    // Configuração de lazy loading para a API pública
    function lazyLoadImages() {
        setupLazyLoading();
    }

    // API pública
    return {
        init,
        getMetrics,
        lazyLoadImages,
        loadElementNow,
        prefetchResource,
        setupPagePrefetch
    };
})();

// Exportar para uso em outros módulos
export default Performance;
