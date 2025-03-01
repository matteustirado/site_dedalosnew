/**
 * @file events.js
 * @description Gerencia o carrossel de eventos futuros e suas interações
 */

// Usando o padrão IIFE para encapsulamento
(function() {
    'use strict';

    // Configurações do carrossel
    const config = {
        slideInterval: 5000, // Tempo em ms para troca automática de slides
        transitionSpeed: 400, // Velocidade da transição em ms
        autoplay: true, // Iniciar com autoplay
        touchThreshold: 50 // Quantidade de pixels para considerar um swipe
    };

    // Referências aos elementos DOM
    let eventsCarousel;
    let carouselTrack;
    let prevButton;
    let nextButton;
    let indicatorsContainer;
    let eventCards;
    let autoplayInterval;
    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;
    let isTransitioning = false;

    /**
     * Inicializa o carrossel de eventos
     */
    function init() {
        // Buscar elementos no DOM
        eventsCarousel = document.querySelector('.events-carousel');
        
        // Se não encontrar o carrossel, sair da função
        if (!eventsCarousel) return;

        carouselTrack = eventsCarousel.querySelector('.carousel-track');
        prevButton = eventsCarousel.querySelector('.carousel-prev');
        nextButton = eventsCarousel.querySelector('.carousel-next');
        indicatorsContainer = eventsCarousel.querySelector('.carousel-indicators');
        eventCards = Array.from(eventsCarousel.querySelectorAll('.event-card'));

        // Configurar o carrossel com base no número de eventos
        setupCarousel();
        
        // Adicionar event listeners
        addEventListeners();
        
        // Iniciar autoplay se configurado
        if (config.autoplay) {
            startAutoplay();
        }

        // Registrar no barramento de eventos (se existir)
        if (window.EventBus) {
            window.EventBus.subscribe('page:visible', handlePageVisibility);
            window.EventBus.subscribe('theme:changed', updateCarouselTheme);
        }
    }

    /**
     * Configura o carrossel inicialmente
     */
    function setupCarousel() {
        // Criar indicadores baseados no número de eventos
        createIndicators();
        
        // Posicionar o carrossel no primeiro slide
        goToSlide(0);
        
        // Configurar responsividade
        setupResponsive();
        
        // Mostrar o carrossel após configuração
        eventsCarousel.classList.add('initialized');
    }

    /**
     * Cria os indicadores de slide
     */
    function createIndicators() {
        // Limpar indicadores existentes
        indicatorsContainer.innerHTML = '';
        
        // Criar um indicador para cada evento
        eventCards.forEach((_, index) => {
            const indicator = document.createElement('span');
            indicator.classList.add('indicator');
            indicator.setAttribute('data-slide', index);
            indicator.setAttribute('aria-label', `Evento ${index + 1}`);
            
            if (index === 0) {
                indicator.classList.add('active');
            }
            
            // Adicionar evento de clique
            indicator.addEventListener('click', () => {
                goToSlide(index);
            });
            
            indicatorsContainer.appendChild(indicator);
        });
    }

    /**
     * Adiciona os event listeners necessários
     */
    function addEventListeners() {
        // Botões de navegação
        if (prevButton) {
            prevButton.addEventListener('click', goToPrevSlide);
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', goToNextSlide);
        }
        
        // Eventos de touch para swipe em dispositivos móveis
        carouselTrack.addEventListener('touchstart', handleTouchStart, {passive: true});
        carouselTrack.addEventListener('touchend', handleTouchEnd, {passive: true});
        
        // Pausar autoplay ao hover
        eventsCarousel.addEventListener('mouseenter', pauseAutoplay);
        eventsCarousel.addEventListener('mouseleave', resumeAutoplay);
        
        // Ajustar em redimensionamento da janela
        window.addEventListener('resize', debounce(setupResponsive, 150));
        
        // Acessibilidade via teclado
        eventsCarousel.addEventListener('keydown', handleKeyNavigation);
    }

    /**
     * Vai para um slide específico
     * @param {number} index - Índice do slide
     */
    function goToSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;
        
        // Validar índice
        if (index < 0) {
            index = eventCards.length - 1;
        } else if (index >= eventCards.length) {
            index = 0;
        }
        
        currentIndex = index;
        
        // Calcular a posição do slide
        const slideWidth = eventCards[0].offsetWidth;
        const gap = parseInt(window.getComputedStyle(carouselTrack).columnGap || 0);
        const position = -(currentIndex * (slideWidth + gap));
        
        // Animar a transição
        carouselTrack.style.transition = `transform ${config.transitionSpeed}ms ease`;
        carouselTrack.style.transform = `translateX(${position}px)`;
        
        // Atualizar indicadores
        updateIndicators();
        
        // Reset da flag de transição após a animação
        setTimeout(() => {
            isTransitioning = false;
        }, config.transitionSpeed);
    }

    /**
     * Vai para o slide anterior
     */
    function goToPrevSlide() {
        goToSlide(currentIndex - 1);
    }

    /**
     * Vai para o próximo slide
     */
    function goToNextSlide() {
        goToSlide(currentIndex + 1);
    }

    /**
     * Atualiza a aparência dos indicadores
     */
    function updateIndicators() {
        const indicators = indicatorsContainer.querySelectorAll('.indicator');
        
        indicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            } else {
                indicator.classList.remove('active');
                indicator.removeAttribute('aria-current');
            }
        });
    }

    /**
     * Inicia a rotação automática de slides
     */
    function startAutoplay() {
        if (autoplayInterval) clearInterval(autoplayInterval);
        autoplayInterval = setInterval(goToNextSlide, config.slideInterval);
    }

    /**
     * Pausa a rotação automática
     */
    function pauseAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    /**
     * Retoma a rotação automática
     */
    function resumeAutoplay() {
        if (config.autoplay && !autoplayInterval) {
            startAutoplay();
        }
    }

    /**
     * Configura a responsividade do carrossel
     */
    function setupResponsive() {
        // Verificar tamanho da tela e ajustar conforme necessário
        const windowWidth = window.innerWidth;
        
        if (windowWidth < 768) {
            // Layout mobile: mostrar um card por vez
            eventCards.forEach(card => {
                card.style.width = '100%';
            });
        } else if (windowWidth < 1024) {
            // Tablet: mostrar dois cards
            eventCards.forEach(card => {
                card.style.width = 'calc(50% - 10px)';
            });
        } else {
            // Desktop: mostrar três ou quatro cards
            const cardsToShow = windowWidth < 1440 ? 3 : 4;
            eventCards.forEach(card => {
                card.style.width = `calc(${100 / cardsToShow}% - 15px)`;
            });
        }
        
        // Reposicionar para o slide atual
        goToSlide(currentIndex);
    }

    /**
     * Manipula o início de um toque para detecção de swipe
     * @param {TouchEvent} event - Evento de toque
     */
    function handleTouchStart(event) {
        touchStartX = event.changedTouches[0].screenX;
    }

    /**
     * Manipula o fim de um toque para detecção de swipe
     * @param {TouchEvent} event - Evento de toque
     */
    function handleTouchEnd(event) {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    }

    /**
     * Processa a ação de swipe
     */
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        
        if (swipeDistance > config.touchThreshold) {
            // Swipe para direita - slide anterior
            goToPrevSlide();
        } else if (swipeDistance < -config.touchThreshold) {
            // Swipe para esquerda - próximo slide
            goToNextSlide();
        }
    }

    /**
     * Gerencia visibilidade da página para autoplay
     * @param {Object} data - Dados do evento
     */
    function handlePageVisibility(data) {
        if (data && data.isVisible) {
            resumeAutoplay();
        } else {
            pauseAutoplay();
        }
    }

    /**
     * Atualiza o tema do carrossel quando o tema do site muda
     */
    function updateCarouselTheme() {
        // Lógica para ajustar o carrossel ao tema atual (claro/escuro)
        const isDarkTheme = document.body.classList.contains('dark-theme');
        
        if (isDarkTheme) {
            eventsCarousel.classList.add('dark-mode');
        } else {
            eventsCarousel.classList.remove('dark-mode');
        }
    }

    /**
     * Navegação por teclado para acessibilidade
     * @param {KeyboardEvent} event - Evento de teclado
     */
    function handleKeyNavigation(event) {
        if (document.activeElement === eventsCarousel || 
            eventsCarousel.contains(document.activeElement)) {
            
            switch (event.key) {
                case 'ArrowLeft':
                    goToPrevSlide();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    goToNextSlide();
                    event.preventDefault();
                    break;
                case 'Home':
                    goToSlide(0);
                    event.preventDefault();
                    break;
                case 'End':
                    goToSlide(eventCards.length - 1);
                    event.preventDefault();
                    break;
            }
        }
    }

    /**
     * Função de debounce para limitar chamadas frequentes
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @return {Function} - Função com debounce
     */
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    // Inicializar carrossel após o carregamento da página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expor funções para possível uso externo
    window.EventsCarousel = {
        goToNext: goToNextSlide,
        goToPrev: goToPrevSlide,
        goToSlide: goToSlide,
        pause: pauseAutoplay,
        resume: resumeAutoplay
    };
})();
