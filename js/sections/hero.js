/**
 * Dédalos Bar - Hero Section Controller
 * Gerencia a lógica e interatividade da seção principal (hero)
 */

// Importações (simuladas - serão ajustadas conforme implementação real dos módulos)
import { EventBus } from '../core/event-bus.js';
import { getRandomPhrase } from '../core/phrases.js';
import { getTimeOfDay } from '../utils/date-time.js';
import { animateElement } from '../utils/animation.js';

class HeroSection {
    constructor() {
        // Elementos da DOM
        this.heroSection = document.getElementById('hero');
        this.statusBadge = document.getElementById('statusBadge');
        this.mainLogo = document.querySelector('.main-logo img');
        this.logoTitle = document.getElementById('heroTitle');
        
        // Status do bar (sempre aberto por padrão)
        this.isOpen = true;
        
        // Intervalos para atualização
        this.statusInterval = null;
        
        // Flag para efeitos
        this.effectsEnabled = true;
        
        // Inicialização
        this.init();
    }
    
    /**
     * Inicializa a seção hero e seus componentes
     */
    init() {
        // Configura o status inicial
        this.updateStatus();
        
        // Inicia atualizações periódicas do status
        this.statusInterval = setInterval(() => this.updateStatus(), 60000); // A cada minuto
        
        // Adiciona interatividade ao logo
        this.setupLogoInteractivity();
        
        // Inscreve-se em eventos relevantes
        this.subscribeToEvents();
        
        // Log de inicialização
        console.log('Hero section initialized');
    }
    
    /**
     * Atualiza o status do bar (aberto/fechado)
     * Neste caso, o bar está sempre aberto (24h)
     */
    updateStatus() {
        // O Dédalos Bar está sempre aberto (24h)
        const timeOfDay = getTimeOfDay();
        
        // Atualiza o texto do badge com mensagem personalizada
        let statusText = 'ABERTO 24H';
        
        // Verificar período do dia para mensagem personalizada
        if (timeOfDay === 'morning') {
            statusText = 'ABERTO 24H • BOM DIA';
        } else if (timeOfDay === 'afternoon') {
            statusText = 'ABERTO 24H • BOA TARDE';
        } else if (timeOfDay === 'evening') {
            statusText = 'ABERTO 24H • BOA NOITE';
        } else {
            statusText = 'ABERTO 24H • BOA MADRUGADA';
        }
        
        // Atualiza o texto do status
        if (this.statusBadge) {
            this.statusBadge.querySelector('span').textContent = statusText;
            
            // Adiciona classe pulsante para chamar atenção
            this.statusBadge.classList.add('pulse');
            setTimeout(() => {
                this.statusBadge.classList.remove('pulse');
            }, 3000);
        }
    }
    
    /**
     * Configura interatividade para o logo principal
     */
    setupLogoInteractivity() {
        if (!this.mainLogo) return;
        
        // Efeito ao passar o mouse
        this.mainLogo.addEventListener('mouseenter', () => {
            if (!this.effectsEnabled) return;
            
            // Aplica efeito de brilho suave
            this.mainLogo.classList.add('logo-glow');
            
            // Mostra uma frase aleatória como tooltip
            this.showRandomPhraseTooltip();
        });
        
        this.mainLogo.addEventListener('mouseleave', () => {
            this.mainLogo.classList.remove('logo-glow');
            
            // Remove qualquer tooltip
            const tooltip = document.querySelector('.logo-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
        
        // Efeito ao clicar no logo
        this.mainLogo.addEventListener('click', () => {
            // Aciona animação especial no logo
            this.triggerLogoAnimation();
            
            // Envia evento para possível easter egg
            EventBus.publish('logo:clicked', { timestamp: Date.now() });
        });
    }
    
    /**
     * Mostra um tooltip com frase aleatória
     */
    showRandomPhraseTooltip() {
        // Remove tooltip anterior, se existir
        const oldTooltip = document.querySelector('.logo-tooltip');
        if (oldTooltip) oldTooltip.remove();
        
        // Cria novo tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'logo-tooltip';
        tooltip.textContent = getRandomPhrase('hero');
        
        // Adiciona ao DOM, próximo ao logo
        this.heroSection.appendChild(tooltip);
        
        // Posiciona o tooltip
        const logoRect = this.mainLogo.getBoundingClientRect();
        tooltip.style.top = `${logoRect.bottom + 10}px`;
        tooltip.style.left = `${logoRect.left + (logoRect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        
        // Remove após alguns segundos
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.classList.add('fade-out');
                setTimeout(() => tooltip.remove(), 500);
            }
        }, 3000);
    }
    
    /**
     * Aciona animação especial ao clicar no logo
     */
    triggerLogoAnimation() {
        if (!this.mainLogo || !this.effectsEnabled) return;
        
        // Efeito rápido de escala
        animateElement(this.mainLogo, {
            scale: [1, 1.1, 1],
            duration: 600,
            easing: 'ease-in-out'
        });
        
        // A cada 5 cliques, aciona um efeito especial mais elaborado
        this.logoClickCount = (this.logoClickCount || 0) + 1;
        
        if (this.logoClickCount % 5 === 0) {
            // Animação especial a cada 5 cliques
            this.triggerLogoSpecialEffect();
        }
    }
    
    /**
     * Efeito especial do logo (a cada 5 cliques)
     */
    triggerLogoSpecialEffect() {
        // Adiciona classe com animação mais elaborada
        this.mainLogo.classList.add('logo-special-animation');
        
        // Notifica o multichrome effect para reagir
        EventBus.publish('effect:enhance', { 
            duration: 3000, 
            target: 'hero',
            intensity: 0.8
        });
        
        // Remove a classe após a animação
        setTimeout(() => {
            this.mainLogo.classList.remove('logo-special-animation');
        }, 3000);
    }
    
    /**
     * Inscreve-se em eventos do sistema
     */
    subscribeToEvents() {
        // Escuta por atualizações do contador de check-ins
        EventBus.subscribe('checkin:updated', (data) => {
            // Possível animação ou efeito quando o número de check-ins mudar
            if (data.significant) {
                // Efeito especial para mudanças significativas no número de pessoas
                this.flashHeroSection();
            }
        });
        
        // Escuta por mudanças de tema/modo
        EventBus.subscribe('theme:changed', (data) => {
            // Ajusta elementos visuais conforme tema (claro/escuro)
            this.adjustForTheme(data.theme);
        });
        
        // Escuta por modo de acessibilidade
        EventBus.subscribe('accessibility:changed', (data) => {
            // Desativa efeitos visuais intensos se modo de acessibilidade estiver ativado
            this.effectsEnabled = !data.reducedMotion;
        });
    }
    
    /**
     * Efeito de flash na seção hero para mudanças significativas
     */
    flashHeroSection() {
        if (!this.effectsEnabled) return;
        
        // Adiciona classe temporária com efeito de flash
        this.heroSection.classList.add('hero-flash');
        
        // Remove após a animação
        setTimeout(() => {
            this.heroSection.classList.remove('hero-flash');
        }, 1000);
    }
    
    /**
     * Ajusta elementos visuais com base no tema
     */
    adjustForTheme(theme) {
        if (theme === 'dark') {
            // Ajustes para tema escuro (já é padrão)
        } else {
            // Ajustes para tema claro (caso seja implementado)
        }
    }
    
    /**
     * Limpa recursos ao destruir a instância
     */
    destroy() {
        // Limpa o intervalo de status
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        
        // Cancela inscrições de eventos
        EventBus.unsubscribeAll('hero');
        
        console.log('Hero section destroyed');
    }
}

// Cria e exporta a instância
const heroSection = new HeroSection();
export default heroSection;
