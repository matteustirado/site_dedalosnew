/**
 * api.js - Funções utilitárias para chamadas de API
 * 
 * Este módulo fornece métodos para interagir com APIs externas,
 * especialmente para envio de formulários de contato, mensagens e
 * integração com serviços de terceiros.
 */

/**
 * Objeto principal que contém todas as funções de API
 */
const API = {
    /**
     * Configurações globais para requisições
     */
    config: {
        baseUrl: 'https://api.dedalosbar.com/v1', // URL base para APIs próprias
        timeout: 30000, // Timeout padrão (30 segundos)
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    },

    /**
     * Realiza uma requisição HTTP genérica
     * @param {string} url - Endpoint da requisição
     * @param {Object} options - Opções da requisição
     * @returns {Promise} - Promise com a resposta
     */
    async request(url, options = {}) {
        // Mescla opções padrão com as fornecidas
        const requestOptions = {
            method: options.method || 'GET',
            headers: { ...this.config.headers, ...options.headers },
            mode: options.mode || 'cors',
            cache: options.cache || 'default',
            credentials: options.credentials || 'same-origin',
            redirect: options.redirect || 'follow',
            referrerPolicy: options.referrerPolicy || 'no-referrer-when-downgrade',
            body: options.body ? JSON.stringify(options.body) : undefined
        };

        // Cria URL completa se não for absoluta
        const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;

        try {
            // Inicia temporizador para timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), options.timeout || this.config.timeout);
            });

            // Compete entre a requisição e o timeout
            const response = await Promise.race([
                fetch(fullUrl, requestOptions),
                timeoutPromise
            ]);

            // Verifica se a resposta foi bem-sucedida
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Determina o tipo de resposta com base no Content-Type
            const contentType = response.headers.get('Content-Type') || '';
            let data;

            if (contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType.includes('text/')) {
                data = await response.text();
            } else {
                data = await response.blob();
            }

            return {
                data,
                status: response.status,
                headers: response.headers,
                success: true
            };
        } catch (error) {
            console.error('API request failed:', error);

            // Notifica usuário sobre erro (pode ser substituído por uma abordagem mais robusta)
            if (window.EventBus) {
                window.EventBus.publish('api:error', { 
                    message: 'Falha na comunicação com o servidor',
                    error: error.message
                });
            }

            return {
                success: false,
                error: error.message,
                status: error.status || 0
            };
        }
    },

    /**
     * Realiza uma requisição GET
     * @param {string} url - Endpoint da requisição
     * @param {Object} options - Opções adicionais
     * @returns {Promise} - Promise com a resposta
     */
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    },

    /**
     * Realiza uma requisição POST
     * @param {string} url - Endpoint da requisição
     * @param {Object} data - Dados a serem enviados
     * @param {Object} options - Opções adicionais
     * @returns {Promise} - Promise com a resposta
     */
    async post(url, data = {}, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: data
        });
    },

    /**
     * Realiza uma requisição PUT
     * @param {string} url - Endpoint da requisição
     * @param {Object} data - Dados a serem enviados
     * @param {Object} options - Opções adicionais
     * @returns {Promise} - Promise com a resposta
     */
    async put(url, data = {}, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: data
        });
    },

    /**
     * Realiza uma requisição DELETE
     * @param {string} url - Endpoint da requisição
     * @param {Object} options - Opções adicionais
     * @returns {Promise} - Promise com a resposta
     */
    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    },

    /**
     * Enviar formulário de contato
     * @param {Object} formData - Dados do formulário
     * @returns {Promise} - Promise com a resposta
     */
    async sendContactForm(formData) {
        // Validação básica dos dados do formulário
        const requiredFields = ['name', 'email', 'subject', 'message'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                return {
                    success: false,
                    error: `Campo ${field} é obrigatório`
                };
            }
        }

        // Opções especiais para envio de formulário de contato
        const options = {
            headers: {
                'X-Form-Type': 'contact'
            }
        };

        return this.post('/contact', formData, options);
    },

    /**
     * Enviar candidatura para vagas
     * @param {Object} applicationData - Dados da candidatura
     * @param {File} resume - Arquivo de currículo
     * @returns {Promise} - Promise com a resposta
     */
    async sendJobApplication(applicationData, resume) {
        // Cria FormData para envio com arquivo
        const formData = new FormData();
        
        // Adiciona todos os campos de texto
        Object.keys(applicationData).forEach(key => {
            formData.append(key, applicationData[key]);
        });
        
        // Adiciona o arquivo do currículo
        if (resume instanceof File) {
            formData.append('resume', resume);
        }

        // Opções especiais para envio multipart com arquivo
        const options = {
            method: 'POST',
            body: formData,
            headers: {
                // Não definimos Content-Type aqui - o fetch vai definir automaticamente
                // com o boundary correto para multipart/form-data
                'X-Form-Type': 'career'
            }
        };

        // Fazemos o fetch diretamente, sem usar o método post para evitar JSON.stringify no FormData
        try {
            const response = await fetch(`${this.config.baseUrl}/careers/apply`, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return {
                data,
                status: response.status,
                success: true
            };
        } catch (error) {
            console.error('Job application submission failed:', error);
            
            return {
                success: false,
                error: error.message,
                status: error.status || 0
            };
        }
    },

    /**
     * Enviar mensagem via WhatsApp
     * @param {string} message - Mensagem a ser enviada
     * @param {string} phone - Número do WhatsApp (opcional, usa o padrão se não fornecido)
     * @returns {string} - URL para abrir WhatsApp
     */
    openWhatsApp(message, phone = '5511912345678') {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phone}?text=${encodedMessage}`;
    },

    /**
     * Registra um usuário para receber newsletter
     * @param {string} email - Email do usuário
     * @returns {Promise} - Promise com a resposta
     */
    async subscribeNewsletter(email) {
        // Validação simples de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                error: 'Email inválido'
            };
        }

        return this.post('/subscribe', { email });
    }
};

// Exporta o objeto API para uso em outros módulos
export default API;
