/**
 * Easter Eggs - Surpresas escondidas pelo site
 * 
 * Este módulo contém easter eggs e surpresas para usuários descobrirem
 * enquanto navegam pelo site do Dédalos Bar.
 * 
 * @author M_tecode
 * @version 1.0.0
 */

// Importando dependências necessárias
import { EventBus } from '../core/event-bus.js';
import { DOMUtils } from '../utils/dom.js';
import { StorageUtils } from '../utils/storage.js';
import { phrases } from '../core/phrases.js';

// Constantes
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const ACHIEVEMENTS_KEY = 'dedalos_achievements';

/**
 * Classe para gerenciar os easter eggs do site
 */
class EasterEggs {
    constructor() {
        // Estado da sequência do Konami Code
        this.konamiIndex = 0;
        
        // Sequência para modo "Labirinto"
        this.labirintoSequence = [];
        
        // Contador de cliques em elementos específicos
        this.logoClicks = 0;
        this.gloryHoleClicks = 0;
        
        // Achievements desbloqueados
        this.achievements = StorageUtils.getJSON(ACHIEVEMENTS_KEY) || {};
        
        // Flag para rastreamento de movimento do mouse para o efeito "Calor"
        this.heatTrackingEnabled = false;
        this.heatPoints = [];
        
        // Registrar os listeners para os easter eggs
        this.registerEventListeners();
    }
    
    /**
     * Registra todos os event listeners para ativar easter eggs
     */
    registerEventListeners() {
        // Listener para o Konami Code
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Listener para cliques no logo
        DOMUtils.onElementReady('.main-logo img', (logoElement) => {
            logoElement.addEventListener('click', this.handleLogoClick.bind(this));
        });
        
        // Listener para sequência especial em botões
        document.addEventListener('click', this.trackButtonSequence.bind(this));
        
        // Listener para cliques quádruplos em qualquer "regra" 
        DOMUtils.onElementsReady('.rule-card', (ruleCards) => {
            ruleCards.forEach(card => {
                card.addEventListener('click', this.handleRuleCardClick.bind(this));
            });
        });
        
        // Registrar para quando o DOM estiver completamente carregado
        document.addEventListener('DOMContentLoaded', this.initializeEasterEggs.bind(this));
        
        // Ouvir eventos do EventBus para sincronização com outros componentes
        EventBus.subscribe('prices:all-tabs-clicked', this.unlockPriceNinjutsu.bind(this));
        EventBus.subscribe('faq:all-questions-opened', this.unlockCuriosityAchievement.bind(this));
    }
    
    /**
     * Inicializa easter eggs que dependem do DOM estar carregado
     */
    initializeEasterEggs() {
        // Adicionar easter egg nas seções de contato após um tempo
        setTimeout(() => {
            this.addHiddenMessageInContactForm();
        }, 3000);
        
        // Verificar se há algum conquest "pendente" para mostrar
        this.checkForPendingAchievements();
    }
    
    /**
     * Manipula eventos de tecla para detectar o Konami Code
     * @param {KeyboardEvent} event - Evento de tecla
     */
    handleKeyDown(event) {
        // Verificar se a tecla pressionada corresponde à próxima na sequência do Konami Code
        if (event.key === KONAMI_CODE[this.konamiIndex]) {
            this.konamiIndex++;
            
            // Se a sequência completa for inserida
            if (this.konamiIndex === KONAMI_CODE.length) {
                this.activateKonamiCode();
                this.konamiIndex = 0; // Resetar para permitir nova ativação
            }
        } else {
            // Resetar se a sequência for quebrada
            this.konamiIndex = 0;
        }
        
        // Sequência secreta para destaque da palavra "Dédalos" em todo o site
        if (event.ctrlKey && event.altKey && event.key === 'd') {
            this.highlightDedalosInstances();
        }
    }
    
    /**
     * Ativa o easter egg do Konami Code
     */
    activateKonamiCode() {
        console.log('🔥 Konami Code Ativado! 🔥');
        this.unlockAchievement('konami_master', 'Mestre dos Códigos', 'Você ativou o Konami Code!');
        
        // Efeito visual - sobrepor temporariamente o fundo com cores multichrome intensificadas
        const overlay = document.createElement('div');
        overlay.className = 'konami-overlay';
        overlay.innerHTML = `
            <div class="konami-message">
                <h3>🔥 MODO INSANO ATIVADO! 🔥</h3>
                <p>Todas as bebidas pela metade do preço por 10 segundos!</p>
                <div class="konami-countdown">10</div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Aplicar efeito de preços alterados
        this.applyDiscountPrices();
        
        // Countdown e remoção
        let countdown = 10;
        const countdownElement = overlay.querySelector('.konami-countdown');
        
        const interval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(interval);
                document.body.removeChild(overlay);
                this.restoreOriginalPrices();
            }
        }, 1000);
    }
    
    /**
     * Aplica desconto visual temporário em todos os preços
     */
    applyDiscountPrices() {
        const priceElements = document.querySelectorAll('.price-value');
        
        priceElements.forEach(el => {
            // Guardar preço original
            el.dataset.originalPrice = el.textContent;
            
            // Extrair valor numérico
            const priceText = el.textContent;
            const priceMatch = priceText.match(/R\$\s*(\d+),(\d+)/);
            
            if (priceMatch) {
                const reais = parseInt(priceMatch[1]);
                const centavos = priceMatch[2];
                
                // Aplicar 50% de desconto
                const newReais = Math.floor(reais / 2);
                
                // Animação de mudança
                el.innerHTML = `<span class="original-price">${el.textContent}</span>`;
                el.innerHTML += `<span class="discount-price">R$ ${newReais},${centavos}</span>`;
                el.classList.add('price-discounted');
            }
        });
    }
    
    /**
     * Restaura os preços originais após o efeito
     */
    restoreOriginalPrices() {
        const priceElements = document.querySelectorAll('.price-value');
        
        priceElements.forEach(el => {
            if (el.dataset.originalPrice) {
                el.textContent = el.dataset.originalPrice;
                el.classList.remove('price-discounted');
            }
        });
    }
    
    /**
     * Manipula cliques no logo
     * @param {MouseEvent} event - Evento de clique
     */
    handleLogoClick(event) {
        this.logoClicks++;
        
        // Após 5 cliques no logo, ativar easter egg
        if (this.logoClicks === 5) {
            this.activateLogoEasterEgg();
            this.logoClicks = 0;
        }
    }
    
    /**
     * Ativa o easter egg do logo
     */
    activateLogoEasterEgg() {
        console.log('🎮 Modo Arcade Ativado! 🎮');
        this.unlockAchievement('logo_hunter', 'Caçador de Logos', 'Você descobriu um segredo no logo!');
        
        // Criar um mini-jogo temporário
        const gameOverlay = document.createElement('div');
        gameOverlay.className = 'game-overlay';
        gameOverlay.innerHTML = `
            <div class="mini-game">
                <h3>DÉDALOS ARCADE</h3>
                <div class="game-area">
                    <div class="game-character"></div>
                    <div class="game-exit"></div>
                </div>
                <p>Use as setas para navegar pelo labirinto. Esc para sair.</p>
            </div>
        `;
        document.body.appendChild(gameOverlay);
        
        // Lógica simplificada do mini-jogo
        const gameArea = gameOverlay.querySelector('.game-area');
        const character = gameOverlay.querySelector('.game-character');
        let characterPos = { x: 10, y: 10 };
        
        // Posicionar o personagem
        character.style.left = `${characterPos.x}px`;
        character.style.top = `${characterPos.y}px`;
        
        // Handler para movimentação 
        const gameKeyHandler = (e) => {
            const step = 10;
            
            if (e.key === 'ArrowUp') {
                characterPos.y = Math.max(0, characterPos.y - step);
            } else if (e.key === 'ArrowDown') {
                characterPos.y = Math.min(gameArea.clientHeight - character.clientHeight, characterPos.y + step);
            } else if (e.key === 'ArrowLeft') {
                characterPos.x = Math.max(0, characterPos.x - step);
            } else if (e.key === 'ArrowRight') {
                characterPos.x = Math.min(gameArea.clientWidth - character.clientWidth, characterPos.x + step);
            } else if (e.key === 'Escape') {
                // Fechar o jogo
                document.body.removeChild(gameOverlay);
                document.removeEventListener('keydown', gameKeyHandler);
                return;
            }
            
            // Atualizar posição
            character.style.left = `${characterPos.x}px`;
            character.style.top = `${characterPos.y}px`;
            
            // Verificar se chegou na saída
            const exit = gameOverlay.querySelector('.game-exit');
            const exitRect = exit.getBoundingClientRect();
            const characterRect = character.getBoundingClientRect();
            
            if (
                characterRect.left < exitRect.right &&
                characterRect.right > exitRect.left &&
                characterRect.top < exitRect.bottom &&
                characterRect.bottom > exitRect.top
            ) {
                // Ganhou o jogo!
                this.unlockAchievement('arcade_master', 'Mestre do Arcade', 'Você venceu o mini-jogo secreto!');
                document.body.removeChild(gameOverlay);
                document.removeEventListener('keydown', gameKeyHandler);
                
                // Dar cupom de desconto fictício
                this.showCouponCode();
            }
        };
        
        document.addEventListener('keydown', gameKeyHandler);
    }
    
    /**
     * Mostra um código de cupom fictício como recompensa
     */
    showCouponCode() {
        const couponOverlay = document.createElement('div');
        couponOverlay.className = 'coupon-overlay';
        
        // Gerar código aleatório para o cupom
        const couponCode = `DEDALOS${Math.floor(Math.random() * 9000 + 1000)}`;
        
        couponOverlay.innerHTML = `
            <div class="coupon-container">
                <h3>🏆 VOCÊ GANHOU!</h3>
                <p>Apresente este código no bar para ganhar uma surpresa:</p>
                <div class="coupon-code">${couponCode}</div>
                <button class="btn-close-coupon">Fechar</button>
            </div>
        `;
        document.body.appendChild(couponOverlay);
        
        // Fechar ao clicar no botão
        couponOverlay.querySelector('.btn-close-coupon').addEventListener('click', () => {
            document.body.removeChild(couponOverlay);
        });
    }
    
    /**
     * Acompanha sequência de cliques em botões
     * @param {MouseEvent} event - Evento de clique
     */
    trackButtonSequence(event) {
        if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
            const button = event.target.tagName === 'BUTTON' ? event.target : event.target.closest('button');
            
            // Adicionar ao início da sequência e manter apenas os últimos 5 cliques
            this.labirintoSequence.unshift(button.textContent.trim());
            if (this.labirintoSequence.length > 5) {
                this.labirintoSequence.pop();
            }
            
            // Verificar se temos a sequência "Dédalos"
            if (this.checkDedalosSequence()) {
                this.activateLabirintoMode();
            }
        }
    }
    
    /**
     * Verifica se a sequência forma a palavra "DEDALOS"
     */
    checkDedalosSequence() {
        // Verificar se, de alguma maneira, os caracteres iniciais dos botões clicados formam "DEDALOS"
        const sequence = this.labirintoSequence.join('').toLowerCase();
        return sequence.includes('dedalos');
    }
    
    /**
     * Ativa o modo "Labirinto" - um easter egg que transforma a navegação em um labirinto
     */
    activateLabirintoMode() {
        console.log('🗺️ Modo Labirinto Ativado! 🗺️');
        this.unlockAchievement('labyrinth_walker', 'Explorador do Labirinto', 'Você descobriu o modo labirinto!');
        
        // Criar overlay do modo labirinto
        const labirintoOverlay = document.createElement('div');
        labirintoOverlay.className = 'labirinto-overlay';
        labirintoOverlay.innerHTML = `
            <div class="labirinto-message">
                <h3>🗺️ MODO LABIRINTO ATIVADO!</h3>
                <p>Agora você está no labirinto de Dédalos.</p>
                <p>Encontre o caminho para vencer ou pressione ESC para sair.</p>
            </div>
        `;
        document.body.appendChild(labirintoOverlay);
        
        // Adicionar efeito visual ao site
        document.body.classList.add('labirinto-mode');
        
        // Efeito de blur temporário nas seções não focadas
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.classList.add('labirinto-blur');
        });
        
        // Adicionar um timer para remover automaticamente após 30 segundos
        setTimeout(() => {
            this.deactivateLabirintoMode();
        }, 30000);
        
        // Adicionar listener para desativar com ESC
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.deactivateLabirintoMode();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
    }
    
    /**
     * Desativa o modo "Labirinto"
     */
    deactivateLabirintoMode() {
        // Remover overlay
        const overlay = document.querySelector('.labirinto-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        // Remover efeitos visuais
        document.body.classList.remove('labirinto-mode');
        
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.classList.remove('labirinto-blur');
        });
    }
    
    /**
     * Manipula cliques em cards de regras
     * @param {MouseEvent} event - Evento de clique
     */
    handleRuleCardClick(event) {
        const card = event.currentTarget;
        
        // Verificar se este card já tem contador
        if (!card.dataset.clickCount) {
            card.dataset.clickCount = 0;
        }
        
        // Incrementar contador
        card.dataset.clickCount = parseInt(card.dataset.clickCount) + 1;
        
        // Após 4 cliques no mesmo card, ativar easter egg
        if (parseInt(card.dataset.clickCount) === 4) {
            this.activateRuleBreaker(card);
            card.dataset.clickCount = 0;
        }
    }
    
    /**
     * Ativa o easter egg de "quebrador de regras"
     * @param {HTMLElement} card - O card de regra que foi clicado
     */
    activateRuleBreaker(card) {
        console.log('😈 Modo Rebelde Ativado! 😈');
        this.unlockAchievement('rule_breaker', 'Quebrador de Regras', 'Você descobriu como quebrar as regras!');
        
        // Efeito visual no card
        card.classList.add('rule-break-animation');
        
        // Recuperar o texto da regra
        const ruleTitle = card.querySelector('h3').textContent;
        
        // Criar overlay com mensagem divertida
        const ruleOverlay = document.createElement('div');
        ruleOverlay.className = 'rule-break-overlay';
        ruleOverlay.innerHTML = `
            <div class="rule-break-message">
                <h3>😎 REGRA QUEBRADA!</h3>
                <p>"${ruleTitle}" não se aplica a você por 5 minutos.</p>
                <p class="rule-disclaimer">* Este é apenas um easter egg por diversão! Todas as regras do Dédalos Bar DEVEM ser respeitadas na vida real.</p>
                <button class="btn-close-rule">Entendi</button>
            </div>
        `;
        document.body.appendChild(ruleOverlay);
        
        // Fechar ao clicar no botão
        ruleOverlay.querySelector('.btn-close-rule').addEventListener('click', () => {
            document.body.removeChild(ruleOverlay);
            
            // Remover animação do card
            setTimeout(() => {
                card.classList.remove('rule-break-animation');
            }, 500);
        });
    }
    
    /**
     * Destaca todas as instâncias da palavra "Dédalos" no site
     */
    highlightDedalosInstances() {
        // Encontrar todas as instâncias de texto com "Dédalos" e destacar
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    return node.nodeValue.match(/Dédalos|dedalos|DÉDALOS/i)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const nodesToHighlight = [];
        let node;
        while (node = walker.nextNode()) {
            nodesToHighlight.push(node);
        }
        
        // Destacar cada instância
        nodesToHighlight.forEach(textNode => {
            const span = document.createElement('span');
            span.innerHTML = textNode.nodeValue.replace(
                /(Dédalos|dedalos|DÉDALOS)/gi,
                '<span class="highlight-dedalos">$1</span>'
            );
            span.classList.add('contains-highlight');
            
            textNode.parentNode.replaceChild(span, textNode);
        });
        
        // Adicionar Easter Egg Achievement
        this.unlockAchievement('dedalos_finder', 'Caçador de Nomes', 'Você encontrou todas as menções ao Dédalos!');
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            document.querySelectorAll('.contains-highlight').forEach(el => {
                // Recuperar o texto original
                const originalText = el.textContent;
                const textNode = document.createTextNode(originalText);
                el.parentNode.replaceChild(textNode, el);
            });
        }, 10000);
    }
    
    /**
     * Adiciona uma mensagem escondida no formulário de contato
     */
    addHiddenMessageInContactForm() {
        // Adicionar mensagem escondida no formulário que aparece com certos padrões de interação
        DOMUtils.onElementReady('.contact-form', (form) => {
            // Criar elemento para a mensagem escondida
            const hiddenMessage = document.createElement('div');
            hiddenMessage.className = 'hidden-contact-message';
            hiddenMessage.innerHTML = `
                <p>Você achou uma mensagem secreta! 🎁</p>
                <p>Mencione "labirinto" ao fazer seu pedido no bar para uma surpresa especial!</p>
            `;
            hiddenMessage.style.display = 'none';
            
            form.appendChild(hiddenMessage);
            
            // Adicionar trigger secreto - digitar "dedalos" em qualquer campo
            const inputs = form.querySelectorAll('input, textarea');
            let secretSequence = '';
            
            inputs.forEach(input => {
                input.addEventListener('keyup', (e) => {
                    secretSequence += e.key.toLowerCase();
                    
                    // Manter apenas os últimos 7 caracteres
                    if (secretSequence.length > 7) {
                        secretSequence = secretSequence.substring(secretSequence.length - 7);
                    }
                    
                    // Verificar se a sequência corresponde a "dedalos"
                    if (secretSequence === 'dedalos') {
                        // Mostrar a mensagem escondida
                        hiddenMessage.style.display = 'block';
                        
                        // Adicionar animação de fade-in
                        hiddenMessage.classList.add('fade-in');
                        
                        // Conceder conquista
                        this.unlockAchievement('form_hacker', 'Hacker de Formulários', 'Você encontrou a mensagem secreta no formulário!');
                        
                        // Resetar a sequência
                        secretSequence = '';
                    }
                });
            });
        });
    }
    
    /**
     * Desbloqueia achievement quando o usuário clica em todas as abas de preços
     */
    unlockPriceNinjutsu() {
        this.unlockAchievement('price_master', 'Mestre dos Preços', 'Você explorou todas as opções de preços!');
    }
    
    /**
     * Desbloqueia achievement quando o usuário abre todas as perguntas do FAQ
     */
    unlockCuriosityAchievement() {
        this.unlockAchievement('curious_mind', 'Mente Curiosa', 'Você abriu todas as perguntas do FAQ!');
    }
    
    /**
     * Registra um achievement e mostra notificação
     * @param {string} id - Identificador único do achievement
     * @param {string} title - Título do achievement
     * @param {string} description - Descrição do achievement
     */
    unlockAchievement(id, title, description) {
        // Verificar se já foi desbloqueado
        if (this.achievements[id]) {
            return;
        }
        
        // Registrar achievement com timestamp
        this.achievements[id] = {
            title,
            description,
            unlockedAt: new Date().toISOString()
        };
        
        // Salvar no storage
        StorageUtils.setJSON(ACHIEVEMENTS_KEY, this.achievements);
        
        // Mostrar notificação
        this.showAchievementNotification(title, description);
        
        // Disparar evento para outros componentes
        EventBus.publish('achievement:unlocked', { id, title, description });
    }
    
    /**
     * Mostra notificação de achievement desbloqueado
     * @param {string} title - Título do achievement
     * @param {string} description - Descrição do achievement
     */
    showAchievementNotification(title, description) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <h4>${title}</h4>
                <p>${description}</p>
            </div>
        `;
        
        // Adicionar ao documento
        document.body.appendChild(notification);
        
        // Animação de entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remover após alguns segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }
    
    /**
     * Verifica se há achievements pendentes para mostrar
     */
    checkForPendingAchievements() {
        // Implementação futura - poderia mostrar achievements desbloqueados em sessões anteriores
        // que o usuário ainda não viu a notificação
    }
}

// Inicializar o módulo de Easter Eggs quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.dedalosEasterEggs = new EasterEggs();
});

// Exportar a classe para uso em outros módulos
export { EasterEggs };
