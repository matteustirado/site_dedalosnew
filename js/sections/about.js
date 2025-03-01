/**
 * Dédalos Bar - Seção "Quem Somos"
 * Implementa a funcionalidade da seção de apresentação do bar
 * incluindo a galeria de imagens e cards de recursos
 */

// Importa utilitários
import { $, $$, onDocumentReady } from '../utils/dom.js';
import { EventBus } from '../core/event-bus.js';

class AboutSection {
    constructor() {
        // Elementos da galeria
        this.gallery = $('.about-gallery .gallery-wrapper');
        this.galleryTrack = $('.gallery-track');
        this.galleryItems = $$('.gallery-item');
        this.indicators = $$('.gallery-indicators .indicator');
        this.prevButton = $('.gallery-prev');
        this.nextButton = $('.gallery-next');
        
        // Estado da galeria
        this.currentSlide = 0;
        this.slideCount = this.galleryItems.length;
        this.isAnimating = false;
        
        // Elementos de features
        this.featureCards = $$('.feature');
        
        this.initialize();
    }
    
    initialize() {
        // Inicializa a galeria
        this.setupGallery();
        
        // Inicializa as animações dos cards de features
        this.setupFeatureCards();
        
        // Subscreve aos eventos relevantes
        this.subscribeToEvents();
        
        // Inicia com o primeiro slide ativo
        this.goToSlide(0);
        
        // Log para depuração
        console.log('About section initialized');
    }
    
    setupGallery() {
        // Configura botões de navegação
        this.prevButton.addEventListener('click', () => this.prevSlide());
        this.nextButton.addEventListener('click', () => this.nextSlide());
        
        // Configura indicadores
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Configura swipe para mobile (touch)
        this.setupSwipeGestures();
        
        // Pausa a galeria quando o mouse estiver sobre ela
        this.gallery.addEventListener('mouseenter', () => this.pauseAutoplay());
        this.gallery.addEventListener('mouseleave', () => this.resumeAutoplay());
        
        // Inicia a troca automática de slides
        this.startAutoplay();
    }
    
    setupFeatureCards() {
        // Adiciona animação de entrada aos cards de features
        this.featureCards.forEach((card, index) => {
            // Delay crescente para cada card
            const delay = 100 + (index * 150);
            
            // Configura animação de entrada com observador de interseção
            this.setupFeatureAnimation(card, delay);
        });
    }
    
    setupFeatureAnimation(card, delay) {
        // Observador de interseção para animar quando o elemento estiver visível
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        card.classList.add('feature-visible');
                    }, delay);
                    observer.unobserve(card);
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(card);
    }
    
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.gallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.gallery.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        
        if (startX - endX > swipeThreshold) {
            // Swipe para a esquerda, vai para o próximo slide
            this.nextSlide();
        } else if (endX - startX > swipeThreshold) {
            // Swipe para a direita, vai para o slide anterior
            this.prevSlide();
        }
    }
    
    prevSlide() {
        if (this.isAnimating) return;
        
        const newIndex = (this.currentSlide - 1 + this.slideCount) % this.slideCount;
        this.goToSlide(newIndex);
    }
    
    nextSlide() {
        if (this.isAnimating) return;
        
        const newIndex = (this.currentSlide + 1) % this.slideCount;
        this.goToSlide(newIndex);
    }
    
    goToSlide(index) {
        if (this.isAnimating || index === this.currentSlide) return;
        
        this.isAnimating = true;
        
        // Remove a classe ativa do slide e indicador atual
        this.galleryItems[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');
        
        // Adiciona a classe ativa ao novo slide e indicador
        this.galleryItems[index].classList.add('active');
        this.indicators[index].classList.add('active');
        
        // Atualiza o slide atual
        this.currentSlide = index;
        
        // Transforma o track para mostrar o slide atual
        const translateValue = -index * 100;
        this.galleryTrack.style.transform = `translateX(${translateValue}%)`;
        
        // Anuncia a mudança para leitores de tela
        this.announceSlideChange();
        
        // Após a transição, desativa o flag de animação
        setTimeout(() => {
            this.isAnimating = false;
        }, 500); // Duração da transição
    }
    
    announceSlideChange() {
        // Busca a legenda do slide atual para anunciar para leitores de tela
        const caption = this.galleryItems[this.currentSlide].querySelector('.gallery-caption');
        if (caption) {
            // Envia para o gerenciador de acessibilidade, se existir
            EventBus.publish('accessibility:announce', caption.textContent);
        }
    }
    
    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            if (!document.hidden) {
                this.nextSlide();
            }
        }, 5000); // Troca a cada 5 segundos
    }
    
    pauseAutoplay() {
        clearInterval(this.autoplayInterval);
    }
    
    resumeAutoplay() {
        this.startAutoplay();
    }
    
    subscribeToEvents() {
        // Escuta eventos globais relevantes
        EventBus.subscribe('tabs:activated', (tabId) => {
            // Se a aba "Quem Somos" foi ativada
            if (tabId === 'quem-somos') {
                // Reinicia o autoplay quando a aba estiver visível
                this.pauseAutoplay();
                this.resumeAutoplay();
            } else {
                // Pausa quando a aba não estiver visível
                this.pauseAutoplay();
            }
        });
        
        // Escuta mudanças de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoplay();
            } else {
                this.resumeAutoplay();
            }
        });
    }
}

// Inicializa a seção quando o documento estiver pronto
onDocumentReady(() => {
    const aboutSection = new AboutSection();
    
    // Exporta para depuração global, se necessário (remover em produção)
    window.aboutSection = aboutSection;
});

export default AboutSection;
