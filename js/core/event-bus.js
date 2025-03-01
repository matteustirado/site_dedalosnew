/**
 * Event Bus - Sistema de comunicação pub/sub entre módulos
 * 
 * Permite que diferentes partes da aplicação se comuniquem
 * sem criar dependências diretas entre si, seguindo o padrão
 * de design Publisher/Subscriber (pub/sub).
 * 
 * @module core/event-bus
 */

const EventBus = (function() {
    // Armazena todos os eventos e seus assinantes
    const eventSubscribers = {};
    
    // Contador de IDs para identificação única de assinantes
    let subscriberIdCounter = 0;
    
    // Rastreamento de eventos para debugging
    const eventHistory = window.location.hostname === 'localhost' ? [] : null;
    
    /**
     * Registra um assinante para um tipo de evento
     * @param {string} eventType - Tipo de evento a ser escutado
     * @param {Function} callback - Função a ser executada quando o evento for publicado
     * @param {Object} [options] - Opções da assinatura
     * @param {boolean} [options.once=false] - Se verdadeiro, a assinatura será removida após primeira execução
     * @returns {number} ID único do assinante (útil para cancelar a assinatura)
     */
    function subscribe(eventType, callback, options = {}) {
        if (typeof eventType !== 'string') {
            console.error('EventBus: eventType deve ser uma string');
            return -1;
        }
        
        if (typeof callback !== 'function') {
            console.error('EventBus: callback deve ser uma função');
            return -1;
        }
        
        // Garantir que temos uma array para este tipo de evento
        if (!eventSubscribers[eventType]) {
            eventSubscribers[eventType] = [];
        }
        
        // Gerar ID único para este assinante
        const id = subscriberIdCounter++;
        
        // Registrar assinante com suas opções
        eventSubscribers[eventType].push({
            id,
            callback,
            once: options.once === true
        });
        
        return id;
    }
    
    /**
     * Registra um assinante que será executado apenas uma vez
     * @param {string} eventType - Tipo de evento a ser escutado
     * @param {Function} callback - Função a ser executada quando o evento for publicado
     * @returns {number} ID único do assinante
     */
    function subscribeOnce(eventType, callback) {
        return subscribe(eventType, callback, { once: true });
    }
    
    /**
     * Remove um assinante específico através do seu ID
     * @param {string} eventType - Tipo de evento
     * @param {number} subscriberId - ID do assinante retornado pelo método subscribe
     * @returns {boolean} Verdadeiro se o assinante foi removido com sucesso
     */
    function unsubscribe(eventType, subscriberId) {
        if (!eventSubscribers[eventType]) {
            return false;
        }
        
        const initialLength = eventSubscribers[eventType].length;
        eventSubscribers[eventType] = eventSubscribers[eventType].filter(
            subscriber => subscriber.id !== subscriberId
        );
        
        return eventSubscribers[eventType].length < initialLength;
    }
    
    /**
     * Remove todos os assinantes de um tipo de evento
     * @param {string} eventType - Tipo de evento para limpar assinantes
     */
    function unsubscribeAll(eventType) {
        if (eventType) {
            delete eventSubscribers[eventType];
        } else {
            // Limpa todos os tipos de eventos se nenhum for especificado
            Object.keys(eventSubscribers).forEach(type => {
                delete eventSubscribers[type];
            });
        }
    }
    
    /**
     * Publica um evento para todos os assinantes
     * @param {string} eventType - Tipo de evento a publicar
     * @param {*} [data] - Dados a serem passados para os assinantes
     */
    function publish(eventType, data) {
        if (!eventSubscribers[eventType]) {
            return; // Nenhum assinante para este evento
        }
        
        // Registra o evento no histórico se estiver em modo de debug (localhost)
        if (eventHistory) {
            eventHistory.push({
                eventType,
                data,
                timestamp: new Date().toISOString()
            });
            
            // Limita o histórico a 100 eventos para evitar memory leaks
            if (eventHistory.length > 100) {
                eventHistory.shift();
            }
        }
        
        // Cria uma cópia da lista para evitar problemas se callbacks modificarem a lista
        const subscribers = [...eventSubscribers[eventType]];
        
        // Coleta assinantes 'once' para remoção posterior
        const toRemove = [];
        
        // Executa callbacks para cada assinante
        subscribers.forEach(subscriber => {
            try {
                subscriber.callback(data);
                
                // Marca para remoção se for um assinante 'once'
                if (subscriber.once) {
                    toRemove.push(subscriber.id);
                }
            } catch (error) {
                console.error(`Erro ao executar assinante para evento '${eventType}':`, error);
            }
        });
        
        // Remove assinantes 'once' que foram executados
        toRemove.forEach(id => {
            unsubscribe(eventType, id);
        });
    }
    
    /**
     * Retorna o histórico de eventos (somente em localhost)
     * @returns {Array|null} Histórico de eventos ou null se não estiver em localhost
     */
    function getEventHistory() {
        return eventHistory ? [...eventHistory] : null;
    }
    
    /**
     * Lista todos os tipos de eventos registrados
     * @returns {string[]} Array com os tipos de eventos
     */
    function listEventTypes() {
        return Object.keys(eventSubscribers);
    }
    
    /**
     * Retorna informações sobre os assinantes (útil para debugging)
     * @param {string} [eventType] - Opcional: filtrar por tipo de evento
     * @returns {Object} Informações sobre assinantes
     */
    function getDebugInfo(eventType) {
        if (eventType) {
            return {
                eventType,
                subscriberCount: eventSubscribers[eventType]?.length || 0
            };
        }
        
        return Object.keys(eventSubscribers).map(type => ({
            eventType: type,
            subscriberCount: eventSubscribers[type].length
        }));
    }
    
    // API pública do EventBus
    return {
        subscribe,
        subscribeOnce,
        unsubscribe,
        unsubscribeAll,
        publish,
        getEventHistory,
        listEventTypes,
        getDebugInfo
    };
})();

// Exportar o EventBus como módulo global
export default EventBus;
