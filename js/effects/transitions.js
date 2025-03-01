/**
 * Dédalos Bar - Sistema de Transições
 * 
 * Este módulo gerencia todas as transições entre diferentes seções/telas do site,
 * incluindo efeitos visuais avançados como o efeito de velocidade da luz.
 */

// Importa utilitários e configurações necessárias
const Transitions = (function() {
    // Referências para elementos DOM utilizados frequentemente
    const elements = {
        splashScreen: document.getElementById('splashScreen'),
        ageVerificationModal: document.getElementById('ageVerificationModal'),
        lightspeedAnimation: document.getElementById('lightspeedAnimation'),
        mainContent: document.getElementById('mainContent')
    };

    // Duração das diferentes transições em ms
    const durations = {
        fade: 800,
        lightspeed: 1200,
        reveal: 1000,
        section: 600
    };

    // Estado interno
    const state = {
        isTransitioning: false,
        activeSection: null,
        history: []
    };

    /**
     * Inicia a transição da tela de splash para a verificação de idade
     */
    function fromSplashToAgeVerification() {
        if (state.isTransitioning) return;
        state.isTransitioning = true;

        // Fade out da tela de splash
        elements.splashScreen.classList.add('fade-out');
        
        setTimeout(() => {
            // Esconde a splash screen
            elements.splashScreen.setAttribute('hidden', '');
            // Mostra a verificação de idade
            elements.ageVerificationModal.removeAttribute('hidden');
            elements.ageVerificationModal.classList.add('fade-in');
            
            // Registra no histórico
            state.history.push('splash-to-age');
            state.isTransitioning = false;
            
            // Publica evento para outros módulos
            if (window.EventBus) {
                EventBus.publish('transition:completed', { 
                    from: 'splash', 
                    to: 'age-verification' 
                });
            }
        }, durations.fade);
    }

    /**
     * Gerencia a transição da verificação de idade para o conteúdo principal com efeito lightspeed
     */
    function fromAgeVerificationToMain() {
        if (state.isTransitioning) return;
        state.isTransitioning = true;

        // Fade out no modal de verificação
        elements.ageVerificationModal.classList.remove('fade-in');
        elements.ageVerificationModal.classList.add('fade-out');
        
        setTimeout(() => {
            // Esconde a verificação de idade
            elements.ageVerificationModal.setAttribute('hidden', '');
            
            // Ativa o efeito lightspeed
            elements.lightspeedAnimation.classList.add('active');
            
            setTimeout(() => {
                // Prepara o conteúdo principal enquanto a animação lightspeed está no auge
                elements.mainContent.removeAttribute('hidden');
                elements.mainContent.style.opacity = '0';
                
                setTimeout(() => {
                    // Finaliza o efeito lightspeed
                    elements.lightspeedAnimation.classList.remove('active');
                    // Revela o conteúdo principal
                    elements.mainContent.style.opacity = '1';
                    elements.mainContent.classList.add('reveal');
                    
                    // Atualiza o estado
                    state.history.push('age-to-main');
                    state.isTransitioning = false;
                    
                    // Publica evento para outros módulos
                    if (window.EventBus) {
                        EventBus.publish('transition:completed', { 
                            from: 'age-verification', 
                            to: 'main-content',
                            effect: 'lightspeed'
                        });
                    }
                }, durations.lightspeed / 2);
            }, durations.lightspeed / 2);
        }, durations.fade);
    }

    /**
     * Navega suavemente entre seções dentro do conteúdo principal
     * @param {string} targetSectionId - ID da seção alvo
     * @param {boolean} updateUrl - Se deve atualizar a URL com hash
     */
    function navigateToSection(targetSectionId, updateUrl = true) {
        if (state.isTransitioning || !targetSectionId) return;
        
        const targetSection = document.getElementById(targetSectionId);
        if (!targetSection) return;
        
        state.isTransitioning = true;

        // Atualiza URL se necessário
        if (updateUrl && history.pushState) {
            history.pushState(null, null, `#${targetSectionId}`);
        }

        // Efeito de fade entre seções se necessário
        if (state.activeSection && state.activeSection !== targetSectionId) {
            const currentSection = document.getElementById(state.activeSection);
            if (currentSection) {
                currentSection.classList.add('section-fade-out');
                
                setTimeout(() => {
                    currentSection.classList.remove('section-fade-out', 'section-active');
                    targetSection.classList.add('section-fade-in', 'section-active');
                    
                    setTimeout(() => {
                        targetSection.classList.remove('section-fade-in');
                        scrollToSection(targetSectionId);
                        
                        state.activeSection = targetSectionId;
                        state.isTransitioning = false;
                        
                        // Publica evento para outros módulos
                        if (window.EventBus) {
                            EventBus.publish('section:changed', { 
                                previous: state.activeSection,
                                current: targetSectionId
                            });
                        }
                    }, durations.section);
                }, durations.section);
            }
        } else {
            // Primeira navegação ou reload
            targetSection.classList.add('section-active');
            scrollToSection(targetSectionId);
            
            state.activeSection = targetSectionId;
            state.isTransitioning = false;
            
            // Publica evento para outros módulos
            if (window.EventBus) {
                EventBus.publish('section:changed', { 
                    previous: null,
                    current: targetSectionId
                });
            }
        }
    }

    /**
     * Aplica efeito de multichrome durante as transições
     * @param {string} intensity - Intensidade do efeito ('low', 'medium', 'high')
     */
    function applyMultichromeEffect(intensity = 'medium') {
        const multichromeBg = document.querySelector('.multichrome-background');
        if (!multichromeBg) return;
        
        // Remove classes existentes
        multichromeBg.classList.remove('effect-low', 'effect-medium', 'effect-high');
        
        // Adiciona a classe de intensidade
        multichromeBg.classList.add(`effect-${intensity}`);
        
        // Anima os elementos flutuantes
        const floatingElements = multichromeBg.querySelectorAll('[class*="float-effect"]');
        floatingElements.forEach(el => {
            el.classList.add('animate');
            
            setTimeout(() => {
                el.classList.remove('animate');
            }, durations.lightspeed);
        });
    }

    /**
     * Rola a página até a seção especificada
     * @param {string} sectionId - ID da seção alvo
     */
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        const navHeight = document.querySelector('.main-header')?.offsetHeight || 0;
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        
        window.scrollTo({
            top: sectionTop - navHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Configura os listeners de eventos
     */
    function setupEventListeners() {
        // Evento de clique na splash screen
        if (elements.splashScreen) {
            elements.splashScreen.addEventListener('click', fromSplashToAgeVerification);
        }
        
        // Evento para botão "SIM" na verificação de idade
        const btnYes = document.getElementById('btnYes');
        if (btnYes) {
            btnYes.addEventListener('click', fromAgeVerificationToMain);
        }
        
        // Eventos de navegação interna
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                if (targetId) {
                    navigateToSection(targetId);
                }
            });
        });
        
        // Integração com Event Bus
        if (window.EventBus) {
            EventBus.subscribe('age:verified', () => {
                fromAgeVerificationToMain();
            });
            
            EventBus.subscribe('splash:skip', () => {
                fromSplashToAgeVerification();
            });
        }
    }

    /**
     * Inicializa o sistema de transições
     */
    function init() {
        setupEventListeners();
        
        // Detecta se estamos chegando com um hash na URL
        if (window.location.hash) {
            const sectionId = window.location.hash.substring(1);
            // Delay para garantir que o DOM está pronto
            setTimeout(() => {
                navigateToSection(sectionId, false);
            }, 100);
        } else {
            // Define a seção padrão como ativa
            state.activeSection = 'hero';
        }
        
        // Publica evento de inicialização
        if (window.EventBus) {
            EventBus.publish('transitions:initialized');
        }
    }

    // API pública
    return {
        init,
        navigateToSection,
        fromSplashToAgeVerification,
        fromAgeVerificationToMain,
        applyMultichromeEffect
    };
})();

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    if (window.EventBus) {
        EventBus.subscribe('init:ready', Transitions.init);
    } else {
        // Fallback se event bus não estiver disponível
        Transitions.init();
    }
});
