/**
 * sliders.js - Componente genérico para criação e controle de sliders/carrosséis
 * 
 * Este módulo implementa uma solução reutilizável para diferentes tipos de sliders
 * presentes no site do Dédalos Bar, incluindo:
 * - Sliders de preços por período
 * - Slider de regras da casa
 * - Galeria de fotos
 * - Carrossel de eventos
 * 
 * @author Dédalos Bar
 * @package components
 */

(function() {
    'use strict';

    // Armazena todas as instâncias de sliders criadas
    const sliderInstances = new Map();

    /**
     * Classe para gerenciar a funcionalidade de sliders/carrosséis
     */
    class Slider {
        /**
         * Inicializa um novo slider
         * 
         * @param {Object} options - Opções de configuração do slider
         * @param {string} options.trackSelector - Seletor do elemento que contém os slides
         * @param {string} options.slideSelector - Seletor dos elementos individuais (slides)
         * @param {string} options.prevButtonSelector - Seletor do botão "anterior"
         * @param {string} options.nextButtonSelector - Seletor do botão "próximo"
         * @param {string} options.indicatorsContainerSelector - Seletor do container de indicadores
         * @param {string} options.indicatorSelector - Seletor dos indicadores individuais
         * @param {number} options.initialSlide - Índice do slide inicial (padrão: 0)
         * @param {boolean} options.infinite - Se o slider deve ser infinito (padrão: true)
         * @param {boolean} options.autoplay - Se deve haver reprodução automática (padrão: false)
         * @param {number} options.autoplayInterval - Intervalo em ms para autoplay (padrão: 5000)
         * @param {string} options.activeClass - Classe CSS para indicar estados ativos (padrão: 'active')
         * @param {Function} options.onSlideChange - Callback quando o slide muda
         * @param {boolean} options.updateAriaAttributes - Se deve atualizar atributos ARIA (acessibilidade)
         */
        constructor(options) {
            this.options = Object.assign({
                initialSlide: 0,
                infinite: true,
                autoplay: false,
                autoplayInterval: 5000,
                activeClass: 'active',
                updateAriaAttributes: true,
                onSlideChange: null
            }, options);

            // Elementos DOM principais
            this.track = document.querySelector(this.options.trackSelector);
            
            if (!this.track) {
                console.error(`Elemento de track não encontrado: ${this.options.trackSelector}`);
                return;
            }
            
            this.slides = Array.from(this.track.querySelectorAll(this.options.slideSelector));
            this.prevButton = document.querySelector(this.options.prevButtonSelector);
            this.nextButton = document.querySelector(this.options.nextButtonSelector);
            this.indicatorsContainer = document.querySelector(this.options.indicatorsContainerSelector);
            this.indicators = this.indicatorsContainer ? 
                Array.from(this.indicatorsContainer.querySelectorAll(this.options.indicatorSelector)) : 
                [];

            // Estado atual
            this.currentIndex = this.options.initialSlide;
            this.autoplayTimer = null;
            this.isTransitioning = false;
            this.touchStartX = 0;
            this.touchEndX = 0;

            // Inicialização
            this._initializeSlider();
        }

        /**
         * Inicializa o slider configurando os eventos e estado inicial
         * @private
         */
        _initializeSlider() {
            // Verificar se existem slides
            if (this.slides.length === 0) {
                console.warn('Nenhum slide encontrado para este slider');
                return;
            }

            // Configurar eventos
            this._setupEventListeners();

            // Iniciar com o slide correto
            this.goToSlide(this.currentIndex);

            // Iniciar autoplay se necessário
            if (this.options.autoplay) {
                this.startAutoplay();
            }
        }

        /**
         * Configura os eventos de clique e toque (swipe)
         * @private
         */
        _setupEventListeners() {
            // Botões de navegação
            if (this.prevButton) {
                this.prevButton.addEventListener('click', () => this.prevSlide());
            }

            if (this.nextButton) {
                this.nextButton.addEventListener('click', () => this.nextSlide());
            }

            // Indicadores
            this.indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => this.goToSlide(index));
            });

            // Suporte para gestos de swipe em dispositivos móveis
            this.track.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
                
                // Pausar autoplay durante o toque
                if (this.options.autoplay) {
                    this.stopAutoplay();
                }
            }, { passive: true });

            this.track.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this._handleSwipe();
                
                // Retomar autoplay após o toque
                if (this.options.autoplay) {
                    this.startAutoplay();
                }
            }, { passive: true });

            // Pausar autoplay ao passar o mouse por cima (se aplicável)
            if (this.options.autoplay) {
                this.track.addEventListener('mouseenter', () => this.stopAutoplay());
                this.track.addEventListener('mouseleave', () => this.startAutoplay());
            }

            // Eventos de acessibilidade para navegação via teclado
            if (this.options.updateAriaAttributes) {
                this.slides.forEach(slide => {
                    slide.setAttribute('tabindex', '0');
                    slide.addEventListener('keydown', (e) => {
                        if (e.key === 'ArrowRight') {
                            this.nextSlide();
                        } else if (e.key === 'ArrowLeft') {
                            this.prevSlide();
                        }
                    });
                });
            }
        }

        /**
         * Manipula a lógica de swipe em dispositivos móveis
         * @private
         */
        _handleSwipe() {
            const swipeThreshold = 50; // pixels mínimos para considerar um swipe
            const diff = this.touchStartX - this.touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe para a esquerda -> próximo slide
                    this.nextSlide();
                } else {
                    // Swipe para a direita -> slide anterior
                    this.prevSlide();
                }
            }
        }

        /**
         * Atualiza classes e estilos para refletir o slide atual
         * @private
         */
        _updateUI() {
            // Atualizar classes ativas nos slides
            this.slides.forEach((slide, index) => {
                if (index === this.currentIndex) {
                    slide.classList.add(this.options.activeClass);
                    slide.setAttribute('aria-hidden', 'false');
                } else {
                    slide.classList.remove(this.options.activeClass);
                    slide.setAttribute('aria-hidden', 'true');
                }
            });

            // Atualizar indicadores
            this.indicators.forEach((indicator, index) => {
                if (index === this.currentIndex) {
                    indicator.classList.add(this.options.activeClass);
                    indicator.setAttribute('aria-selected', 'true');
                } else {
                    indicator.classList.remove(this.options.activeClass);
                    indicator.setAttribute('aria-selected', 'false');
                }
            });

            // Atualizar estado dos botões (para sliders não-infinitos)
            if (!this.options.infinite) {
                if (this.prevButton) {
                    this.prevButton.disabled = this.currentIndex === 0;
                }
                if (this.nextButton) {
                    this.nextButton.disabled = this.currentIndex === this.slides.length - 1;
                }
            }
        }

        /**
         * Vai para o slide anterior
         * @public
         */
        prevSlide() {
            if (this.isTransitioning) return;

            const newIndex = this.currentIndex === 0 
                ? (this.options.infinite ? this.slides.length - 1 : 0)
                : this.currentIndex - 1;
            
            this.goToSlide(newIndex);
        }

        /**
         * Vai para o próximo slide
         * @public
         */
        nextSlide() {
            if (this.isTransitioning) return;

            const newIndex = this.currentIndex === this.slides.length - 1
                ? (this.options.infinite ? 0 : this.slides.length - 1)
                : this.currentIndex + 1;
            
            this.goToSlide(newIndex);
        }

        /**
         * Navega para um slide específico por índice
         * @param {number} index - Índice do slide desejado
         * @public
         */
        goToSlide(index) {
            if (this.isTransitioning || index === this.currentIndex) return;
            
            // Validar o índice
            if (index < 0 || index >= this.slides.length) {
                console.warn('Índice de slide inválido:', index);
                return;
            }

            // Marcador para evitar múltiplas transições simultâneas
            this.isTransitioning = true;

            // Salvar o índice anterior para callbacks
            const previousIndex = this.currentIndex;
            
            // Atualizar o índice atual
            this.currentIndex = index;
            
            // Atualizar a interface
            this._updateUI();
            
            // Se houver um callback de mudança de slide, chamá-lo
            if (typeof this.options.onSlideChange === 'function') {
                this.options.onSlideChange(this.currentIndex, previousIndex, this.slides[this.currentIndex]);
            }

            // Emitir evento personalizado para permitir que outros componentes reajam
            const event = new CustomEvent('slideChange', {
                detail: {
                    sliderTrack: this.track,
                    currentIndex: this.currentIndex,
                    previousIndex: previousIndex,
                    currentSlide: this.slides[this.currentIndex]
                }
            });
            document.dispatchEvent(event);

            // Aguardar a transição CSS terminar antes de permitir outra alteração
            setTimeout(() => {
                this.isTransitioning = false;
            }, 300); // Ajustar para corresponder à duração da transição CSS
        }

        /**
         * Inicia a reprodução automática do slider
         * @public
         */
        startAutoplay() {
            if (!this.options.autoplay) return;
            
            this.stopAutoplay(); // Limpar qualquer timer existente
            
            this.autoplayTimer = setInterval(() => {
                this.nextSlide();
            }, this.options.autoplayInterval);
        }

        /**
         * Para a reprodução automática do slider
         * @public
         */
        stopAutoplay() {
            if (this.autoplayTimer) {
                clearInterval(this.autoplayTimer);
                this.autoplayTimer = null;
            }
        }
    }

    /**
     * Cria uma instância de slider a partir de um seletor de track
     * 
     * @param {string} trackSelector - Seletor CSS do elemento track
     * @param {Object} options - Opções de configuração
     * @returns {Slider} A instância do slider criada
     */
    function createSlider(trackSelector, options) {
        const mergedOptions = { trackSelector, ...options };
        const slider = new Slider(mergedOptions);
        
        // Armazenar a instância para referência futura
        sliderInstances.set(trackSelector, slider);
        
        return slider;
    }

    /**
     * Obtém uma instância de slider existente por seletor
     * 
     * @param {string} trackSelector - Seletor do track do slider
     * @returns {Slider|null} A instância do slider ou null se não encontrada
     */
    function getSlider(trackSelector) {
        return sliderInstances.get(trackSelector) || null;
    }

    /**
     * Inicializa automaticamente os sliders comuns da página ao carregar
     */
    function initializeDefaultSliders() {
        // Inicializar sliders de preços
        const priceSliderTracks = [
            '#today-slider-track', 
            '#weekdays-slider-track', 
            '#weekend-slider-track',
            '#holidays-slider-track'
        ];

        priceSliderTracks.forEach(trackSelector => {
            const track = document.querySelector(trackSelector);
            if (track) {
                createSlider(trackSelector, {
                    slideSelector: '.time-period-slide',
                    prevButtonSelector: track.closest('.time-periods-slider').querySelector('.slider-prev'),
                    nextButtonSelector: track.closest('.time-periods-slider').querySelector('.slider-next'),
                    indicatorsContainerSelector: track.closest('.time-periods-slider').querySelector('.slider-indicators'),
                    indicatorSelector: '.indicator',
                    updateAriaAttributes: true,
                    onSlideChange: (currentIndex, prevIndex, currentSlide) => {
                        // Função opcional para atualizar período atual nas tabelas de preço
                        const periodId = currentSlide.getAttribute('data-period');
                        const periodElement = document.getElementById('currentPeriod');
                        if (periodElement && periodId) {
                            const periodLabels = {
                                'morning': 'Manhã/Tarde (06h - 13:59h)',
                                'afternoon': 'Tarde/Noite (14h - 19:59h)',
                                'night': 'Noite/Madrugada (20h - 05:59h)'
                            };
                            periodElement.textContent = periodLabels[periodId] || 'Período atual';
                        }
                    }
                });
            }
        });

        // Inicializar slider de regras
        const rulesTrack = document.querySelector('.rules-track');
        if (rulesTrack) {
            // Criar indicadores dinâmicos para as regras
            const rulesSlider = document.querySelector('.rules-slider');
            const ruleCards = rulesTrack.querySelectorAll('.rule-card');
            const indicatorsContainer = rulesSlider.querySelector('.rule-indicators');
            
            // Limpar indicadores existentes e adicionar novos baseados no número de cards
            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = '';
                ruleCards.forEach((_, index) => {
                    const indicator = document.createElement('span');
                    indicator.className = 'indicator';
                    indicator.setAttribute('data-slide', index.toString());
                    indicator.setAttribute('aria-label', `Regra ${index + 1}`);
                    indicatorsContainer.appendChild(indicator);
                });
            }

            // Criar o slider das regras
            createSlider('.rules-track', {
                slideSelector: '.rule-card',
                prevButtonSelector: '.rule-prev',
                nextButtonSelector: '.rule-next',
                indicatorsContainerSelector: '.rule-indicators',
                indicatorSelector: '.indicator',
                autoplay: true,
                autoplayInterval: 8000
            });
        }

        // Inicializar gallery slider (na seção "Quem Somos")
        const galleryTrack = document.querySelector('.gallery-track');
        if (galleryTrack) {
            createSlider('.gallery-track', {
                slideSelector: '.gallery-item',
                prevButtonSelector: '.gallery-prev',
                nextButtonSelector: '.gallery-next',
                indicatorsContainerSelector: '.gallery-indicators',
                indicatorSelector: '.indicator',
                onSlideChange: (currentIndex, prevIndex, currentSlide) => {
                    // Garantir que a caption seja acessível para leitores de tela
                    const caption = currentSlide.querySelector('.gallery-caption');
                    if (caption) {
                        const galleryWrapper = document.querySelector('.gallery-wrapper');
                        if (galleryWrapper) {
                            galleryWrapper.setAttribute('aria-label', caption.textContent);
                        }
                    }
                }
            });
        }

        // Inicializar carrossel de eventos
        const eventsTrack = document.querySelector('.carousel-track');
        if (eventsTrack) {
            // Criar indicadores dinâmicos para eventos
            const carouselContainer = document.querySelector('.events-carousel');
            const eventCards = eventsTrack.querySelectorAll('.event-card');
            const indicatorsContainer = carouselContainer.querySelector('.carousel-indicators');
            
            // Limpar indicadores existentes e adicionar novos baseados no número de cards
            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = '';
                eventCards.forEach((_, index) => {
                    const indicator = document.createElement('span');
                    indicator.className = 'indicator';
                    indicator.setAttribute('data-slide', index.toString());
                    indicator.setAttribute('aria-label', `Evento ${index + 1}`);
                    indicatorsContainer.appendChild(indicator);
                });
            }

            createSlider('.carousel-track', {
                slideSelector: '.event-card',
                prevButtonSelector: '.carousel-prev',
                nextButtonSelector: '.carousel-next',
                indicatorsContainerSelector: '.carousel-indicators',
                indicatorSelector: '.indicator',
                autoplay: true,
                autoplayInterval: 6000
            });
        }
    }

    /**
     * Determina automaticamente o período atual com base na hora do dia
     * e seleciona o slide apropriado nas tabelas de preço
     */
    function selectCurrentTimePeriod() {
        const now = new Date();
        const hour = now.getHours();
        let periodId;

        // Determinar período baseado na hora atual
        if (hour >= 6 && hour < 14) {
            periodId = 'morning';
        } else if (hour >= 14 && hour < 20) {
            periodId = 'afternoon';
        } else {
            periodId = 'night';
        }

        // Selecionar o slide correspondente ao período atual no tab ativo
        const activeTabContent = document.querySelector('.price-tab-content.active');
        if (activeTabContent) {
            const track = activeTabContent.querySelector('.slider-track');
            if (track) {
                const trackId = track.id;
                const slider = getSlider(`#${trackId}`);
                
                if (slider) {
                    // Encontrar o índice do slide com o período atual
                    const periodSlideIndex = slider.slides.findIndex(
                        slide => slide.getAttribute('data-period') === periodId
                    );
                    
                    if (periodSlideIndex !== -1) {
                        slider.goToSlide(periodSlideIndex);
                    }
                }
            }
        }
    }

    /**
     * Adapta automaticamente o comportamento dos sliders em dispositivos móveis
     * para melhorar a experiência do usuário
     */
    function optimizeForMobile() {
        // Verifica se o dispositivo é um smartphone
        const isMobile = window.innerWidth < 768;
        
        // Para cada slider, ajusta configurações específicas para mobile
        sliderInstances.forEach((slider) => {
            // Em dispositivos móveis, podemos querer:
            // - Desabilitar autoplay (mais controle para o usuário)
            // - Ajustar thresholds de swipe (mais sensível)
            if (isMobile) {
                // Exemplo: desligar autoplay em dispositivos móveis
                slider.stopAutoplay();
                slider.options.autoplay = false;
                
                // Mais ajustes específicos para mobile podem ser feitos aqui
            }
        });
    }

    // Expor API pública
    window.DedalosSliders = {
        create: createSlider,
        get: getSlider,
        init: initializeDefaultSliders,
        selectCurrentTimePeriod: selectCurrentTimePeriod
    };

    // Inicializar sliders quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', () => {
        initializeDefaultSliders();
        selectCurrentTimePeriod();
        
        // Otimizar para mobile
        optimizeForMobile();
        window.addEventListener('resize', optimizeForMobile);
        
        // Rastrear mudanças de abas de preço para atualizar o slider correspondente
        const priceTabs = document.querySelectorAll('[data-tab]');
        priceTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Dá tempo para a nova aba ser ativada
                setTimeout(selectCurrentTimePeriod, 100);
            });
        });
    });
})();

