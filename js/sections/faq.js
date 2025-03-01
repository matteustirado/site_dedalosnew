/**
 * FAQ Section Module - Responsável pela busca e filtragem das perguntas frequentes
 * 
 * Este módulo implementa:
 * - Sistema de busca que filtra perguntas em tempo real
 * - Funcionalidade de expansão/contração dos acordeões
 * - Realce dos termos pesquisados 
 * - Acessibilidade via teclado
 */

import { EventBus } from '../core/event-bus.js';
import { debounce } from '../utils/animation.js';
import { getElement, getElements } from '../utils/dom.js';

class FAQSection {
    constructor() {
        // Elementos principais
        this.faqSection = getElement('#faq');
        this.searchInput = getElement('#faqSearch');
        this.faqItems = getElements('.faq-item');
        this.faqQuestions = getElements('.faq-question');
        this.faqAnswers = getElements('.faq-answer');
        
        // Estado
        this.currentOpenItem = null;
        this.searchTerm = '';
        
        // Inicialização
        this.init();
    }
    
    /**
     * Inicializa os eventos e funcionalidades do FAQ
     */
    init() {
        // Inicializar listeners
        this.initSearchFunctionality();
        this.initAccordionFunctionality();
        
        // Registrar eventos para integração com o restante do site
        this.registerEvents();
        
        // Verificar se há um termo de busca na URL (para links diretos)
        this.checkUrlForSearchTerm();
    }
    
    /**
     * Inicializa a funcionalidade de busca/filtragem
     */
    initSearchFunctionality() {
        // Usar debounce para evitar muitas chamadas durante a digitação
        this.searchInput.addEventListener('input', debounce((e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.filterFAQItems();
        }, 300));
        
        // Limpar busca quando o usuário pressionar Escape
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }
    
    /**
     * Inicializa a funcionalidade de acordeão (expandir/contrair respostas)
     */
    initAccordionFunctionality() {
        this.faqQuestions.forEach((question, index) => {
            // Clique para expandir/contrair
            question.addEventListener('click', () => {
                this.toggleAnswer(index);
            });
            
            // Acessibilidade: permitir ativação pelo teclado
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleAnswer(index);
                }
            });
        });
    }
    
    /**
     * Expande ou contrai uma resposta específica
     * @param {number} index - Índice do item de FAQ a ser alternado
     */
    toggleAnswer(index) {
        const question = this.faqQuestions[index];
        const answer = this.faqAnswers[index];
        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        
        // Se estiver expandindo e houver outro item aberto, feche-o primeiro
        if (!isExpanded && this.currentOpenItem !== null && this.currentOpenItem !== index) {
            this.closeAnswer(this.currentOpenItem);
        }
        
        // Atualiza atributos ARIA
        question.setAttribute('aria-expanded', !isExpanded);
        answer.hidden = isExpanded;
        
        // Atualiza o ícone
        const icon = question.querySelector('.icon-expand');
        if (icon) {
            icon.classList.toggle('rotated', !isExpanded);
        }
        
        // Registra o item aberto atual ou null se estiver fechando
        this.currentOpenItem = isExpanded ? null : index;
        
        // Disparar evento de alteração
        EventBus.publish('faq:itemToggled', { 
            index, 
            isOpen: !isExpanded,
            question: question.querySelector('span').textContent
        });
        
        // Se estiver expandindo, role para garantir visibilidade
        if (!isExpanded) {
            setTimeout(() => {
                answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
    
    /**
     * Fecha uma resposta específica
     * @param {number} index - Índice do item a ser fechado
     */
    closeAnswer(index) {
        const question = this.faqQuestions[index];
        const answer = this.faqAnswers[index];
        
        question.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
        
        const icon = question.querySelector('.icon-expand');
        if (icon) {
            icon.classList.remove('rotated');
        }
    }
    
    /**
     * Filtra os itens de FAQ com base no termo de pesquisa
     */
    filterFAQItems() {
        // Se o termo de busca estiver vazio, mostre todos os itens
        if (!this.searchTerm) {
            this.showAllItems();
            EventBus.publish('faq:searchCleared');
            return;
        }
        
        // Contador para itens correspondentes
        let matchCount = 0;
        
        // Filtrar cada pergunta
        this.faqItems.forEach((item, index) => {
            const question = item.querySelector('.faq-question span').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
            const hasMatch = question.includes(this.searchTerm) || answer.includes(this.searchTerm);
            
            // Mostrar/ocultar com base na correspondência
            item.style.display = hasMatch ? 'block' : 'none';
            
            // Expandir automaticamente se houver correspondência
            if (hasMatch) {
                matchCount++;
                this.highlightMatchedText(item);
                
                // Expandir apenas para termos de busca específicos (mais de 3 caracteres)
                if (this.searchTerm.length > 3) {
                    const question = this.faqQuestions[index];
                    const answer = this.faqAnswers[index];
                    
                    if (question.getAttribute('aria-expanded') !== 'true') {
                        question.setAttribute('aria-expanded', 'true');
                        answer.hidden = false;
                        
                        const icon = question.querySelector('.icon-expand');
                        if (icon) {
                            icon.classList.add('rotated');
                        }
                    }
                }
            } else {
                // Remover qualquer destaque anterior
                this.removeHighlights(item);
            }
        });
        
        // Publicar evento de busca
        EventBus.publish('faq:searchPerformed', { 
            term: this.searchTerm, 
            matchCount 
        });
        
        // Atualizar anúncio para leitores de tela
        this.updateAccessibilityAnnouncement(matchCount);
    }
    
    /**
     * Destaca o texto correspondente à pesquisa
     * @param {HTMLElement} item - Item do FAQ a ser destacado
     */
    highlightMatchedText(item) {
        // Primeiro, remova qualquer destaque anterior
        this.removeHighlights(item);
        
        // Função para destacar texto em um elemento
        const highlightInElement = (element) => {
            if (!element || !element.textContent) return;
            
            const html = element.innerHTML;
            const regex = new RegExp(`(${this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            
            // Substituir pelo mesmo texto, mas envolto em <mark>
            element.innerHTML = html.replace(regex, '<mark class="highlight">$1</mark>');
        };
        
        // Destacar na pergunta
        highlightInElement(item.querySelector('.faq-question span'));
        
        // Destacar nos parágrafos de resposta
        const paragraphs = item.querySelectorAll('.faq-answer p, .faq-answer li');
        paragraphs.forEach(highlightInElement);
    }
    
    /**
     * Remove destaques de pesquisa de um item
     * @param {HTMLElement} item - Item do FAQ para remover destaques
     */
    removeHighlights(item) {
        const highlightElements = item.querySelectorAll('.highlight');
        highlightElements.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            // Normaliza o nó para combinar nós de texto adjacentes
            parent.normalize();
        });
    }
    
    /**
     * Mostra todos os itens do FAQ (usado quando a busca é limpa)
     */
    showAllItems() {
        this.faqItems.forEach(item => {
            item.style.display = 'block';
            this.removeHighlights(item);
        });
    }
    
    /**
     * Limpa o campo de busca e restaura a exibição original
     */
    clearSearch() {
        this.searchInput.value = '';
        this.searchTerm = '';
        this.showAllItems();
        
        // Anunciar para leitores de tela
        this.updateAccessibilityAnnouncement(this.faqItems.length, true);
        
        // Publicar evento de limpeza
        EventBus.publish('faq:searchCleared');
    }
    
    /**
     * Verifica a URL para termos de busca (para links compartilhados)
     * Por exemplo: site.com/index.html#faq?q=pagamento
     */
    checkUrlForSearchTerm() {
        const hash = window.location.hash;
        if (hash.startsWith('#faq') && hash.includes('?q=')) {
            const query = hash.split('?q=')[1];
            if (query) {
                // Decodificar e aplicar
                const decodedQuery = decodeURIComponent(query);
                this.searchInput.value = decodedQuery;
                this.searchTerm = decodedQuery.toLowerCase();
                this.filterFAQItems();
                
                // Rolar até a seção de FAQ
                this.faqSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
    
    /**
     * Atualiza anúncios para leitores de tela sobre os resultados da pesquisa
     * @param {number} matchCount - Número de correspondências encontradas
     * @param {boolean} isCleared - Indica se a pesquisa foi limpa
     */
    updateAccessibilityAnnouncement(matchCount, isCleared = false) {
        // Cria ou obtém o elemento de anúncio
        let announcement = getElement('#faq-search-announcement');
        if (!announcement) {
            announcement = document.createElement('div');
            announcement.id = 'faq-search-announcement';
            announcement.className = 'sr-only';
            announcement.setAttribute('aria-live', 'polite');
            this.faqSection.appendChild(announcement);
        }
        
        // Define o texto do anúncio
        if (isCleared) {
            announcement.textContent = 'Busca limpa. Mostrando todas as perguntas frequentes.';
        } else if (this.searchTerm) {
            announcement.textContent = `Busca por "${this.searchTerm}" encontrou ${matchCount} ${matchCount === 1 ? 'resultado' : 'resultados'}.`;
        } else {
            announcement.textContent = '';
        }
    }
    
    /**
     * Registra eventos do módulo no EventBus
     */
    registerEvents() {
        // Escutar eventos externos que podem afetar o FAQ
        EventBus.subscribe('page:loaded', () => {
            // Verifica se há termos de busca na URL quando a página carrega completamente
            this.checkUrlForSearchTerm();
        });
        
        EventBus.subscribe('accessibility:highContrast', (enabled) => {
            // Ajusta os estilos para melhor contraste caso o modo de alto contraste seja ativado
            if (enabled) {
                this.faqSection.classList.add('high-contrast');
            } else {
                this.faqSection.classList.remove('high-contrast');
            }
        });
    }
}

// Inicializar o módulo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const faqSection = new FAQSection();
    
    // Exportar para uso global (depuração) se necessário
    window.faqSection = faqSection;
});

export default FAQSection;
