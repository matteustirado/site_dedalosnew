/**
 * @file storage.js
 * @description Utilitário para gerenciamento de localStorage e sessionStorage,
 * fornecendo métodos para armazenar, recuperar e gerenciar dados persistentes.
 */

const Storage = (function() {
    // Prefixo para todas as chaves de armazenamento para evitar conflitos
    const PREFIX = 'dedalos_';
    
    /**
     * Tratamento de erros no armazenamento
     * @private
     */
    const handleStorageError = (error) => {
        console.error('Erro de armazenamento:', error);
        
        // Identifica o tipo de erro
        if (error.name === 'QuotaExceededError' || 
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.warn('Limite de armazenamento excedido');
            return false;
        }
        
        // Em modo privado, alguns navegadores podem lançar erros
        return false;
    };
    
    /**
     * Verifica se o armazenamento está disponível
     * @param {string} type - 'localStorage' ou 'sessionStorage'
     * @returns {boolean} - Disponibilidade do armazenamento
     * @private
     */
    const isStorageAvailable = (type) => {
        try {
            const storage = window[type];
            const testKey = '__storage_test__';
            storage.setItem(testKey, testKey);
            storage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    };
    
    /**
     * Formata a chave com o prefixo
     * @param {string} key - Chave a ser formatada
     * @returns {string} - Chave formatada
     * @private
     */
    const formatKey = (key) => `${PREFIX}${key}`;
    
    /**
     * Salva um valor no localStorage com opção de expiração
     * @param {string} key - Chave para armazenamento
     * @param {*} value - Valor a ser armazenado
     * @param {number} [expirationDays] - Dias até expiração (opcional)
     * @returns {boolean} - Sucesso da operação
     */
    const setLocal = (key, value, expirationDays) => {
        if (!isStorageAvailable('localStorage')) return false;
        
        try {
            const formattedKey = formatKey(key);
            const data = {
                value: value,
                timestamp: new Date().getTime()
            };
            
            // Adiciona expiração se fornecida
            if (expirationDays) {
                data.expiration = new Date().getTime() + (expirationDays * 24 * 60 * 60 * 1000);
            }
            
            localStorage.setItem(formattedKey, JSON.stringify(data));
            return true;
        } catch (error) {
            return handleStorageError(error);
        }
    };
    
    /**
     * Recupera um valor do localStorage
     * @param {string} key - Chave para recuperação
     * @returns {*} - Valor armazenado ou null se não existir ou expirado
     */
    const getLocal = (key) => {
        if (!isStorageAvailable('localStorage')) return null;
        
        try {
            const formattedKey = formatKey(key);
            const jsonData = localStorage.getItem(formattedKey);
            
            if (!jsonData) return null;
            
            const data = JSON.parse(jsonData);
            
            // Verifica se o dado expirou
            if (data.expiration && new Date().getTime() > data.expiration) {
                localStorage.removeItem(formattedKey);
                return null;
            }
            
            return data.value;
        } catch (error) {
            console.error('Erro ao recuperar do localStorage:', error);
            return null;
        }
    };
    
    /**
     * Remove um item do localStorage
     * @param {string} key - Chave a ser removida
     * @returns {boolean} - Sucesso da operação
     */
    const removeLocal = (key) => {
        if (!isStorageAvailable('localStorage')) return false;
        
        try {
            const formattedKey = formatKey(key);
            localStorage.removeItem(formattedKey);
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    };
    
    /**
     * Verifica se uma chave existe no localStorage e não está expirada
     * @param {string} key - Chave a verificar
     * @returns {boolean} - Se a chave existe e é válida
     */
    const hasLocal = (key) => {
        return getLocal(key) !== null;
    };
    
    /**
     * Salva um valor no sessionStorage
     * @param {string} key - Chave para armazenamento
     * @param {*} value - Valor a ser armazenado
     * @returns {boolean} - Sucesso da operação
     */
    const setSession = (key, value) => {
        if (!isStorageAvailable('sessionStorage')) return false;
        
        try {
            const formattedKey = formatKey(key);
            const data = {
                value: value,
                timestamp: new Date().getTime()
            };
            
            sessionStorage.setItem(formattedKey, JSON.stringify(data));
            return true;
        } catch (error) {
            return handleStorageError(error);
        }
    };
    
    /**
     * Recupera um valor do sessionStorage
     * @param {string} key - Chave para recuperação
     * @returns {*} - Valor armazenado ou null se não existir
     */
    const getSession = (key) => {
        if (!isStorageAvailable('sessionStorage')) return null;
        
        try {
            const formattedKey = formatKey(key);
            const jsonData = sessionStorage.getItem(formattedKey);
            
            if (!jsonData) return null;
            
            const data = JSON.parse(jsonData);
            return data.value;
        } catch (error) {
            console.error('Erro ao recuperar do sessionStorage:', error);
            return null;
        }
    };
    
    /**
     * Remove um item do sessionStorage
     * @param {string} key - Chave a ser removida
     * @returns {boolean} - Sucesso da operação
     */
    const removeSession = (key) => {
        if (!isStorageAvailable('sessionStorage')) return false;
        
        try {
            const formattedKey = formatKey(key);
            sessionStorage.removeItem(formattedKey);
            return true;
        } catch (error) {
            console.error('Erro ao remover do sessionStorage:', error);
            return false;
        }
    };
    
    /**
     * Verifica se uma chave existe no sessionStorage
     * @param {string} key - Chave a verificar
     * @returns {boolean} - Se a chave existe
     */
    const hasSession = (key) => {
        return getSession(key) !== null;
    };
    
    /**
     * Limpa todos os dados do localStorage que pertencem a este aplicativo
     * @returns {boolean} - Sucesso da operação
     */
    const clearLocalStorage = () => {
        if (!isStorageAvailable('localStorage')) return false;
        
        try {
            // Remove apenas as chaves com o prefixo Dédalos
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Erro ao limpar localStorage:', error);
            return false;
        }
    };
    
    /**
     * Limpa todos os dados do sessionStorage que pertencem a este aplicativo
     * @returns {boolean} - Sucesso da operação
     */
    const clearSessionStorage = () => {
        if (!isStorageAvailable('sessionStorage')) return false;
        
        try {
            // Remove apenas as chaves com o prefixo Dédalos
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith(PREFIX)) {
                    sessionStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Erro ao limpar sessionStorage:', error);
            return false;
        }
    };
    
    /**
     * Funções específicas para o contexto do Dédalos Bar
     */
    
    /**
     * Salva o estado de verificação de idade do usuário
     * @param {boolean} isAdult - Se o usuário é maior de idade
     * @param {number} [days=1] - Dias para lembrar (padrão: 1 dia)
     * @returns {boolean} - Sucesso da operação
     */
    const setAgeVerified = (isAdult, days = 1) => {
        return setLocal('age_verified', isAdult, days);
    };
    
    /**
     * Verifica se o usuário já confirmou ser maior de idade
     * @returns {boolean} - Se o usuário é maior de idade
     */
    const isAgeVerified = () => {
        return getLocal('age_verified') === true;
    };
    
    /**
     * Salva as preferências do usuário
     * @param {Object} preferences - Objeto com preferências do usuário
     * @returns {boolean} - Sucesso da operação
     */
    const setUserPreferences = (preferences) => {
        return setLocal('user_preferences', preferences);
    };
    
    /**
     * Recupera as preferências do usuário
     * @returns {Object|null} - Preferências do usuário ou null
     */
    const getUserPreferences = () => {
        return getLocal('user_preferences');
    };
    
    // API pública
    return {
        // Local Storage
        setLocal,
        getLocal,
        removeLocal,
        hasLocal,
        clearLocalStorage,
        
        // Session Storage
        setSession,
        getSession,
        removeSession,
        hasSession,
        clearSessionStorage,
        
        // Específicas para o Dédalos Bar
        setAgeVerified,
        isAgeVerified,
        setUserPreferences,
        getUserPreferences
    };
})();

// Exporta o módulo
export default Storage;
