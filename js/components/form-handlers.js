/**
 * Form Handlers - Dédalos Bar
 * Gerencia validação, submissão e feedback de formulários no site
 */

// Namespace para evitar conflitos globais
const DedalosForm = (() => {
    // Cache de elementos DOM frequentemente usados
    let formElements = {};
    
    // Configurações padrão
    const config = {
        // Classes CSS para feedback visual
        cssClasses: {
            error: 'form-error',
            success: 'form-success',
            pending: 'form-pending',
            submitted: 'form-submitted'
        },
        // Mensagens padrão
        messages: {
            required: 'Este campo é obrigatório',
            email: 'Por favor, digite um e-mail válido',
            minLength: 'Digite pelo menos {min} caracteres',
            maxLength: 'Digite no máximo {max} caracteres',
            success: 'Mensagem enviada com sucesso!',
            error: 'Ocorreu um erro. Tente novamente mais tarde.',
            sending: 'Enviando...'
        },
        // Atrasos de animação em ms
        delays: {
            validation: 200, // Delay para validação durante digitação
            success: 3000    // Tempo para exibir mensagem de sucesso
        }
    };

    // Armazena validadores personalizados
    const validators = {
        required: (value) => value.trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (value, min) => value.length >= min,
        maxLength: (value, max) => value.length <= max,
        phone: (value) => /^(\(\d{2}\)\s?)?\d{4,5}-\d{4}$/.test(value.replace(/\s/g, '')),
        checkbox: (element) => element.checked
    };

    /**
     * Inicializa o gerenciador de formulários
     * @param {Object} options - Opções de configuração personalizadas
     */
    function init(options = {}) {
        // Mescla opções fornecidas com configurações padrão
        Object.assign(config, options);
        
        // Captura todos os formulários do site
        const forms = document.querySelectorAll('form');
        
        // Inicializa cada formulário encontrado
        forms.forEach(form => {
            const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
            
            // Adiciona ID se não existir
            if (!form.id) form.id = formId;
            
            // Configura validação e tratamento de envio
            setupFormValidation(form);
            setupFormSubmission(form);
            
            // Salva referência do formulário
            formElements[formId] = {
                form,
                inputs: form.querySelectorAll('input, textarea, select'),
                submitButton: form.querySelector('button[type="submit"]')
            };
        });

        // Registra no event bus (sistema de eventos global)
        if (window.EventBus) {
            window.EventBus.subscribe('theme:changed', updateFormStyles);
        }

        console.log('Form handlers initialized');
    }

    /**
     * Configura validação para um formulário específico
     * @param {HTMLFormElement} form - O elemento de formulário
     */
    function setupFormValidation(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Ignora elementos hidden ou submit
            if (input.type === 'hidden' || input.type === 'submit') return;
            
            // Adiciona evento blur para validar quando o campo perde foco
            input.addEventListener('blur', (event) => {
                validateField(event.target);
            });
            
            // Validação em tempo real durante digitação com debounce
            let debounceTimer;
            input.addEventListener('input', (event) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    validateField(event.target);
                }, config.delays.validation);
            });
        });
    }

    /**
     * Valida um campo individual
     * @param {HTMLElement} field - O campo a ser validado
     * @returns {boolean} - Se o campo é válido
     */
    function validateField(field) {
        // Remove mensagens de erro anteriores
        removeFieldError(field);
        
        // Pega os atributos de validação
        const validations = getFieldValidations(field);
        
        // Se não tem validações definidas, considera válido
        if (validations.length === 0) return true;
        
        // Verifica cada validação
        for (const validation of validations) {
            const { type, param, message } = validation;
            
            // Pula validações para campos vazios não obrigatórios
            if (type !== 'required' && field.value.trim() === '' && !field.hasAttribute('required')) {
                continue;
            }
            
            // Verifica se a validação falha
            if (!validators[type](field.value, param)) {
                showFieldError(field, message || formatMessage(config.messages[type], { min: param, max: param }));
                return false;
            }
        }
        
        // Se chegou aqui, o campo é válido
        showFieldSuccess(field);
        return true;
    }
    
    /**
     * Obtém as regras de validação para um campo
     * @param {HTMLElement} field - O campo
     * @returns {Array} - Lista de validações a aplicar
     */
    function getFieldValidations(field) {
        const validations = [];
        
        // Campo obrigatório
        if (field.hasAttribute('required')) {
            validations.push({ 
                type: 'required', 
                message: field.dataset.errorRequired || null 
            });
        }
        
        // Validação por tipo
        if (field.type === 'email') {
            validations.push({ 
                type: 'email', 
                message: field.dataset.errorEmail || null 
            });
        }
        
        if (field.type === 'checkbox') {
            validations.push({ 
                type: 'checkbox', 
                message: field.dataset.errorCheckbox || null 
            });
        }
        
        // Validação de comprimento mínimo
        if (field.minLength > 0) {
            validations.push({ 
                type: 'minLength', 
                param: field.minLength,
                message: field.dataset.errorMinlength || null 
            });
        }
        
        // Validação de comprimento máximo
        if (field.maxLength > 0 && field.maxLength < 524288) { // Ignora valor padrão absurdo
            validations.push({ 
                type: 'maxLength', 
                param: field.maxLength,
                message: field.dataset.errorMaxlength || null 
            });
        }
        
        // Validações personalizadas via data attributes
        if (field.dataset.validate) {
            field.dataset.validate.split(' ').forEach(validationType => {
                validations.push({ 
                    type: validationType, 
                    message: field.dataset[`error${validationType.charAt(0).toUpperCase() + validationType.slice(1)}`] || null 
                });
            });
        }
        
        return validations;
    }

    /**
     * Configura tratamento de envio do formulário
     * @param {HTMLFormElement} form - O formulário
     */
    function setupFormSubmission(form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            
            // Valida todos os campos antes de enviar
            if (validateForm(form)) {
                handleFormSubmit(form);
            }
        });
    }

    /**
     * Valida todos os campos de um formulário
     * @param {HTMLFormElement} form - O formulário a validar
     * @returns {boolean} - Se o formulário é válido
     */
    function validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        inputs.forEach(input => {
            // Ignora campos hidden
            if (input.type === 'hidden' || input.type === 'submit') return;
            
            // Se qualquer campo for inválido, o formulário é inválido
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Processa o envio do formulário
     * @param {HTMLFormElement} form - O formulário a enviar
     */
    function handleFormSubmit(form) {
        // Referências para feedback visual
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        const formData = new FormData(form);
        
        // Mostra estado de carregamento
        form.classList.add(config.cssClasses.pending);
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner"></span> ${config.messages.sending}`;
        }
        
        // Determina qual formulário está sendo enviado
        let formHandler;
        
        // Escolhe o handler adequado com base no id ou na classe do formulário
        if (form.id === 'contactForm') {
            formHandler = handleContactForm;
        } else if (form.classList.contains('career-form')) {
            formHandler = handleCareerForm;
        } else {
            // Formulário genérico - simula envio
            formHandler = handleGenericForm;
        }
        
        // Processa o formulário específico
        formHandler(formData, form)
            .then(response => {
                console.log('Form submission success:', response);
                showFormSuccess(form, response.message || config.messages.success);
                
                // Limpa o formulário se foi bem sucedido
                form.reset();
            })
            .catch(error => {
                console.error('Form submission error:', error);
                showFormError(form, error.message || config.messages.error);
            })
            .finally(() => {
                // Restaura estado do botão após conclusão
                form.classList.remove(config.cssClasses.pending);
                
                if (submitButton) {
                    setTimeout(() => {
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonText;
                    }, 1000);
                }
            });
    }

    /**
     * Processa formulário de contato
     * @param {FormData} formData - Dados do formulário
     * @param {HTMLFormElement} form - Referência ao formulário
     */
    function handleContactForm(formData, form) {
        // Em produção: envia para API real usando fetch
        // Para desenvolvimento: simula envio bem-sucedido
        return new Promise((resolve, reject) => {
            // Simulação de delay de rede
            setTimeout(() => {
                // Simula probabilidade de 90% de sucesso
                if (Math.random() < 0.9) {
                    resolve({
                        success: true,
                        message: 'Sua mensagem foi enviada com sucesso! Em breve entraremos em contato.'
                    });
                } else {
                    reject({
                        success: false,
                        message: 'Não foi possível enviar sua mensagem. Por favor, tente novamente.'
                    });
                }
            }, 2000); // Simula 2 segundos de processamento
        });
    }

    /**
     * Processa formulário de candidatura
     * @param {FormData} formData - Dados do formulário
     * @param {HTMLFormElement} form - Referência ao formulário 
     */
    function handleCareerForm(formData, form) {
        // Lógica específica para formulário de candidatura
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.9) {
                    resolve({
                        success: true,
                        message: 'Sua candidatura foi recebida com sucesso! Analisaremos seu perfil e entraremos em contato.'
                    });
                } else {
                    reject({
                        success: false,
                        message: 'Não foi possível enviar sua candidatura. Por favor, tente novamente.'
                    });
                }
            }, 2500);
        });
    }

    /**
     * Processa formulário genérico
     * @param {FormData} formData - Dados do formulário
     * @param {HTMLFormElement} form - Referência ao formulário
     */
    function handleGenericForm(formData, form) {
        // Tratamento padrão para qualquer outro formulário
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() < 0.9) {
                    resolve({
                        success: true,
                        message: 'Formulário enviado com sucesso!'
                    });
                } else {
                    reject({
                        success: false,
                        message: 'Ocorreu um erro ao processar o formulário. Tente novamente.'
                    });
                }
            }, 1500);
        });
    }

    /**
     * Exibe mensagem de erro em um campo
     * @param {HTMLElement} field - O campo com erro
     * @param {string} message - A mensagem de erro
     */
    function showFieldError(field, message) {
        const parent = field.parentElement;
        field.classList.add(config.cssClasses.error);
        
        // Evita adicionar múltiplas mensagens de erro
        if (!parent.querySelector('.error-message')) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.setAttribute('aria-live', 'polite');
            errorElement.textContent = message;
            
            // Adiciona a mensagem após o campo
            field.insertAdjacentElement('afterend', errorElement);
            
            // Animação sutil de aparecimento
            setTimeout(() => {
                errorElement.classList.add('visible');
            }, 10);
        }
        
        // Configura atributos de acessibilidade
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', field.id + '-error');
    }
    
    /**
     * Remove mensagem de erro de um campo
     * @param {HTMLElement} field - O campo a limpar
     */
    function removeFieldError(field) {
        field.classList.remove(config.cssClasses.error);
        
        // Remove mensagens de erro existentes
        const parent = field.parentElement;
        const errorElement = parent.querySelector('.error-message');
        
        if (errorElement) {
            // Animação de desaparecimento
            errorElement.classList.remove('visible');
            
            // Remove depois da animação
            setTimeout(() => {
                errorElement.remove();
            }, 300);
        }
        
        // Limpa atributos de acessibilidade
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    }
    
    /**
     * Marca um campo como válido/sucesso
     * @param {HTMLElement} field - O campo
     */
    function showFieldSuccess(field) {
        field.classList.add(config.cssClasses.success);
    }
    
    /**
     * Exibe mensagem de sucesso para todo o formulário
     * @param {HTMLFormElement} form - O formulário
     * @param {string} message - Mensagem de sucesso
     */
    function showFormSuccess(form, message) {
        // Remove mensagens anteriores
        removeFormMessages(form);
        
        // Cria elemento de sucesso
        const successElement = document.createElement('div');
        successElement.className = 'form-success-message';
        successElement.setAttribute('aria-live', 'polite');
        successElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        // Adiciona ao formulário
        form.appendChild(successElement);
        form.classList.add(config.cssClasses.submitted);
        form.classList.add(config.cssClasses.success);
        
        // Remove após timeout
        setTimeout(() => {
            successElement.classList.add('fade-out');
            setTimeout(() => {
                form.classList.remove(config.cssClasses.submitted);
                form.classList.remove(config.cssClasses.success);
                successElement.remove();
            }, 500);
        }, config.delays.success);
    }
    
    /**
     * Exibe mensagem de erro para todo o formulário
     * @param {HTMLFormElement} form - O formulário
     * @param {string} message - Mensagem de erro
     */
    function showFormError(form, message) {
        // Remove mensagens anteriores
        removeFormMessages(form);
        
        // Cria elemento de erro
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error-message';
        errorElement.setAttribute('aria-live', 'assertive');
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        // Adiciona ao formulário
        form.appendChild(errorElement);
        form.classList.add(config.cssClasses.error);
        
        // Foca no primeiro campo com erro ou no início do formulário
        const firstErrorField = form.querySelector(`.${config.cssClasses.error}`);
        if (firstErrorField) {
            firstErrorField.focus();
        } else {
            form.querySelector('input, textarea, select')?.focus();
        }
        
        // Rola para o erro se estiver fora da visualização
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    /**
     * Remove todas as mensagens de formulário
     * @param {HTMLFormElement} form - O formulário
     */
    function removeFormMessages(form) {
        // Remove mensagens de sucesso
        const successElement = form.querySelector('.form-success-message');
        if (successElement) {
            successElement.remove();
        }
        
        // Remove mensagens de erro
        const errorElement = form.querySelector('.form-error-message');
        if (errorElement) {
            errorElement.remove();
        }
        
        form.classList.remove(config.cssClasses.success);
        form.classList.remove(config.cssClasses.error);
    }
    
    /**
     * Formata mensagens com templates
     * @param {string} message - Template de mensagem
     * @param {Object} params - Parâmetros para substituição
     * @returns {string} - Mensagem formatada
     */
    function formatMessage(message, params = {}) {
        return message.replace(/{(\w+)}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }
    
    /**
     * Atualiza estilos dos formulários quando o tema muda
     * @param {Object} theme - Informações do tema atual
     */
    function updateFormStyles(theme) {
        // Adapta estilos de formulário com base no tema (claro/escuro)
        document.querySelectorAll('form').forEach(form => {
            if (theme.isDark) {
                form.classList.add('dark-theme');
            } else {
                form.classList.remove('dark-theme');
            }
        });
    }
    
    /**
     * Registra validadores personalizados
     * @param {string} name - Nome do validador
     * @param {Function} validatorFn - Função de validação
     */
    function registerValidator(name, validatorFn) {
        validators[name] = validatorFn;
    }
    
    /**
     * Acesso a métodos públicos
     */
    return {
        init,
        validateField,
        validateForm,
        registerValidator,
        showFormSuccess,
        showFormError
    };
})();

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    DedalosForm.init();
});

// Expõe a API globalmente se necessário
window.DedalosForm = DedalosForm;
