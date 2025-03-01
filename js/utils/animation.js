/**
 * @file animation.js
 * @description Funções utilitárias para controlar animações e transições do site Dédalos Bar
 */

/**
 * Gerenciador de animações e transições
 */
const Animation = (function() {
    'use strict';

    /**
     * Aplica uma animação a um elemento por um tempo determinado
     * @param {HTMLElement} element - Elemento HTML a ser animado
     * @param {string} animationClass - Classe CSS da animação a ser aplicada
     * @param {number} duration - Duração da animação em milissegundos
     * @param {Function} callback - Função de callback executada após a animação
     * @returns {Promise} Promise que resolve quando a animação termina
     */
    function animate(element, animationClass, duration = 1000, callback = null) {
        return new Promise((resolve) => {
            if (!element) {
                console.warn('Elemento não encontrado para animação');
                resolve();
                return;
            }

            // Adiciona a classe de animação
            element.classList.add(animationClass);

            // Define o tempo de duração caso seja necessário
            if (duration !== 1000) {
                element.style.animationDuration = `${duration}ms`;
            }

            // Função para limpar a animação
            function cleanUp() {
                element.classList.remove(animationClass);
                element.removeEventListener('animationend', onAnimationEnd);
                
                // Restaura a duração da animação se foi alterada
                if (duration !== 1000) {
                    element.style.animationDuration = '';
                }
                
                if (typeof callback === 'function') {
                    callback();
                }
                
                resolve();
            }

            // Listener para o fim da animação
            function onAnimationEnd() {
                cleanUp();
            }

            // Aguarda o fim da animação ou usa um timeout como fallback
            element.addEventListener('animationend', onAnimationEnd);
            
            // Failsafe caso o evento animationend não dispare
            setTimeout(() => {
                if (element.classList.contains(animationClass)) {
                    cleanUp();
                }
            }, duration + 100);
        });
    }

    /**
     * Cria uma transição de fade entre elementos
     * @param {HTMLElement} currentElement - Elemento que vai desaparecer
     * @param {HTMLElement} newElement - Elemento que vai aparecer
     * @param {number} duration - Duração da transição
     * @returns {Promise} Promise que resolve quando a transição termina
     */
    async function fadeTransition(currentElement, newElement, duration = 500) {
        if (!currentElement || !newElement) {
            console.warn('Elementos inválidos para transição fade');
            return;
        }

        // Esconde o elemento atual
        await animate(currentElement, 'fade-out', duration);
        currentElement.hidden = true;
        
        // Prepara e mostra o novo elemento
        newElement.hidden = false;
        // Força o reflow antes de adicionar a classe para garantir a animação
        newElement.offsetHeight;
        await animate(newElement, 'fade-in', duration);
        
        return Promise.resolve();
    }

    /**
     * Executa a animação "lightspeed" entre telas (similar à usada na transição após verificação de idade)
     * @param {HTMLElement} element - Elemento de animação (normalmente uma div overlay)
     * @param {Function} callback - Função executada no meio da animação (quando estiver em tela cheia)
     * @returns {Promise} Promise que resolve ao final da animação
     */
    async function lightspeedTransition(element, callback = null) {
        if (!element) {
            console.warn('Elemento de transição lightspeed não encontrado');
            return Promise.resolve();
        }
        
        // Prepara a animação
        element.hidden = false;
        
        // Anima a entrada
        await animate(element, 'lightspeed-in', 1000);
        
        // Executa qualquer callback no meio da transição (momento ideal para trocar conteúdo)
        if (typeof callback === 'function') {
            await callback();
        }
        
        // Anima a saída
        await animate(element, 'lightspeed-out', 1000);
        
        // Esconde o elemento no final
        element.hidden = true;
        
        return Promise.resolve();
    }

    /**
     * Anima elementos quando entram no viewport (scroll)
     * @param {string} selector - Seletor CSS dos elementos a serem animados
     * @param {string} animationClass - Classe de animação a ser aplicada
     * @param {Object} options - Opções do Intersection Observer
     * @returns {IntersectionObserver} Instância do observer (pode ser usado para desconectar depois)
     */
    function animateOnScroll(selector, animationClass, options = {}) {
        const elements = document.querySelectorAll(selector);
        
        if (!elements.length) {
            console.warn(`Nenhum elemento encontrado para o seletor: ${selector}`);
            return null;
        }
        
        const defaultOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.2
        };
        
        const observerOptions = { ...defaultOptions, ...options };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(animationClass);
                    // Opcional: remover da observação após animar
                    // observer.unobserve(entry.target);
                } else if (options.reset) {
                    // Caso a opção reset seja true, remove a classe quando sair da viewport
                    entry.target.classList.remove(animationClass);
                }
            });
        }, observerOptions);
        
        elements.forEach(element => observer.observe(element));
        
        return observer;
    }

    /**
     * Cria efeito de morphing entre dois elementos
     * @param {HTMLElement} fromElement - Elemento original
     * @param {HTMLElement} toElement - Elemento final
     * @param {number} duration - Duração da animação
     * @returns {Promise} Promise que resolve quando a animação termina
     */
    async function morphElements(fromElement, toElement, duration = 800) {
        if (!fromElement || !toElement) {
            console.warn('Elementos inválidos para morph');
            return Promise.resolve();
        }
        
        // Guarda as dimensões e posições originais
        const fromRect = fromElement.getBoundingClientRect();
        
        // Torna o elemento destino visível mas transparente
        toElement.hidden = false;
        toElement.style.opacity = '0';
        
        // Força um reflow
        toElement.offsetHeight;
        
        // Guarda as dimensões do elemento final
        const toRect = toElement.getBoundingClientRect();
        
        // Configura a transição
        toElement.style.transition = `opacity ${duration}ms ease-in-out`;
        toElement.style.opacity = '1';
        
        // Anima o elemento original para "imitar" o morph
        fromElement.style.transition = `
            transform ${duration}ms ease-in-out,
            opacity ${duration}ms ease-in-out
        `;
        
        // Calcula e aplica a transformação
        const scaleX = toRect.width / fromRect.width;
        const scaleY = toRect.height / fromRect.height;
        const translateX = toRect.left - fromRect.left;
        const translateY = toRect.top - fromRect.top;
        
        fromElement.style.transform = `
            translate(${translateX}px, ${translateY}px) 
            scale(${scaleX}, ${scaleY})
        `;
        fromElement.style.opacity = '0';
        
        // Aguarda o final da animação
        return new Promise(resolve => {
            setTimeout(() => {
                // Limpa os estilos
                fromElement.style.transition = '';
                fromElement.style.transform = '';
                fromElement.hidden = true;
                toElement.style.transition = '';
                
                resolve();
            }, duration);
        });
    }

    /**
     * Configura uma animação que reage ao movimento do mouse (para uso com multichrome)
     * @param {HTMLElement} element - Elemento que seguirá o mouse
     * @param {number} intensity - Intensidade do movimento (1-10)
     * @param {number} delay - Atraso na resposta para efeito mais suave
     */
    function setupMouseFollowAnimation(element, intensity = 5, delay = 50) {
        if (!element) {
            console.warn('Elemento não encontrado para animação de mouse');
            return;
        }
        
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;
        
        // Fator de movimento baseado na intensidade (1-10)
        const movementFactor = intensity * 0.5;
        
        // Atualiza a posição do mouse
        function updateMousePosition(e) {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Normaliza as coordenadas (-1 a 1)
            mouseX = (e.clientX - windowWidth / 2) / (windowWidth / 2);
            mouseY = (e.clientY - windowHeight / 2) / (windowHeight / 2);
        }
        
        // Atualiza a posição do elemento com suavização
        function updateElementPosition() {
            // Aplica suavização ao movimento
            currentX += (mouseX - currentX) * (delay / 1000);
            currentY += (mouseY - currentY) * (delay / 1000);
            
            // Aplica a transformação
            element.style.transform = `
                translate(${currentX * movementFactor}px, ${currentY * movementFactor}px)
            `;
            
            requestAnimationFrame(updateElementPosition);
        }
        
        // Configura os event listeners
        document.addEventListener('mousemove', updateMousePosition);
        
        // Inicia a animação
        updateElementPosition();
        
        // Retorna função para remover os event listeners se necessário
        return function cleanup() {
            document.removeEventListener('mousemove', updateMousePosition);
        };
    }

    /**
     * Cria uma animação de pulsação
     * @param {HTMLElement} element - Elemento a ser animado
     * @param {number} interval - Intervalo entre pulsações em ms
     * @param {number} scale - Escala máxima durante a pulsação
     * @returns {Object} Controlador da animação com métodos start e stop
     */
    function createPulseAnimation(element, interval = 2000, scale = 1.05) {
        if (!element) {
            console.warn('Elemento não encontrado para animação de pulso');
            return { start: () => {}, stop: () => {} };
        }
        
        let animationId;
        let active = false;
        
        function pulse() {
            if (!active) return;
            
            // Aplica a pulsação
            element.style.transition = `transform ${interval/2}ms ease-in-out`;
            element.style.transform = `scale(${scale})`;
            
            // Reverte à escala original
            setTimeout(() => {
                if (!active) return;
                element.style.transform = 'scale(1)';
            }, interval / 2);
            
            // Agenda a próxima pulsação
            animationId = setTimeout(pulse, interval);
        }
        
        return {
            start: function() {
                if (active) return;
                active = true;
                pulse();
            },
            stop: function() {
                active = false;
                clearTimeout(animationId);
                element.style.transition = '';
                element.style.transform = '';
            }
        };
    }

    // API pública
    return {
        animate,
        fadeTransition,
        lightspeedTransition,
        animateOnScroll,
        morphElements,
        setupMouseFollowAnimation,
        createPulseAnimation
    };
})();

// Exporta o módulo
export default Animation;
