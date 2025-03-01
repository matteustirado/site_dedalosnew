/**
 * Lightspeed.js - Efeito de transição tipo "velocidade da luz"
 * Parte do projeto Dédalos Bar
 * 
 * Este módulo controla as animações de transição estilo "velocidade da luz"
 * que são exibidas durante a navegação entre diferentes partes do site.
 */

// Módulo de efeito lightspeed usando IIFE para encapsulamento
const LightspeedEffect = (() => {
    // Referências de elementos DOM
    let lightspeedElement = null;
    
    // Configurações e opções
    const config = {
        standardDuration: 1200, // Duração padrão da animação em ms
        fadeInDuration: 300,    // Tempo de fade in
        fadeOutDuration: 500,   // Tempo de fade out
        maxParticles: 400,      // Número máximo de partículas nas telas maiores
        minParticles: 150,      // Número mínimo de partículas nas telas menores
        particleColors: [       // Cores das partículas baseadas na paleta do site
            '#f5a623', // Laranja Vibrante
            '#f76b1c', // Laranja Incandescente
            '#ff2424', // Vermelho Neon
            '#ffffff', // Branco
            '#e68e09', // Dourado Suave
        ],
        zIndex: 9999            // z-index da camada de transição
    };
    
    // Estado interno
    let state = {
        isActive: false,
        onCompleteCallback: null,
        particles: [],
        animationId: null
    };
    
    /**
     * Inicializa o efeito de lightspeed
     */
    function init() {
        lightspeedElement = document.getElementById('lightspeedAnimation');
        
        if (!lightspeedElement) {
            console.error('Elemento de animação lightspeed não encontrado!');
            return;
        }
        
        // Configurar estilos iniciais
        Object.assign(lightspeedElement.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(10, 10, 15, 0.9)',
            zIndex: config.zIndex,
            display: 'none',
            opacity: 0,
            transition: `opacity ${config.fadeInDuration}ms ease-in`,
            overflow: 'hidden'
        });
        
        // Configurar o canvas para as partículas
        setupCanvas();
        
        // Registrar no sistema de eventos para responder à verificação de idade e outras transições
        if (typeof EventBus !== 'undefined') {
            EventBus.subscribe('ageVerificationPassed', () => {
                playAnimation(() => {
                    // Transição para o conteúdo principal após a verificação
                    const mainContent = document.getElementById('mainContent');
                    if (mainContent) {
                        mainContent.hidden = false;
                    }
                    
                    // Esconder tela de splash e verificação se existirem
                    const splashScreen = document.getElementById('splashScreen');
                    const ageVerification = document.getElementById('ageVerificationModal');
                    
                    if (splashScreen) splashScreen.style.display = 'none';
                    if (ageVerification) ageVerification.style.display = 'none';
                });
            });
        }
    }
    
    /**
     * Configura o canvas para a animação de partículas
     */
    function setupCanvas() {
        // Criar o canvas programaticamente
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        
        lightspeedElement.appendChild(canvas);
        
        // Recalcular dimensões quando o tamanho da janela muda
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            generateParticles();
        });
    }
    
    /**
     * Gera as partículas da animação baseadas na resolução da tela
     */
    function generateParticles() {
        const canvas = lightspeedElement.querySelector('canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calcular número de partículas com base no tamanho da tela
        const screenRatio = Math.min(1, window.innerWidth / 1920);
        const particleCount = Math.floor(config.minParticles + 
            (config.maxParticles - config.minParticles) * screenRatio);
        
        state.particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            state.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                z: Math.random() * 1000 + 1000, // Profundidade inicial (mais longe)
                speed: Math.random() * 5 + 5,
                size: Math.random() * 2 + 1,
                color: config.particleColors[Math.floor(Math.random() * config.particleColors.length)]
            });
        }
    }
    
    /**
     * Anima as partículas criando efeito de movimento em alta velocidade
     */
    function animateParticles() {
        const canvas = lightspeedElement.querySelector('canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Atualizar e renderizar partículas
        state.particles.forEach(particle => {
            // Reduzir a profundidade (aproximando as partículas)
            particle.z -= particle.speed * 10;
            
            // Quando uma partícula sai da tela, reposicioná-la ao fundo
            if (particle.z <= 0) {
                particle.z = 1000;
                particle.x = Math.random() * canvas.width;
                particle.y = Math.random() * canvas.height;
            }
            
            // Calcular posição projetada
            const factor = 300 / particle.z;
            const projectedX = (particle.x - centerX) * factor + centerX;
            const projectedY = (particle.y - centerY) * factor + centerY;
            
            // Calcular tamanho projetado
            const projectedSize = particle.size * factor;
            
            // Calcular opacidade baseada na profundidade
            const opacity = Math.min(1, (1000 - particle.z) / 1000);
            
            // Desenhar traço da partícula
            const tailLength = Math.min(30, 30 * (1000 - particle.z) / 1000);
            const gradient = ctx.createLinearGradient(
                projectedX, projectedY,
                projectedX - tailLength * factor, projectedY
            );
            
            gradient.addColorStop(0, `${particle.color}ff`);
            gradient.addColorStop(1, `${particle.color}00`);
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = projectedSize;
            ctx.moveTo(projectedX, projectedY);
            ctx.lineTo(projectedX - tailLength * factor, projectedY);
            ctx.stroke();
        });
        
        // Continuar a animação
        if (state.isActive) {
            state.animationId = requestAnimationFrame(animateParticles);
        }
    }
    
    /**
     * Reproduz a animação de lightspeed
     * @param {Function} onComplete - Callback a ser executado quando a animação terminar
     * @param {Object} options - Opções para personalizar a animação
     */
    function playAnimation(onComplete = null, options = {}) {
        // Combinar opções padrão com opções fornecidas
        const animOptions = {
            duration: options.duration || config.standardDuration,
            fadeIn: options.fadeIn || config.fadeInDuration,
            fadeOut: options.fadeOut || config.fadeOutDuration
        };
        
        // Evitar múltiplas animações simultâneas
        if (state.isActive) return;
        
        state.isActive = true;
        state.onCompleteCallback = onComplete;
        
        // Preparar e mostrar o elemento
        lightspeedElement.style.display = 'block';
        
        // Força um reflow para garantir que a transição seja aplicada
        void lightspeedElement.offsetWidth;
        
        // Fade in
        lightspeedElement.style.opacity = '1';
        
        // Gerar e iniciar animação de partículas
        generateParticles();
        animateParticles();
        
        // Configurar o tempo para o fade out
        setTimeout(() => {
            // Fade out
            lightspeedElement.style.opacity = '0';
            
            // Quando o fade out terminar, limpar e executar callback
            setTimeout(() => {
                cleanupAnimation();
                
                if (typeof state.onCompleteCallback === 'function') {
                    state.onCompleteCallback();
                }
            }, animOptions.fadeOut);
        }, animOptions.duration);
    }
    
    /**
     * Limpa a animação e retorna ao estado inicial
     */
    function cleanupAnimation() {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
        
        state.isActive = false;
        lightspeedElement.style.display = 'none';
    }
    
    /**
     * Interrompe a animação imediatamente se estiver em execução
     */
    function stopAnimation() {
        if (!state.isActive) return;
        
        lightspeedElement.style.opacity = '0';
        
        setTimeout(() => {
            cleanupAnimation();
        }, config.fadeOutDuration);
    }
    
    // API pública
    return {
        init,
        play: playAnimation,
        stop: stopAnimation
    };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    LightspeedEffect.init();
});

// Exportar para acesso global
window.LightspeedEffect = LightspeedEffect;
