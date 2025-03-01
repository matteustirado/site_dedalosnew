/**
 * dom.js - Utilitários para manipulação do DOM
 * Parte do Dédalos Bar - Funções reutilizáveis para seleção e manipulação de elementos
 */

const DOM = {
    /**
     * Seleciona um elemento pelo ID
     * @param {string} id - ID do elemento
     * @returns {HTMLElement|null} Elemento encontrado ou null
     */
    id: (id) => document.getElementById(id),

    /**
     * Seleciona o primeiro elemento que corresponde ao seletor
     * @param {string} selector - Seletor CSS
     * @param {HTMLElement|Document} [parent=document] - Elemento pai para busca
     * @returns {HTMLElement|null} Elemento encontrado ou null
     */
    query: (selector, parent = document) => parent.querySelector(selector),

    /**
     * Seleciona todos os elementos que correspondem ao seletor
     * @param {string} selector - Seletor CSS
     * @param {HTMLElement|Document} [parent=document] - Elemento pai para busca
     * @returns {NodeList} Lista de elementos encontrados
     */
    queryAll: (selector, parent = document) => parent.querySelectorAll(selector),

    /**
     * Cria um elemento com atributos e conteúdo opcionais
     * @param {string} tag - Nome da tag HTML
     * @param {Object} [attributes={}] - Atributos para o elemento
     * @param {string|HTMLElement|Array} [content=''] - Conteúdo HTML, elemento ou array de elementos
     * @returns {HTMLElement} Elemento HTML criado
     */
    create: (tag, attributes = {}, content = '') => {
        const element = document.createElement(tag);
        
        // Adiciona atributos
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key === 'style' && typeof value === 'object') {
                Object.entries(value).forEach(([styleKey, styleValue]) => {
                    element.style[styleKey] = styleValue;
                });
            } else if (key === 'text') {
                element.textContent = value;
            } else if (key === 'html') {
                element.innerHTML = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Adiciona conteúdo
        if (content) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(item => {
                    if (typeof item === 'string') {
                        const textNode = document.createTextNode(item);
                        element.appendChild(textNode);
                    } else if (item instanceof HTMLElement) {
                        element.appendChild(item);
                    }
                });
            }
        }
        
        return element;
    },

    /**
     * Adiciona um elemento ao final de um elemento pai
     * @param {HTMLElement} parent - Elemento pai
     * @param {HTMLElement|string} child - Elemento ou HTML string para adicionar
     * @returns {HTMLElement} O elemento filho adicionado
     */
    append: (parent, child) => {
        if (typeof child === 'string') {
            parent.insertAdjacentHTML('beforeend', child);
            return parent.lastElementChild;
        } else {
            return parent.appendChild(child);
        }
    },

    /**
     * Adiciona um elemento no início de um elemento pai
     * @param {HTMLElement} parent - Elemento pai
     * @param {HTMLElement|string} child - Elemento ou HTML string para adicionar
     * @returns {HTMLElement} O elemento filho adicionado
     */
    prepend: (parent, child) => {
        if (typeof child === 'string') {
            parent.insertAdjacentHTML('afterbegin', child);
            return parent.firstElementChild;
        } else {
            return parent.prepend(child);
        }
    },

    /**
     * Define ou obtém o conteúdo HTML de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} [content] - Conteúdo HTML opcional para definir
     * @returns {string|HTMLElement} O conteúdo HTML ou o próprio elemento
     */
    html: (element, content) => {
        if (content === undefined) {
            return element.innerHTML;
        }
        element.innerHTML = content;
        return element;
    },

    /**
     * Define ou obtém o texto de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} [content] - Texto opcional para definir
     * @returns {string|HTMLElement} O texto ou o próprio elemento
     */
    text: (element, content) => {
        if (content === undefined) {
            return element.textContent;
        }
        element.textContent = content;
        return element;
    },

    /**
     * Adiciona classes a um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {...string} classNames - Nomes de classes para adicionar
     * @returns {HTMLElement} O elemento modificado
     */
    addClass: (element, ...classNames) => {
        element.classList.add(...classNames);
        return element;
    },

    /**
     * Remove classes de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {...string} classNames - Nomes de classes para remover
     * @returns {HTMLElement} O elemento modificado
     */
    removeClass: (element, ...classNames) => {
        element.classList.remove(...classNames);
        return element;
    },

    /**
     * Alterna classes em um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {...string} classNames - Nomes de classes para alternar
     * @returns {HTMLElement} O elemento modificado
     */
    toggleClass: (element, ...classNames) => {
        classNames.forEach(name => element.classList.toggle(name));
        return element;
    },

    /**
     * Verifica se um elemento tem uma classe específica
     * @param {HTMLElement} element - Elemento para verificar
     * @param {string} className - Nome da classe
     * @returns {boolean} Verdadeiro se o elemento tiver a classe
     */
    hasClass: (element, className) => element.classList.contains(className),

    /**
     * Define ou obtém um atributo em um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} name - Nome do atributo
     * @param {string} [value] - Valor opcional para definir
     * @returns {string|HTMLElement} O valor do atributo ou o próprio elemento
     */
    attr: (element, name, value) => {
        if (value === undefined) {
            return element.getAttribute(name);
        }
        element.setAttribute(name, value);
        return element;
    },

    /**
     * Remove um atributo de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} name - Nome do atributo para remover
     * @returns {HTMLElement} O elemento modificado
     */
    removeAttr: (element, name) => {
        element.removeAttribute(name);
        return element;
    },

    /**
     * Define ou obtém propriedades de estilo de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string|Object} property - Nome da propriedade ou objeto de estilos
     * @param {string} [value] - Valor opcional para definir
     * @returns {string|HTMLElement} O valor do estilo ou o próprio elemento
     */
    css: (element, property, value) => {
        if (typeof property === 'object') {
            Object.entries(property).forEach(([prop, val]) => {
                element.style[prop] = val;
            });
            return element;
        }
        
        if (value === undefined) {
            return getComputedStyle(element)[property];
        }
        
        element.style[property] = value;
        return element;
    },

    /**
     * Mostra um elemento definindo display
     * @param {HTMLElement} element - Elemento para mostrar
     * @param {string} [display='block'] - Valor para a propriedade display
     * @returns {HTMLElement} O elemento modificado
     */
    show: (element, display = 'block') => {
        element.style.display = display;
        return element;
    },

    /**
     * Esconde um elemento
     * @param {HTMLElement} element - Elemento para esconder
     * @returns {HTMLElement} O elemento modificado
     */
    hide: (element) => {
        element.style.display = 'none';
        return element;
    },

    /**
     * Alterna a visibilidade de um elemento
     * @param {HTMLElement} element - Elemento para alternar
     * @param {string} [display='block'] - Valor para display quando visível
     * @returns {HTMLElement} O elemento modificado
     */
    toggle: (element, display = 'block') => {
        if (element.style.display === 'none') {
            element.style.display = display;
        } else {
            element.style.display = 'none';
        }
        return element;
    },

    /**
     * Adiciona um ouvinte de eventos a um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} eventType - Tipo de evento
     * @param {Function} handler - Função manipuladora
     * @param {Object|boolean} [options] - Opções do evento ou useCapture
     * @returns {HTMLElement} O elemento com o ouvinte adicionado
     */
    on: (element, eventType, handler, options) => {
        element.addEventListener(eventType, handler, options);
        return element;
    },

    /**
     * Remove um ouvinte de eventos de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} eventType - Tipo de evento
     * @param {Function} handler - Função manipuladora
     * @param {Object|boolean} [options] - Opções do evento ou useCapture
     * @returns {HTMLElement} O elemento com o ouvinte removido
     */
    off: (element, eventType, handler, options) => {
        element.removeEventListener(eventType, handler, options);
        return element;
    },

    /**
     * Obtém ou define o valor de um elemento de formulário
     * @param {HTMLElement} element - Elemento de formulário
     * @param {string} [value] - Valor opcional para definir
     * @returns {string|HTMLElement} O valor ou o próprio elemento
     */
    val: (element, value) => {
        if (value === undefined) {
            return element.value;
        }
        element.value = value;
        return element;
    },

    /**
     * Obtém ou define os dados do dataset de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @param {string} key - Chave do dataset
     * @param {string} [value] - Valor opcional para definir
     * @returns {string|HTMLElement} O valor do dataset ou o próprio elemento
     */
    data: (element, key, value) => {
        if (value === undefined) {
            return element.dataset[key];
        }
        element.dataset[key] = value;
        return element;
    },

    /**
     * Encontra o ancestral mais próximo que corresponde ao seletor
     * @param {HTMLElement} element - Elemento inicial
     * @param {string} selector - Seletor CSS para encontrar
     * @returns {HTMLElement|null} O ancestral correspondente ou null
     */
    closest: (element, selector) => element.closest(selector),

    /**
     * Obtém a posição do elemento em relação à janela
     * @param {HTMLElement} element - Elemento alvo
     * @returns {Object} Objeto com coordenadas top e left
     */
    position: (element) => {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
        };
    },

    /**
     * Obtém a largura e altura de um elemento
     * @param {HTMLElement} element - Elemento alvo
     * @returns {Object} Objeto com largura e altura
     */
    dimensions: (element) => {
        return {
            width: element.offsetWidth,
            height: element.offsetHeight
        };
    },

    /**
     * Detecta quando um elemento entra no viewport
     * @param {HTMLElement} element - Elemento para observar
     * @param {Function} callback - Função a ser chamada quando visível
     * @param {Object} [options] - Opções do IntersectionObserver
     * @returns {IntersectionObserver} O observador criado
     */
    onVisible: (element, callback, options = {}) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    if (options.once) {
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, options);
        
        observer.observe(element);
        return observer;
    }
};

// Exporta o objeto DOM para uso em outros scripts
export default DOM;
