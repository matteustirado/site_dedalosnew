
/**
 * Dédalos Bar - Efeito Radial Simples
 * 
 * Este script implementa um efeito de luz radial que reage ao movimento do mouse,
 * criando um brilho dinâmico no centro da tela por trás da frase de impacto.
 */

// IIFE para evitar poluição do escopo global
(function() {
    // Referências aos elementos DOM
    const radial = {
        container: null,
        light: null
    };

    // Configurações de cores e animação
    const config = {
        // Cores baseadas na nova paleta com opacidade reduzida
        colors: {
            primaryLight: 'rgba(245, 166, 35, 0.4)',     // Laranja Vibrante (opacidade reduzida)
            secondaryLight: 'rgba(247, 107, 28, 0.3)',   // Laranja Incandescente (opacidade reduzida)
            background: 'rgba(10, 10, 15, 0.9)',         // Cinza Profundo
        },
        // Sensibilidade do movimento
        mouse: {
            sensitivity: 0.05,         // Sensibilidade reduzida para movimento mais suave
            inertia: 0.1,              // Inércia para suavizar movimento
            maxDistance: 100           // Distância máxima de efeito
        },
        // Animação autônoma suave (quando não há interação)
        autonomous: {
            enabled: true,
            speed: 0.003,              // Velocidade reduzida para pulso suave
            amplitude: 15              // Amplitude menor para efeito sutil
        }
    };

    // Estado atual da animação
    const state = {
        mouseX: 0,
        mouseY: 0,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
        angle: 0,
        isMoving: false,
        lastMoveTime: 0,
        timeoutId: null
    };

    /**
     * Inicializa o efeito radial
     */
    function init() {
        // Obter referências aos elementos
        radial.container = document.querySelector('.multichrome-background');
        
        // Se não existir o container, não continuar
        if (!radial.container) {
            console.warn('Multichrome container não encontrado');
            return;
        }
        
        radial.light = radial.container.querySelector('.multichrome-light');

        // Se não existir a luz, criar o elemento
        if (!radial.light) {
            radial.light = document.createElement('div');
            radial.light.className = 'multichrome-light';
            radial.container.appendChild(radial.light);
        }

        // Aplicar estilo inicial à luz - tamanho aumentado para 800px
        radial.light.style.position = 'absolute';
        radial.light.style.top = '50%';
        radial.light.style.left = '50%';
        radial.light.style.transform = 'translate(-50%, -50%)';
        radial.light.style.width = '800px';  // Aumentado de 500px para 800px
        radial.light.style.height = '800px'; // Aumentado de 500px para 800px
        radial.light.style.borderRadius = '50%';
        radial.light.style.pointerEvents = 'none';
        
        // Configurar evento do mouse
        document.addEventListener('mousemove', handleMouseMove);
        
        // Configurar evento de toque para dispositivos móveis
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        
        // Iniciar a animação
        window.requestAnimationFrame(animate);
        
        // Iniciar timeout para animação autônoma após inatividade
        startInactivityTimeout();
        
        // Posicionar a luz inicialmente no centro
        centerLight();
        
        // Aplicar gradiente inicial
        updateLightGradient(0, 0);
    }

    /**
     * Centraliza a luz na tela
     */
    function centerLight() {
        state.targetX = 0;
        state.targetY = 0;
        state.currentX = 0;
        state.currentY = 0;
        
        if (radial.light) {
            radial.light.style.transform = 'translate(-50%, -50%)';
            updateLightGradient(0, 0);
        }
    }

    /**
     * Atualiza o gradiente da luz com base na posição
     */
    function updateLightGradient(x, y) {
        if (!radial.light) return;
        
        // Calcular intensidade baseada na distância do centro
        const distance = Math.sqrt(x * x + y * y);
        const intensity = Math.max(0.4, 1 - distance / config.mouse.maxDistance / 2);
        
        // Aplicar gradiente radial com transição muito mais suave
        radial.light.style.background = `
            radial-gradient(
                circle at ${50 + x/5}% ${50 + y/5}%, 
                ${config.colors.primaryLight} 10%, 
                ${config.colors.secondaryLight} 50%, 
                rgba(247, 107, 28, 0.1) 75%,
                transparent 95%
            )
        `;
        
        // Ajustar o tamanho com base na intensidade - base ainda maior (800px)
        const size = 800 + (distance * 0.5);
        radial.light.style.width = `${size}px`;
        radial.light.style.height = `${size}px`;
        
        // Adicionar um sutil box-shadow mais esfumaçado para efeito de brilho
        // Aumentei o valor do blur de 60 para 90 e reduzi ainda mais a opacidade
        radial.light.style.boxShadow = `0 0 ${90 * intensity}px rgba(245, 166, 35, ${intensity * 0.25})`;
    }

    /**
     * Manipula o movimento do mouse
     * @param {MouseEvent} event - O evento de movimento do mouse
     */
    function handleMouseMove(event) {
        // Calcular a posição relativa do mouse (centro = 0,0)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        state.targetX = (event.clientX - centerX) * config.mouse.sensitivity;
        state.targetY = (event.clientY - centerY) * config.mouse.sensitivity;
        
        // Limitar a distância máxima
        const distance = Math.sqrt(state.targetX * state.targetX + state.targetY * state.targetY);
        if (distance > config.mouse.maxDistance) {
            const scale = config.mouse.maxDistance / distance;
            state.targetX *= scale;
            state.targetY *= scale;
        }
        
        state.isMoving = true;
        state.lastMoveTime = Date.now();
        
        // Reiniciar o timeout de inatividade
        clearTimeout(state.timeoutId);
        startInactivityTimeout();
    }

    /**
     * Manipula evento de toque para dispositivos móveis
     * @param {TouchEvent} event - O evento de toque
     */
    function handleTouchStart(event) {
        if (event.target.closest('.multichrome-background')) {
            event.preventDefault();
        }
        clearTimeout(state.timeoutId);
        startInactivityTimeout();
    }

    /**
     * Manipula movimento de toque
     * @param {TouchEvent} event - O evento de movimento de toque
     */
    function handleTouchMove(event) {
        if (!event.target.closest('.multichrome-background')) {
            return;
        }
        
        event.preventDefault();
        
        const touch = event.touches[0];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        state.targetX = (touch.clientX - centerX) * config.mouse.sensitivity;
        state.targetY = (touch.clientY - centerY) * config.mouse.sensitivity;
        
        const distance = Math.sqrt(state.targetX * state.targetX + state.targetY * state.targetY);
        if (distance > config.mouse.maxDistance) {
            const scale = config.mouse.maxDistance / distance;
            state.targetX *= scale;
            state.targetY *= scale;
        }
        
        state.isMoving = true;
        state.lastMoveTime = Date.now();
        
        clearTimeout(state.timeoutId);
        startInactivityTimeout();
    }

    /**
     * Inicia o timeout de inatividade
     * Após um período sem movimentos, inicia o movimento autônomo
     */
    function startInactivityTimeout() {
        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
        }
        
        state.timeoutId = setTimeout(() => {
            state.isMoving = false;
            startAutonomousMovement();
        }, 3000); // 3 segundos sem movimento para iniciar o modo autônomo
    }

    /**
     * Inicia um movimento autônomo suave de "respiração"
     */
    function startAutonomousMovement() {
        if (!config.autonomous.enabled) return;
        state.angle = 0;
    }

    /**
     * Função de animação principal
     * Executa a cada frame para atualizar a posição da luz
     */
    function animate() {
        if (state.isMoving) {
            // Aplicar inércia ao movimento para suavidade
            state.currentX += (state.targetX - state.currentX) * config.mouse.inertia;
            state.currentY += (state.targetY - state.currentY) * config.mouse.inertia;
        } else if (config.autonomous.enabled) {
            // Movimento autônomo suave de "respiração"
            state.angle += config.autonomous.speed;
            const pulse = Math.sin(state.angle) * config.autonomous.amplitude;
            state.currentX = pulse * 0.5;
            state.currentY = pulse * 0.5;
        }
        
        // Atualizar o gradiente baseado na posição atual
        updateLightGradient(state.currentX, state.currentY);
        
        // Solicitar próxima animação
        window.requestAnimationFrame(animate);
    }

    // Inicializar quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Exportar funções úteis para uso externo (opcional)
    window.radialEffect = {
        adjustIntensity: function(intensity) {
            if (radial.light) {
                const value = Math.max(0.2, Math.min(1, intensity));
                radial.light.style.opacity = value;
            }
        }
    };
})();
