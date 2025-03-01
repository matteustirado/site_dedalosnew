/**
 * @file scroll-observer.js
 * @description Implementa um sistema de observação de rolagem para acionar animações
 * e outros comportamentos quando elementos entram na área visível da tela.
 * Este componente utiliza a API IntersectionObserver para eficiência e performance.
 */

import { EventBus } from '../core/event-bus.js';

class ScrollObserver {
  /**
   * @constructor
   */
  constructor() {
    this.observers = new Map();
    this.defaultOptions = {
      root: null, // viewport por padrão
      rootMargin: '0px',
      threshold: 0.1 // 10% do elemento visível para acionar
    };
    
    // Vincular métodos ao contexto this
    this.observe = this.observe.bind(this);
    this.unobserve = this.unobserve.bind(this);
    this.handleIntersection = this.handleIntersection.bind(this);
  }

  /**
   * Observa um elemento e executa um callback quando ele entra no viewport
   * @param {HTMLElement|string} element - Elemento ou seletor a ser observado
   * @param {Function} callback - Função a ser executada quando o elemento for visível
   * @param {Object} [options] - Opções personalizadas para o IntersectionObserver
   * @param {string} [animationClass] - Classe CSS para adicionar ao elemento quando visível
   * @returns {string} ID da observação para referência futura
   */
  observe(element, callback, options = {}, animationClass = '') {
    // Suporta seletor de string ou elemento direto
    const targetElement = typeof element === 'string' 
      ? document.querySelector(element)
      : element;
    
    if (!targetElement) {
      console.error('Elemento não encontrado:', element);
      return null;
    }
    
    // Gerar ID único para esta observação
    const observerId = 'obs_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Mesclar opções padrão com as personalizadas
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Criação do observer
    const observer = new IntersectionObserver((entries, observer) => {
      this.handleIntersection(entries, observer, callback, animationClass, observerId);
    }, mergedOptions);
    
    // Armazenar referências
    this.observers.set(observerId, {
      element: targetElement,
      observer,
      callback,
      animationClass,
      triggered: false
    });
    
    // Iniciar observação
    observer.observe(targetElement);
    
    // Emitir evento de nova observação
    EventBus.publish('scrollObserver:added', { 
      id: observerId, 
      element: targetElement 
    });
    
    return observerId;
  }

  /**
   * Manipula o evento de interseção dos elementos
   * @private
   */
  handleIntersection(entries, observer, callback, animationClass, observerId) {
    entries.forEach(entry => {
      const observerData = this.observers.get(observerId);
      
      // Se já foi acionado e configurado para acionar apenas uma vez, ignorar
      if (observerData.triggered && observerData.once) return;
      
      if (entry.isIntersecting) {
        // Executar callback se existir
        if (typeof callback === 'function') {
          callback(entry.target, entry);
        }
        
        // Adicionar classe de animação se especificada
        if (animationClass) {
          entry.target.classList.add(animationClass);
        }
        
        // Emitir evento de elemento visível
        EventBus.publish('scrollObserver:visible', { 
          id: observerId, 
          element: entry.target,
          entry
        });
        
        // Marcar como acionado
        observerData.triggered = true;
        
        // Se configurado para acionar apenas uma vez, parar de observar
        if (observerData.once) {
          this.unobserve(observerId);
        }
      } else if (animationClass && !observerData.once) {
        // Remover classe quando sai da tela (apenas se não for "once")
        entry.target.classList.remove(animationClass);
        
        // Resetar flag de acionamento para permitir nova animação
        observerData.triggered = false;
      }
    });
  }

  /**
   * Para de observar um elemento específico
   * @param {string} observerId - ID da observação retornado pelo método observe
   */
  unobserve(observerId) {
    const observerData = this.observers.get(observerId);
    
    if (!observerData) {
      console.warn('Observer não encontrado:', observerId);
      return;
    }
    
    // Parar de observar
    observerData.observer.unobserve(observerData.element);
    observerData.observer.disconnect();
    
    // Remover da coleção
    this.observers.delete(observerId);
    
    // Emitir evento de remoção
    EventBus.publish('scrollObserver:removed', { 
      id: observerId, 
      element: observerData.element 
    });
  }

  /**
   * Observa múltiplos elementos com a mesma configuração
   * @param {string} selector - Seletor CSS para múltiplos elementos
   * @param {Function} callback - Função a ser executada para cada elemento
   * @param {Object} [options] - Opções para o IntersectionObserver
   * @param {string} [animationClass] - Classe a adicionar quando visível
   * @param {boolean} [once=false] - Se true, remove observação após primeira ativação
   * @returns {Array} Array de IDs de observação
   */
  observeAll(selector, callback, options = {}, animationClass = '', once = false) {
    const elements = document.querySelectorAll(selector);
    const ids = [];
    
    elements.forEach(element => {
      // Adicionar opção "once" para cada observação
      const extendedOptions = { ...options, once };
      const id = this.observe(element, callback, extendedOptions, animationClass);
      if (id) ids.push(id);
    });
    
    return ids;
  }

  /**
   * Ativa animações em elementos com data-attributes específicos
   * Convenção: data-animate="fade-in" data-animate-delay="200" data-animate-threshold="0.2"
   */
  initAnimations() {
    // Encontrar todos os elementos com atributo data-animate
    const animatableElements = document.querySelectorAll('[data-animate]');
    
    animatableElements.forEach(element => {
      // Obter valores dos data attributes
      const animationClass = element.dataset.animate;
      const delay = parseInt(element.dataset.animateDelay || 0, 10);
      const threshold = parseFloat(element.dataset.animateThreshold || 0.1);
      const once = element.dataset.animateOnce !== 'false'; // true por padrão
      
      // Configurar opções personalizadas
      const options = {
        threshold,
        once
      };
      
      // Função de callback com delay se necessário
      const callback = (el) => {
        if (delay > 0) {
          setTimeout(() => {
            el.classList.add(animationClass);
          }, delay);
        } else {
          el.classList.add(animationClass);
        }
      };
      
      // Observar o elemento
      this.observe(element, callback, options);
    });
  }
  
  /**
   * Para todas as observações e limpa a coleção
   */
  disconnectAll() {
    this.observers.forEach((data, id) => {
      this.unobserve(id);
    });
    
    this.observers.clear();
    EventBus.publish('scrollObserver:allDisconnected');
  }
}

// Singleton
const scrollObserver = new ScrollObserver();

/**
 * Utilitário para animar elementos quando entram na viewport
 */
const AnimateOnScroll = {
  /**
   * Inicializa animações em todos os elementos com data-animate
   */
  init() {
    scrollObserver.initAnimations();
    
    // Emitir evento de inicialização
    EventBus.publish('animateOnScroll:initialized');
  },
  
  /**
   * Adiciona uma nova animação a um elemento
   * @param {HTMLElement|string} element - Elemento ou seletor
   * @param {string} animationClass - Classe CSS da animação a aplicar
   * @param {Object} [options] - Opções customizadas
   */
  add(element, animationClass, options = {}) {
    return scrollObserver.observe(
      element, 
      (el) => el.classList.add(animationClass), 
      options, 
      null
    );
  },
  
  /**
   * Aplicar efeito de revelação em grupos, com atraso sequencial
   * @param {string} selector - Seletor para os elementos
   * @param {string} animationClass - Classe de animação a aplicar
   * @param {number} delayBetween - Atraso entre elementos (ms)
   */
  stagger(selector, animationClass, delayBetween = 100) {
    const elements = document.querySelectorAll(selector);
    const ids = [];
    
    elements.forEach((element, index) => {
      const delay = index * delayBetween;
      
      const id = scrollObserver.observe(
        element,
        (el) => {
          setTimeout(() => {
            el.classList.add(animationClass);
          }, delay);
        },
        { once: true }
      );
      
      if (id) ids.push(id);
    });
    
    return ids;
  }
};

export { scrollObserver, AnimateOnScroll };
