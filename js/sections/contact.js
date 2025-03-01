/**
 * @file Gerencia o formulário de contato e processos relacionados
 * @requires js/utils/dom.js
 * @requires js/utils/validation.js
 * @requires js/utils/api.js
 * @requires js/core/event-bus.js
 * @requires js/components/notifications.js
 */

/**
 * Módulo de gerenciamento de contato
 */
const Contact = (function() {
    // Elementos do DOM
    const contactForm = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectSelect = document.getElementById('subject');
    const messageTextarea = document.getElementById('message');
    const privacyCheckbox = document.getElementById('privacy');
    const submitButton = contactForm?.querySelector('button[type="submit"]');
    
    // Estado do formulário
    let formState = {
        submitting: false,
        errors: {}
    };
    
    /**
     * Inicializa o módulo de contato
     */
    function init() {
        if (!contactForm) return;
        
        // Anexar event listeners
        contactForm.addEventListener('submit', handleSubmit);
        
        // Validação em tempo real
        nameInput.addEventListener('blur', () => validateField('name', nameInput.value));
        emailInput.addEventListener('blur', () => validateField('email', emailInput.value));
        subjectSelect.addEventListener('change', () => validateField('subject', subjectSelect.value));
        messageTextarea.addEventListener('blur', () => validateField('message', messageTextarea.value));
        
        // Evento para limpar mensagens de erro quando o usuário começa a digitar novamente
        const formInputs = contactForm.querySelectorAll('input, textarea, select');
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Remove a classe de erro quando o campo recebe foco
                input.closest('.form-group')?.classList.remove('has-error');
                
                // Limpa a mensagem de erro específica
                const errorElement = input.closest('.form-group')?.querySelector('.error-message');
                if (errorElement) {
                    errorElement.remove();
                }
            });
        });
        
        // Publicar evento de inicialização
        if (window.EventBus) {
            EventBus.publish('contact:initialized');
        }
    }
    
    /**
     * Valida um campo específico do formulário
     * @param {string} fieldName - Nome do campo a ser validado
     * @param {string} value - Valor do campo
     * @returns {boolean} - Verdadeiro se o campo for válido
     */
    function validateField(fieldName, value) {
        let isValid = true;
        let errorMessage = '';
        
        // Limpa erro anterior
        formState.errors[fieldName] = null;
        
        switch (fieldName) {
            case 'name':
                if (!value.trim()) {
                    isValid = false;
                    errorMessage = 'Por favor, informe seu nome.';
                } else if (value.trim().length < 3) {
                    isValid = false;
                    errorMessage = 'O nome deve ter pelo menos 3 caracteres.';
                }
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value.trim()) {
                    isValid = false;
                    errorMessage = 'Por favor, informe seu e-mail.';
                } else if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Por favor, informe um e-mail válido.';
                }
                break;
                
            case 'subject':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Por favor, selecione um assunto.';
                }
                break;
                
            case 'message':
                if (!value.trim()) {
                    isValid = false;
                    errorMessage = 'Por favor, escreva sua mensagem.';
                } else if (value.trim().length < 10) {
                    isValid = false;
                    errorMessage = 'Sua mensagem deve ter pelo menos 10 caracteres.';
                }
                break;
                
            case 'privacy':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Você precisa concordar com a Política de Privacidade.';
                }
                break;
        }
        
        // Se inválido, armazena o erro e atualiza a UI
        if (!isValid) {
            formState.errors[fieldName] = errorMessage;
            showFieldError(fieldName, errorMessage);
        } else {
            clearFieldError(fieldName);
        }
        
        return isValid;
    }
    
    /**
     * Exibe um erro para um campo específico
     * @param {string} fieldName - Nome do campo com erro
     * @param {string} message - Mensagem de erro
     */
    function showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        if (!field) return;
        
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        // Adiciona classe de erro
        formGroup.classList.add('has-error');
        
        // Remove mensagem de erro anterior, se existir
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Cria elemento de erro
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.setAttribute('aria-live', 'polite');
        
        // Adiciona após o campo
        formGroup.appendChild(errorElement);
    }
    
    /**
     * Limpa o erro de um campo específico
     * @param {string} fieldName - Nome do campo para limpar o erro
     */
    function clearFieldError(fieldName) {
        const field = document.getElementById(fieldName);
        if (!field) return;
        
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;
        
        // Remove classe de erro
        formGroup.classList.remove('has-error');
        
        // Remove mensagem de erro
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    /**
     * Valida o formulário inteiro
     * @returns {boolean} - Verdadeiro se o formulário for válido
     */
    function validateForm() {
        const nameValid = validateField('name', nameInput.value);
        const emailValid = validateField('email', emailInput.value);
        const subjectValid = validateField('subject', subjectSelect.value);
        const messageValid = validateField('message', messageTextarea.value);
        const privacyValid = validateField('privacy', privacyCheckbox.checked);
        
        return nameValid && emailValid && subjectValid && messageValid && privacyValid;
    }
    
    /**
     * Manipula o envio do formulário
     * @param {Event} e - Evento de submit
     */
    function handleSubmit(e) {
        e.preventDefault();
        
        // Evita múltiplos envios
        if (formState.submitting) return;
        
        // Valida o formulário
        if (!validateForm()) {
            showFormError('Por favor, corrija os erros no formulário antes de enviar.');
            return;
        }
        
        // Atualiza estado do formulário
        formState.submitting = true;
        updateSubmitButtonState(true);
        
        // Coleta os dados do formulário
        const formData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            subject: subjectSelect.value,
            message: messageTextarea.value.trim(),
            acceptedPrivacy: privacyCheckbox.checked
        };
        
        // Publica evento de envio iniciado
        if (window.EventBus) {
            EventBus.publish('contact:submitStarted', formData);
        }
        
        // Simula envio para o servidor
        sendFormData(formData)
            .then(response => {
                // Formulário enviado com sucesso
                handleFormSuccess();
                
                // Publica evento de envio bem-sucedido
                if (window.EventBus) {
                    EventBus.publish('contact:submitSuccess', response);
                }
            })
            .catch(error => {
                // Erro no envio do formulário
                handleFormError(error);
                
                // Publica evento de erro no envio
                if (window.EventBus) {
                    EventBus.publish('contact:submitError', error);
                }
            })
            .finally(() => {
                // Atualiza estado do formulário
                formState.submitting = false;
                updateSubmitButtonState(false);
            });
    }
    
    /**
     * Envia os dados do formulário para o servidor (simulado)
     * @param {Object} formData - Dados do formulário
     * @returns {Promise} - Promessa que resolve com a resposta do servidor
     */
    function sendFormData(formData) {
        // Simulação de envio de dados com atraso de 1.5 segundos
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulação de uma resposta bem-sucedida do servidor (90% de chances)
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        message: 'Sua mensagem foi enviada com sucesso! Entraremos em contato em breve.',
                        id: 'msg_' + Date.now()
                    });
                } else {
                    // Simulação de erro do servidor (10% de chances)
                    reject({
                        success: false,
                        message: 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente mais tarde.',
                        code: 'SERVER_ERROR'
                    });
                }
            }, 1500);
        });
        
        // Implementação real com API (exemplo comentado)
        /*
        if (window.API) {
            return API.post('/api/contact', formData);
        } else {
            return fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor');
                }
                return response.json();
            });
        }
        */
    }
    
    /**
     * Atualiza o estado visual do botão de envio
     * @param {boolean} loading - Se o formulário está sendo enviado
     */
    function updateSubmitButtonState(loading) {
        if (!submitButton) return;
        
        if (loading) {
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            submitButton.innerHTML = '<span class="loader"></span> Enviando...';
        } else {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            submitButton.textContent = 'Enviar Mensagem';
        }
    }
    
    /**
     * Exibe uma mensagem de erro geral do formulário
     * @param {string} message - Mensagem de erro
     */
    function showFormError(message) {
        // Remove mensagem anterior se existir
        const existingMessage = contactForm.querySelector('.form-error-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Cria elemento de erro
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error-message';
        errorElement.textContent = message;
        errorElement.setAttribute('aria-live', 'assertive');
        errorElement.setAttribute('role', 'alert');
        
        // Adiciona no topo do formulário
        contactForm.prepend(errorElement);
        
        // Scroll para o erro
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Configura para desaparecer após 8 segundos
        setTimeout(() => {
            errorElement.classList.add('fade-out');
            setTimeout(() => errorElement.remove(), 500);
        }, 8000);
    }
    
    /**
     * Exibe uma mensagem de sucesso após o envio do formulário
     * @param {string} message - Mensagem de sucesso
     */
    function showFormSuccess(message) {
        // Cria elemento de sucesso substituindo o formulário
        const successElement = document.createElement('div');
        successElement.className = 'form-success-message';
        
        // Adiciona conteúdo à mensagem de sucesso
        successElement.innerHTML = `
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Mensagem Enviada!</h3>
            <p>${message}</p>
            <button class="btn btn-new-message">Enviar Nova Mensagem</button>
        `;
        
        // Oculta o formulário e mostra a mensagem de sucesso
        contactForm.style.display = 'none';
        contactForm.parentNode.insertBefore(successElement, contactForm);
        
        // Adiciona evento ao botão de nova mensagem
        const newMessageButton = successElement.querySelector('.btn-new-message');
        if (newMessageButton) {
            newMessageButton.addEventListener('click', resetForm);
        }
    }
    
    /**
     * Gerencia o sucesso no envio do formulário
     */
    function handleFormSuccess() {
        // Exibe mensagem de sucesso
        showFormSuccess('Sua mensagem foi enviada com sucesso! Entraremos em contato em breve através do e-mail fornecido.');
        
        // Tenta notificar se o componente notifications estiver disponível
        if (window.Notifications) {
            Notifications.show({
                type: 'success',
                title: 'Mensagem Enviada',
                message: 'Sua mensagem foi enviada com sucesso!',
                duration: 5000
            });
        }
    }
    
    /**
     * Gerencia o erro no envio do formulário
     * @param {Object} error - Objeto de erro retornado pelo servidor
     */
    function handleFormError(error) {
        // Exibe mensagem de erro
        showFormError(error.message || 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente mais tarde.');
        
        // Tenta notificar se o componente notifications estiver disponível
        if (window.Notifications) {
            Notifications.show({
                type: 'error',
                title: 'Erro no Envio',
                message: error.message || 'Ocorreu um erro ao enviar sua mensagem.',
                duration: 5000
            });
        }
        
        // Log do erro para depuração
        console.error('Erro no envio do formulário:', error);
    }
    
    /**
     * Reseta o formulário para o estado inicial
     */
    function resetForm() {
        // Remove mensagem de sucesso se existir
        const successMessage = document.querySelector('.form-success-message');
        if (successMessage) {
            successMessage.remove();
        }
        
        // Exibe o formulário novamente
        contactForm.style.display = '';
        
        // Limpa os campos
        contactForm.reset();
        
        // Limpa todos os erros
        const errorMessages = contactForm.querySelectorAll('.error-message');
        errorMessages.forEach(el => el.remove());
        
        const errorGroups = contactForm.querySelectorAll('.has-error');
        errorGroups.forEach(el => el.classList.remove('has-error'));
        
        // Reseta o estado do formulário
        formState = {
            submitting: false,
            errors: {}
        };
        
        // Foca no primeiro campo
        if (nameInput) {
            nameInput.focus();
        }
    }
    
    /**
     * Inicializa os eventos para os botões de candidatura nas vagas de emprego
     */
    function initCareerButtons() {
        const applyButtons = document.querySelectorAll('.btn-apply');
        if (!applyButtons.length) return;
        
        applyButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Obtém os detalhes da vaga
                const careerCard = this.closest('.career-card');
                if (!careerCard) return;
                
                const position = careerCard.querySelector('h5')?.textContent || 'Vaga';
                const location = careerCard.querySelector('.career-location')?.textContent || '';
                
                // Rola até o formulário de contato
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Preenche o assunto automaticamente
                if (subjectSelect) {
                    // Procura a opção para vagas de emprego, ou seleciona "Outro"
                    let found = false;
                    for (let i = 0; i < subjectSelect.options.length; i++) {
                        if (subjectSelect.options[i].value === 'career') {
                            subjectSelect.selectedIndex = i;
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found && subjectSelect.options.length > 0) {
                        // Seleciona a última opção ("Outro") se não encontrar opção específica
                        subjectSelect.selectedIndex = subjectSelect.options.length - 1;
                    }
                    
                    // Dispara o evento change para atualizar validações
                    subjectSelect.dispatchEvent(new Event('change'));
                }
                
                // Prepara uma mensagem automática
                if (messageTextarea) {
                    messageTextarea.value = `Olá, gostaria de me candidatar à vaga de ${position} em ${location}. Seguem minhas informações para contato.`;
                    messageTextarea.dispatchEvent(new Event('blur'));
                }
                
                // Foca no campo de nome para começar o preenchimento
                if (nameInput) {
                    nameInput.focus();
                }
                
                // Publica evento de candidatura iniciada
                if (window.EventBus) {
                    EventBus.publish('careers:applyStarted', {
                        position,
                        location
                    });
                }
            });
        });
    }
    
    // API pública do módulo
    return {
        init: function() {
            init();
            initCareerButtons();
            
            return this;
        },
        resetForm: resetForm,
        validateField: validateField
    };
})();

// Inicializa o módulo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    Contact.init();
});

// Exporta o módulo para uso global
window.Contact = Contact;

