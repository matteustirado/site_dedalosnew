/**
 * Dédalos Bar - Sistema de Inicialização
 * 
 * Este script controla o carregamento e inicialização de todos os módulos
 * do site na ordem correta, garantindo que as dependências sejam respeitadas.
 */

// IIFE para evitar poluição do escopo global
(function() {
    'use strict';

    // Cache de elementos DOM frequentemente acessados
    const DOM = {
        splashScreen: document.getElementById('splashScreen'),
        ageVerificationModal: document.getElementById('ageVerificationModal'),
        mainContent: document.getElementById('mainContent'),
        lightspeedAnimation: document.getElementById('lightspeedAnimation'),
        impactText: document.getElementById('impactText'),
        btnYes: document.getElementById('btnYes'),
        btnNo: document.getElementById('btnNo'),
        btnTryAgain: document.getElementById('btnTryAgain'),
        underageMessage: document.getElementById('underageMessage'),
        mobileMenuToggle: document.getElementById('mobileMenuToggle'),
        checkinCounter: document.getElementById('checkinCounter'),
        statusBadge: document.getElementById('statusBadge')
    };

    // Estado da aplicação
    const state = {
        isAgeVerified: false,
        splashScreenDismissed: false,
        currentSection: 'splash',
        isMenuOpen: false,
        lastScrollPosition: 0,
        currentTimePeriod: '',
        currentPriceTab: 'today'
    };

    /**
     * Inicialização principal - ponto de entrada
     */
    function init() {
        // Verificar se é a primeira visita ou se a verificação de idade já foi feita
        checkPreviousSession();
        
        // Inicializa o sistema de eventos
        initEventBus();
        
        // Inicializa efeitos visuais (Multichrome)
        initVisualEffects();
        
        // Carrega e exibe uma frase aleatória na splash screen
        loadRandomPhrase();
        
        // Configura a splash screen e seus eventos
        setupSplashScreen();
        
        // Configura o verificador de idade
        setupAgeVerification();
        
        // Pré-inicializa componentes principais (sem exibi-los ainda)
        preInitMainComponents();
        
        // Configura o service worker (PWA)
        registerServiceWorker();
        
        // Inicia sistema de analytics
        initAnalytics();
    }

    /**
     * Verifica se o usuário já visitou o site antes
     */
    function checkPreviousSession() {
        try {
            const storage = window.localStorage;
            const ageVerified = storage.getItem('ageVerified');
            
            if (ageVerified === 'true') {
                state.isAgeVerified = true;
            }
        } catch (error) {
            console.warn('Erro ao acessar localStorage:', error);
        }
    }

    /**
     * Inicializa o sistema de eventos pub/sub
     */
    function initEventBus() {
        // Verifica se o EventBus já foi inicializado
        if (typeof EventBus !== 'undefined') {
            EventBus.init();
            
            // Assina eventos principais
            EventBus.subscribe('age:verified', handleAgeVerified);
            EventBus.subscribe('age:denied', handleAgeDenied);
            EventBus.subscribe('splash:dismissed', handleSplashDismissed);
            EventBus.subscribe('section:changed', handleSectionChanged);
        } else {
            console.warn('EventBus não encontrado. Algumas funcionalidades podem estar indisponíveis.');
        }
    }

    /**
     * Inicializa efeitos visuais
     */
    function initVisualEffects() {
        // Inicializa o efeito Multichrome
        if (typeof MultichromeEffect !== 'undefined') {
            MultichromeEffect.init();
        }
        
        // Inicializa outros efeitos visuais, se disponíveis
        if (typeof Transitions !== 'undefined') {
            Transitions.init();
        }
    }

    /**
     * Carrega e exibe uma frase aleatória na splash screen
     */
    function loadRandomPhrase() {
        if (typeof Phrases !== 'undefined' && DOM.impactText) {
            const randomPhrase = Phrases.getRandomPhrase();
            DOM.impactText.textContent = randomPhrase;
        }
    }

    /**
     * Configura a splash screen e seus eventos
     */
    function setupSplashScreen() {
        // Se a verificação de idade já tiver sido feita anteriormente, pula a splash
        if (state.isAgeVerified) {
            handleSplashDismissed();
            return;
        }

        // Exibe a splash screen (garante que esteja visível)
        if (DOM.splashScreen) {
            DOM.splashScreen.style.display = 'flex';
            
            // Adiciona o listener de clique para dispensar a splash screen
            DOM.splashScreen.addEventListener('click', function() {
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('splash:dismissed');
                } else {
                    handleSplashDismissed();
                }
            });
        }
    }

    /**
     * Configura o verificador de idade
     */
    function setupAgeVerification() {
        // Se a verificação de idade já foi feita anteriormente, pula esta etapa
        if (state.isAgeVerified) {
            showMainContent();
            return;
        }

        // Configura os botões de verificação de idade
        if (DOM.btnYes) {
            DOM.btnYes.addEventListener('click', function() {
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('age:verified');
                } else {
                    handleAgeVerified();
                }
            });
        }

        if (DOM.btnNo) {
            DOM.btnNo.addEventListener('click', function() {
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('age:denied');
                } else {
                    handleAgeDenied();
                }
            });
        }

        if (DOM.btnTryAgain) {
            DOM.btnTryAgain.addEventListener('click', function() {
                if (DOM.underageMessage) {
                    DOM.underageMessage.hidden = true;
                }
            });
        }
    }

    /**
     * Manipulador para quando a splash screen é dispensada
     */
    function handleSplashDismissed() {
        state.splashScreenDismissed = true;
        state.currentSection = 'age-verification';
        
        // Esconde a splash screen com animação
        if (DOM.splashScreen) {
            DOM.splashScreen.classList.add('fade-out');
            
            setTimeout(function() {
                DOM.splashScreen.style.display = 'none';
                
                // Se a idade já foi verificada, vai direto para o conteúdo principal
                if (state.isAgeVerified) {
                    showMainContent();
                } else {
                    // Senão, mostra o modal de verificação de idade
                    if (DOM.ageVerificationModal) {
                        DOM.ageVerificationModal.hidden = false;
                    }
                }
            }, 800); // Tempo da animação
        }
    }

    /**
     * Manipulador para quando o usuário confirma ter mais de 18 anos
     */
    function handleAgeVerified() {
        state.isAgeVerified = true;
        state.currentSection = 'transition';
        
        // Salva a verificação de idade no localStorage
        try {
            window.localStorage.setItem('ageVerified', 'true');
        } catch (error) {
            console.warn('Erro ao salvar em localStorage:', error);
        }
        
        // Esconde o modal de verificação
        if (DOM.ageVerificationModal) {
            DOM.ageVerificationModal.hidden = true;
        }
        
        // Mostra a animação de transição
        if (DOM.lightspeedAnimation) {
            DOM.lightspeedAnimation.classList.add('active');
            
            setTimeout(function() {
                DOM.lightspeedAnimation.classList.remove('active');
                showMainContent();
            }, 1200); // Tempo da animação
        } else {
            showMainContent();
        }
    }

    /**
     * Manipulador para quando o usuário indica ter menos de 18 anos
     */
    function handleAgeDenied() {
        if (DOM.underageMessage) {
            DOM.underageMessage.hidden = false;
        }
    }

    /**
     * Mostra o conteúdo principal do site
     */
    function showMainContent() {
        state.currentSection = 'main-content';
        
        if (DOM.mainContent) {
            DOM.mainContent.hidden = false;
            DOM.mainContent.classList.add('fade-in');
            
            // Inicializa os componentes do conteúdo principal
            initMainComponents();
        }
    }

    /**
     * Manipulador para mudança de seção do site
     */
    function handleSectionChanged(sectionId) {
        // Lógica para tratamento de mudança de seção
        // Pode incluir animações, carregamento de dados, etc.
    }

    /**
     * Pré-inicializa componentes necessários, mas ainda não exibe o conteúdo
     */
    function preInitMainComponents() {
        // Inicializa componentes que precisam ser carregados antecipadamente
        // mas que ainda não serão exibidos
    }

    /**
     * Inicializa todos os componentes do conteúdo principal
     */
    function initMainComponents() {
        // Inicializa o cabeçalho fixo e seu comportamento
        initHeader();
        
        // Inicializa contadores e elementos dinâmicos
        initCounters();
        
        // Inicializa as abas e guias
        initTabs();
        
        // Inicializa os sliders/carrosséis
        initSliders();
        
        // Inicializa acordeões (FAQ)
        initAccordions();
        
        // Inicializa formulários
        initForms();
        
        // Inicializa mapas
        initMaps();
        
        // Definição do período atual (para preços)
        updateCurrentTimePeriod();
        
        // Aplica os preços corretos com base no dia/hora atual
        updatePriceDisplay();
    }

    /**
     * Inicializa o cabeçalho e navegação
     */
    function initHeader() {
        if (DOM.mobileMenuToggle) {
            DOM.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        }
        
        // Configura a observação de rolagem para efeitos do cabeçalho
        window.addEventListener('scroll', handleScroll);
    }

    /**
     * Inicializa contadores (como contador de check-ins)
     */
    function initCounters() {
        if (typeof CheckinCounter !== 'undefined' && DOM.checkinCounter) {
            CheckinCounter.init(DOM.checkinCounter);
        }
        
        // Atualiza o status do bar (aberto/fechado)
        updateBarStatus();
    }

    /**
     * Atualiza o status do bar com base no horário atual
     */
    function updateBarStatus() {
        if (DOM.statusBadge) {
            // Como o bar está aberto 24h, sempre exibimos "24 HORAS"
            DOM.statusBadge.innerHTML = '<span>24 HORAS</span>';
        }
    }

    /**
     * Inicializa o sistema de abas
     */
    function initTabs() {
        if (typeof Tabs !== 'undefined') {
            Tabs.init();
        }
    }

    /**
     * Inicializa sliders e carrosséis
     */
    function initSliders() {
        if (typeof Sliders !== 'undefined') {
            Sliders.init();
        }
        
        // Inicializa os sliders das regras
        if (typeof RulesSlider !== 'undefined') {
            RulesSlider.init();
        }
        
        // Inicializa os carrosséis de eventos
        if (typeof EventsCarousel !== 'undefined') {
            EventsCarousel.init();
        }
    }

    /**
     * Inicializa acordeões (FAQ)
     */
    function initAccordions() {
        if (typeof Accordions !== 'undefined') {
            Accordions.init();
        }
    }

    /**
     * Inicializa formulários e validação
     */
    function initForms() {
        if (typeof FormHandlers !== 'undefined') {
            FormHandlers.init();
        }
    }

    /**
     * Inicializa mapas do Google
     */
    function initMaps() {
        if (typeof MapsAPI !== 'undefined') {
            MapsAPI.init();
        }
    }

    /**
     * Determina o período atual do dia (manhã, tarde, noite)
     * para exibição correta dos preços
     */
    function updateCurrentTimePeriod() {
        const now = new Date();
        const hours = now.getHours();
        
        let period = '';
        
        if (hours >= 6 && hours < 14) {
            period = 'morning';
        } else if (hours >= 14 && hours < 20) {
            period = 'afternoon';
        } else {
            period = 'night';
        }
        
        state.currentTimePeriod = period;
        
        // Atualiza o indicador de período atual
        const currentPeriodElement = document.getElementById('currentPeriod');
        if (currentPeriodElement) {
            const periodNames = {
                'morning': 'Manhã/Tarde (06h - 13:59h)',
                'afternoon': 'Tarde/Noite (14h - 19:59h)',
                'night': 'Noite/Madrugada (20h - 05:59h)'
            };
            
            currentPeriodElement.textContent = periodNames[period];
        }
        
        // Destaca o período atual no slider de preços
        highlightCurrentPeriod(period);
    }
    
    /**
     * Destaca visualmente o período atual nos sliders de preços
     */
    function highlightCurrentPeriod(period) {
        const indicators = document.querySelectorAll('.slider-indicators .indicator');
        const slides = document.querySelectorAll('.time-period-slide');
        
        // Encontra o slide correspondente ao período atual
        let slideIndex = 0;
        switch (period) {
            case 'morning':
                slideIndex = 0;
                break;
            case 'afternoon':
                slideIndex = 1;
                break;
            case 'night':
                slideIndex = 2;
                break;
        }
        
        // Remove todas as classes ativas e adiciona apenas no período atual
        indicators.forEach(indicator => indicator.classList.remove('current'));
        slides.forEach(slide => slide.classList.remove('current-period'));
        
        // Adiciona a classe current ao indicador correspondente
        const currentIndicators = document.querySelectorAll(`.slider-indicators .indicator[data-slide="${slideIndex}"]`);
        currentIndicators.forEach(indicator => indicator.classList.add('current'));
        
        // Adiciona a classe current-period ao slide correspondente
        const currentSlides = document.querySelectorAll(`.time-period-slide[data-period="${period}"]`);
        currentSlides.forEach(slide => slide.classList.add('current-period'));
    }
    
    /**
     * Atualiza a exibição de preços com base no dia da semana e horário atual
     */
    function updatePriceDisplay() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0-6 (Domingo-Sábado)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo ou Sábado
        
        // Verifica se é feriado (implementação simplificada - será expandida depois)
        const isHoliday = false; // Aqui terá uma verificação de feriados
        
        // Define qual aba de preços deve estar ativa
        let tabToActivate = 'weekdays'; // Segunda a Sexta por padrão
        
        if (isHoliday) {
            tabToActivate = 'holidays';
        } else if (isWeekend) {
            tabToActivate = 'weekend';
        }
        
        // Atualiza a aba 'today' para refletir o dia atual
        state.currentPriceTab = tabToActivate;
        
        // Ativa a aba de preços correspondente ao dia atual
        const todayTab = document.querySelector(`.prices-tabs [data-tab="today"]`);
        if (todayTab) {
            // Copia os preços da aba atual (weekdays, weekend ou holidays) para a aba 'today'
            const sourceTabContent = document.getElementById(tabToActivate);
            const targetTabContent = document.getElementById('today');
            
            if (sourceTabContent && targetTabContent) {
                // Copia apenas o conteúdo interno, mantendo a estrutura da aba 'today'
                const priceSlides = sourceTabContent.querySelectorAll('.time-period-slide');
                const todaySlides = targetTabContent.querySelectorAll('.time-period-slide');
                
                if (priceSlides.length === todaySlides.length) {
                    for (let i = 0; i < priceSlides.length; i++) {
                        const priceCards = priceSlides[i].querySelectorAll('.price-card .price-value');
                        const todayCards = todaySlides[i].querySelectorAll('.price-card .price-value');
                        
                        if (priceCards.length === todayCards.length) {
                            for (let j = 0; j < priceCards.length; j++) {
                                todayCards[j].textContent = priceCards[j].textContent;
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Manipula a abertura/fechamento do menu mobile
     */
    function toggleMobileMenu() {
        state.isMenuOpen = !state.isMenuOpen;
        
        if (DOM.mobileMenuToggle) {
            DOM.mobileMenuToggle.setAttribute('aria-expanded', state.isMenuOpen);
            
            // Adiciona/remove classe no body para controlar o estilo do menu aberto
            document.body.classList.toggle('menu-open', state.isMenuOpen);
            
            // Encontra o menu que precisa ser mostrado/escondido
            const mainNav = document.querySelector('.main-nav');
            if (mainNav) {
                mainNav.classList.toggle('active', state.isMenuOpen);
            }
        }
    }
    
    /**
     * Manipula o evento de rolagem da página
     */
    function handleScroll() {
        const scrollY = window.scrollY;
        const header = document.querySelector('.main-header');
        
        // Determina direção da rolagem
        const isScrollingDown = scrollY > state.lastScrollPosition;
        state.lastScrollPosition = scrollY;
        
        // Adiciona classe de header fixo quando rolar para baixo
        if (header) {
            // Header com fundo sólido quando rolar para baixo
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Esconde o header quando estiver rolando para baixo e já estiver um pouco abaixo
            // Mostra novamente quando rolar para cima
            if (scrollY > 200) {
                if (isScrollingDown) {
                    header.classList.add('header-hidden');
                } else {
                    header.classList.remove('header-hidden');
                }
            } else {
                header.classList.remove('header-hidden');
            }
        }
        
        // Verifica se seções estão visíveis para ativar animações
        checkVisibleSections();
    }
    
    /**
     * Verifica quais seções estão visíveis na viewport
     * para ativar animações e destacar itens de navegação
     */
    function checkVisibleSections() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.main-nav a');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            // Verifica se a seção está visível na tela
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                // Destaca o item de navegação correspondente
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
                
                // Dispara evento de seção visível - pode ser usado para animações
                if (typeof EventBus !== 'undefined') {
                    EventBus.publish('section:visible', sectionId);
                }
            }
        });
    }
    
    /**
     * Registra o service worker para funcionalidades PWA
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registrado com sucesso:', registration.scope);
                    })
                    .catch(error => {
                        console.warn('Falha ao registrar o Service Worker:', error);
                    });
            });
        }
    }
    
    /**
     * Inicializa o sistema de analytics
     */
    function initAnalytics() {
        // Verificação para carregar analytics apenas se o módulo estiver disponível
        if (typeof Analytics !== 'undefined') {
            Analytics.init();
        }
    }
    
    // Inicializa o site quando o DOM estiver completamente carregado
    document.addEventListener('DOMContentLoaded', init);
    
    // Expõe a API pública, mantendo detalhes de implementação privados
    window.DedalosApp = {
        // Método para forçar atualização de preços
        refreshPrices: updatePriceDisplay,
        
        // Método para atualizar contadores
        refreshCounters: initCounters
    };
})();
