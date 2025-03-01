/**
 * rules.js - Gerencia o slider com as regras do Dédalos Bar
 * 
 * Este módulo controla a funcionalidade do slider de regras, permitindo
 * navegação entre diferentes cards de regras com controles e indicadores.
 */

// Importações de utilitários, se necessário
import { eventBus } from '../core/event-bus.js';

class RulesSlider {
    constructor() {
        // Elementos principais do slider
        this.sliderElement = null;
        this.trackElement = null;
        this.prevButton = null;
        this.nextButton = null;
        this.indicatorsContainer = null;
        
        // Estado do slider
        this.totalSlides = 0;
        this.currentSlide = 0;
        this.touchStartX = 0;
        this.touchMoveX = 0;
        this.slideWidth = 0;
        
        // Configurações
        this.animationDuration = 300; // ms
        this.autoPlay = false;
        this.autoPlayInterval = 5000; // ms
        this.autoPlayTimer = null;
    }

    /**
     * Inicializa o slider de regras
     */
    init() {
        // Localiza os elementos no DOM
        this.sliderElement = document.querySelector('.rules-slider');
        if (!this.sliderElement) return;

        this.trackElement = this.sliderElement.querySelector('.rules-track');
        this.prevButton = this.sliderElement.querySelector('.rule-prev');
        this.nextButton = this.sliderElement.querySelector('.rule-next');
        this.indicatorsContainer = this.sliderElement.querySelector('.rule-indicators');
        
        const ruleCards = this.trackElement.querySelectorAll('.rule-card');
        this.totalSlides = ruleCards.length;
        
        // Não continuar se não houver slides
        if (this.totalSlides === 0) return;
        
        // Configurar dimensões do slider para dispositivos móveis vs desktop
        this.setupSliderDimensions();
        
        // Criar indicadores para cada regra
        this.createIndicators();
        
        // Configurar eventos
        this.setupEvents();
        
        // Ativar o primeiro slide
        this.goToSlide(0);
        
        // Iniciar autoplay se configurado
        if (this.autoPlay) {
            this.startAutoPlay();
        }
        
        // Notificar que o slider foi inicializado
        eventBus.publish('rulesSlider:initialized');
    }
    
    /**
     * Configura as dimensões do slider com base no dispositivo
     */
    setupSliderDimensions() {
        // Determinar quantos slides mostrar por vez com base na largura da tela
        const isMobile = window.innerWidth < 768;
        const slidesToShow = isMobile ? 1 : 3;
        
        // Ajustar largura do container para mostrar o número adequado de slides
        const containerWidth = this.sliderElement.clientWidth;
        this.slideWidth = containerWidth / slidesToShow;
        
        // Aplicar largura aos slides
        const ruleCards = this.trackElement.querySelectorAll('.rule-card');
        ruleCards.forEach(card => {
            card.style.width = `${this.slideWidth}px`;
            card.setAttribute('aria-hidden', 'true');
        });
        
        // Definir largura total do track
        this.trackElement.style.width = `${this.slideWidth * this.totalSlides}px`;
    }
    
    /**
     * Cria os indicadores de slides
     */
    createIndicators() {
        // Limpar indicadores existentes
        this.indicatorsContainer.innerHTML = '';
        
        // Criar um indicador para cada slide
        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('span');
            indicator.classList.add('indicator');
            indicator.setAttribute('data-slide', i);
            indicator.setAttribute('role', 'button');
            indicator.setAttribute('tabindex', '0');
            indicator.setAttribute('aria-label', `Regra ${i + 1} de ${this.totalSlides}`);
            
            // Adicionar evento de clique
            indicator.addEventListener('click', () => this.goToSlide(i));
            
            // Adicionar evento de teclado para acessibilidade
            indicator.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.goToSlide(i);
                }
            });
            
            this.indicatorsContainer.appendChild(indicator);
        }
    }
    
    /**
     * Configura os eventos do slider
     */
    setupEvents() {
        // Botões de navegação
        this.prevButton.addEventListener('click', () => this.prevSlide());
        this.nextButton.addEventListener('click', () => this.nextSlide());
        
        // Eventos de teclado nos botões para acessibilidade
        this.prevButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.prevSlide();
            }
        });
        
        this.nextButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.nextSlide();
            }
        });
        
        // Eventos de toque para dispositivos móveis
        this.trackElement.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            
            // Pausar autoplay durante o toque
            if (this.autoPlay) {
                this.stopAutoPlay();
            }
        }, { passive: true });
        
        this.trackElement.addEventListener('touchmove', (e) => {
            this.touchMoveX = e.touches[0].clientX;
            const diff = this.touchStartX - this.touchMoveX;
            
            // Aplicar um pequeno deslocamento ao track para feedback visual
            const currentTranslate = -this.currentSlide * this.slideWidth;
            const dragOffset = Math.min(Math.max(-diff, -100), 100);
            
            this.trackElement.style.transform = `translateX(${currentTranslate + dragOffset}px)`;
        }, { passive: true });
        
        this.trackElement.addEventListener('touchend', () => {
            const diff = this.touchStartX - this.touchMoveX;
            
            // Determinar se o usuário arrastou o suficiente para mudar de slide
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            } else {
                // Se não arrastou o suficiente, voltar para o slide atual
                this.goToSlide(this.currentSlide);
            }
            
            // Reiniciar autoplay se estiver configurado
            if (this.autoPlay) {
                this.startAutoPlay();
            }
        });
        
        // Ajustar dimensões ao redimensionar a janela
        window.addEventListener('resize', () => {
            this.setupSliderDimensions();
            this.goToSlide(this.currentSlide);
        });
        
        // Pausar autoplay quando o mouse estiver sobre o slider
        if (this.autoPlay) {
            this.sliderElement.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.sliderElement.addEventListener('mouseleave', () => this.startAutoPlay());
        }
    }
    
    /**
     * Navega para o slide anterior
     */
    prevSlide() {
        let targetSlide = this.currentSlide - 1;
        if (targetSlide < 0) {
            targetSlide = this.totalSlides - 1;
        }
        this.goToSlide(targetSlide);
    }
    
    /**
     * Navega para o próximo slide
     */
    nextSlide() {
        let targetSlide = this.currentSlide + 1;
        if (targetSlide >= this.totalSlides) {
            targetSlide = 0;
        }
        this.goToSlide(targetSlide);
    }
    
    /**
     * Navega para um slide específico
     * @param {number} slideIndex - O índice do slide destino
     */
    goToSlide(slideIndex) {
        // Validar índice do slide
        if (slideIndex < 0 || slideIndex >= this.totalSlides) return;
        
        // Atualizar estado atual
        this.currentSlide = slideIndex;
        
        // Mover o track para mostrar o slide atual
        const translateX = -this.currentSlide * this.slideWidth;
        this.trackElement.style.transition = `transform ${this.animationDuration}ms ease`;
        this.trackElement.style.transform = `translateX(${translateX}px)`;
        
        // Atualizar os indicadores
        const indicators = this.indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            if (index === slideIndex) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            } else {
                indicator.classList.remove('active');
                indicator.removeAttribute('aria-current');
            }
        });
        
        // Atualizar estados de aria-hidden nos slides
        const slides = this.trackElement.querySelectorAll('.rule-card');
        slides.forEach((slide, index) => {
            if (index === slideIndex) {
                slide.setAttribute('aria-hidden', 'false');
            } else {
                slide.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Notificar mudança de slide
        eventBus.publish('rulesSlider:slideChanged', { slideIndex });
    }
    
    /**
     * Inicia o autoplay do slider
     */
    startAutoPlay() {
        if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);
        
        this.autoPlayTimer = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayInterval);
    }
    
    /**
     * Para o autoplay do slider
     */
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    /**
     * Reinicia o slider (útil para quando o conteúdo muda dinamicamente)
     */
    refresh() {
        this.stopAutoPlay();
        this.init();
    }
}

// Instanciar e inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const rulesSlider = new RulesSlider();
    rulesSlider.init();
    
    // Exportar para acesso global se necessário
    window.dedalosRulesSlider = rulesSlider;
});

// Exportar a classe para uso em outros módulos
export default RulesSlider;
