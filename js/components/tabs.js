/**
 * tabs.js - Sistema de abas reutilizável para alternância de conteúdo
 * 
 * Este componente gerencia a alternância entre diferentes abas de conteúdo,
 * funcionando tanto para a seção de preços quanto para outras seções do site
 * que utilizem o padrão de navegação por abas.
 * 
 * @author M_tecode
 * @version 1.0.0
 */

import { EventBus } from '../core/event-bus.js';

class TabsManager {
    /**
     * Inicializa o gerenciador de abas
     * @param {string} containerId - ID do elemento contendo as abas
     * @param {Object} options - Opções de configuração
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        // Configurações padrão
        this.options = Object.assign({
            tabSelector: '[role="tab"]',
            panelSelector: '[role="tabpanel"]',
            activeClass: 'active',
            defaultTab: 0,
            onTabChange: null,
            animateTransition: true
        }, options);
        
        // Elementos das abas e painéis
        this.tabs = Array.from(this.container.querySelectorAll(this.options.tabSelector));
        this.panels = Array.from(document.querySelectorAll(this.options.panelSelector));
        
        // Estado atual
        this.currentTabIndex = this.options.defaultTab;
        
        // Inicialização
        this.init();
    }
    
    /**
     * Inicializa eventos e estado inicial
     */
    init() {
        if (!this.tabs.length) return;
        
        // Adicionar event listeners aos tabs
        this.tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => this.activateTab(index));
            tab.addEventListener('keydown', (e) => this.handleKeyNavigation(e, index));
            
            // Adicionar atributos ARIA se não existirem
            if (!tab.getAttribute('id')) {
                const tabId = `tab-${this.container.id}-${index}`;
                tab.setAttribute('id', tabId);
            }
            
            if (this.panels[index] && !this.panels[index].getAttribute('aria-labelledby')) {
                this.panels[index].setAttribute('aria-labelledby', tab.getAttribute('id'));
            }
        });
        
        // Iniciar com a aba padrão ativa
        this.activateTab(this.currentTabIndex);
        
        // Registrar no EventBus para comunicação com outros componentes
        EventBus.subscribe('tabs:activate', (data) => {
            if (data.containerId === this.container.id && typeof data.tabIndex === 'number') {
                this.activateTab(data.tabIndex);
            }
        });
    }
    
    /**
     * Ativa uma aba específica
     * @param {number} index - Índice da aba a ser ativada
     */
    activateTab(index) {
        if (index < 0 || index >= this.tabs.length) return;
        
        // Desativar a aba atual
        this.tabs[this.currentTabIndex].setAttribute('aria-selected', 'false');
        this.tabs[this.currentTabIndex].classList.remove(this.options.activeClass);
        this.tabs[this.currentTabIndex].tabIndex = -1;
        
        if (this.panels[this.currentTabIndex]) {
            this.panels[this.currentTabIndex].hidden = true;
            this.panels[this.currentTabIndex].classList.remove(this.options.activeClass);
        }
        
        // Ativar a nova aba
        this.tabs[index].setAttribute('aria-selected', 'true');
        this.tabs[index].classList.add(this.options.activeClass);
        this.tabs[index].tabIndex = 0;
        this.tabs[index].focus();
        
        if (this.panels[index]) {
            this.panels[index].hidden = false;
            
            if (this.options.animateTransition) {
                // Adiciona classe para animação
                setTimeout(() => {
                    this.panels[index].classList.add(this.options.activeClass);
                }, 10); // Pequeno delay para garantir que a transição seja aplicada
            } else {
                this.panels[index].classList.add(this.options.activeClass);
            }
        }
        
        // Atualizar índice atual
        this.currentTabIndex = index;
        
        // Notificar o callback se existir
        if (typeof this.options.onTabChange === 'function') {
            this.options.onTabChange(index, this.tabs[index]);
        }
        
        // Publicar evento de mudança
        EventBus.publish('tabs:changed', {
            containerId: this.container.id,
            tabIndex: index,
            tabElement: this.tabs[index]
        });
    }
    
    /**
     * Gerencia navegação via teclado entre abas
     * @param {KeyboardEvent} event - Evento de teclado
     * @param {number} index - Índice da aba atual
     */
    handleKeyNavigation(event, index) {
        let targetIndex;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                // Navegar para a aba anterior ou para a última se estiver na primeira
                event.preventDefault();
                targetIndex = index === 0 ? this.tabs.length - 1 : index - 1;
                break;
                
            case 'ArrowRight':
            case 'ArrowDown':
                // Navegar para a próxima aba ou para a primeira se estiver na última
                event.preventDefault();
                targetIndex = index === this.tabs.length - 1 ? 0 : index + 1;
                break;
                
            case 'Home':
                // Ir para a primeira aba
                event.preventDefault();
                targetIndex = 0;
                break;
                
            case 'End':
                // Ir para a última aba
                event.preventDefault();
                targetIndex = this.tabs.length - 1;
                break;
                
            default:
                return;
        }
        
        this.activateTab(targetIndex);
    }
    
    /**
     * Ativa uma aba com base em seu ID ou data-tab
     * @param {string} idOrData - ID da aba ou valor de data-tab
     */
    activateTabByIdentifier(idOrData) {
        const index = this.tabs.findIndex(tab => 
            tab.id === idOrData || tab.getAttribute('data-tab') === idOrData
        );
        
        if (index !== -1) {
            this.activateTab(index);
        }
    }
}

// Inicialização dos sistemas de abas do site
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar as abas de preços
    const pricesTabs = new TabsManager('prices', {
        onTabChange: (index, tab) => {
            // Lógica específica para abas de preços
            const tabId = tab.getAttribute('data-tab');
            // Atualizar período atual se necessário
            if (tabId === 'today') {
                const currentHour = new Date().getHours();
                let activePeriod;
                
                if (currentHour >= 6 && currentHour < 14) {
                    activePeriod = 'morning';
                } else if (currentHour >= 14 && currentHour < 20) {
                    activePeriod = 'afternoon';
                } else {
                    activePeriod = 'night';
                }
                
                // Ativar o período atual na aba "hoje"
                const periodIndicators = document.querySelectorAll('#today .indicator');
                periodIndicators.forEach(indicator => {
                    indicator.classList.remove('active');
                    if (indicator.getAttribute('data-period') === activePeriod) {
                        indicator.classList.add('active');
                    }
                });
                
                // Posicionar o slide no período correto
                const currentSlide = document.querySelector(`#today-${activePeriod}`);
                if (currentSlide) {
                    const slideIndex = Array.from(currentSlide.parentNode.children).indexOf(currentSlide);
                    document.querySelector('#today-slider-track').style.transform = 
                        `translateX(-${slideIndex * 100}%)`;
                }
            }
        }
    });
    
    // Inicializar as abas de informações
    const infoTabs = new TabsManager('info', {
        onTabChange: (index, tab) => {
            // Lógica específica para abas de informações
            const tabId = tab.getAttribute('data-tab');
            
            // Carregar mapa se for a aba de localização
            if (tabId === 'localizacao') {
                // Podemos publicar um evento para o js de mapas carregar os dados
                EventBus.publish('maps:load', { force: true });
            }
        }
    });
    
    // Inicializar tabs de localização (dentro da aba de informações)
    const locationTabs = new TabsManager('localizacao', {
        onTabChange: (index, tab) => {
            const locationId = tab.getAttribute('data-location');
            // Notificar mudança de mapa
            EventBus.publish('maps:changeLocation', { location: locationId });
        }
    });
});

// Exportar para uso em outros módulos
export { TabsManager };
