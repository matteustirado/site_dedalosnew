
/**
 * Age Verification Component
 * Responsável por verificar se o usuário tem idade adequada para acessar o site
 * e controlar a exibição do modal de verificação de idade.
 */

import DOM from '../utils/dom.js';
import EventBus from '../core/event-bus.js';

class AgeVerification {
    constructor() {
        // Elementos do DOM usando o utilitário DOM
        this.modal = DOM.id('ageVerificationModal');
        this.btnYes = DOM.id('btnYes');
        this.btnNo = DOM.id('btnNo');
        this.btnTryAgain = DOM.id('btnTryAgain');
        this.underageMessage = DOM.id('underageMessage');
        this.mainContent = DOM.id('mainContent');
        this.splashScreen = DOM.id('splashScreen');
        this.lightspeedAnimation = DOM.id('lightspeedAnimation');
        
        // Verificação de elementos críticos
        if (!this.modal || !this.btnYes || !this.btnNo) {
            console.error('Elementos críticos para verificação de idade não encontrados no DOM');
            return;
        }
        
        // Chave para armazenamento no localStorage
        this.storageKey = 'dedalos_age_verified';
        
        // Tempo de expiração da verificação em dias
        this.verificationExpiry = 7;
        
        // Estado inicial
        this.isVerified = false;
        
        // Inicialização
        this.init();
    }
    
    /**
     * Inicializa o componente de verificação de idade
     */
    init() {
        // Adiciona os event listeners desde o início
        this.addEventListeners();
        
        // Verifica se já existe uma verificação válida no storage
        this.checkStoredVerification();
    }
    
    /**
     * Verifica se existe uma verificação salva e válida no localStorage
     */
    checkStoredVerification() {
        try {
            const storedDataString = localStorage.getItem(this.storageKey);
            
            if (storedDataString) {
                const storedData = JSON.parse(storedDataString);
                const { verified, timestamp } = storedData;
                const now = new Date().getTime();
                const expiryTime = this.verificationExpiry * 24 * 60 * 60 * 1000; // Dias para milissegundos
                
                // Verifica se a verificação ainda é válida (não expirou)
                if (verified && (now - timestamp < expiryTime)) {
                    this.isVerified = true;
                    this.showContent();
                    return;
                }
            }
            
            // Se chegou aqui, é porque não tem verificação válida
            this.showVerificationModal();
            
        } catch (error) {
            console.error('Erro ao verificar idade armazenada:', error);
            this.showVerificationModal();
        }
    }
    
    /**
     * Adiciona os event listeners aos botões do modal
     */
    addEventListeners() {
        // Buttons para verificação de idade
        if (this.btnYes) {
            DOM.on(this.btnYes, 'click', () => this.verifyAge(true));
        }
        
        if (this.btnNo) {
            DOM.on(this.btnNo, 'click', () => this.verifyAge(false));
        }
        
        if (this.btnTryAgain) {
            DOM.on(this.btnTryAgain, 'click', () => this.resetVerification());
        }
        
        // Escutar eventos do Event Bus
        EventBus.subscribe('splashscreen:complete', () => {
            if (!this.isVerified) {
                this.showVerificationModal();
            }
        });
    }
    
    /**
     * Processa a resposta do usuário na verificação de idade
     * @param {boolean} isAdult - Se o usuário confirmou ser maior de idade
     */
    verifyAge(isAdult) {
        console.log(`Verificação de idade: ${isAdult ? 'É adulto' : 'Não é adulto'}`);
        
        if (isAdult) {
            // Armazena a verificação no localStorage
            localStorage.setItem(this.storageKey, JSON.stringify({
                verified: true,
                timestamp: new Date().getTime()
            }));
            
            this.isVerified = true;
            this.hideVerificationModal();
            
            // Inicia a animação de transição
            this.startTransition();
            
            // Publica evento no Event Bus
            EventBus.publish('age:verified', { isAdult: true });
        } else {
            // Mostra mensagem para menores de idade
            this.showUnderageMessage();
            
            // Publica evento no Event Bus
            EventBus.publish('age:verified', { isAdult: false });
        }
    }
    
    /**
     * Exibe o modal de verificação de idade
     */
    showVerificationModal() {
        if (this.modal) {
            DOM.show(this.modal, 'flex');
            DOM.removeAttr(this.modal, 'hidden');
            
            // Esconde a mensagem de underage caso esteja visível
            if (this.underageMessage) {
                DOM.hide(this.underageMessage);
                DOM.attr(this.underageMessage, 'hidden', '');
            }
            
            // Verifica se existem os botões de verificação e os exibe
            if (this.btnYes && this.btnNo) {
                const btnContainer = this.btnYes.parentElement;
                if (btnContainer) {
                    DOM.show(btnContainer, 'flex');
                    DOM.removeAttr(btnContainer, 'hidden');
                }
            }
        }
    }
    
    /**
     * Esconde o modal de verificação de idade
     */
    hideVerificationModal() {
        if (this.modal) {
            DOM.hide(this.modal);
            DOM.attr(this.modal, 'hidden', '');
        }
    }
    
    /**
     * Exibe a mensagem para usuários menores de idade
     */
    showUnderageMessage() {
        if (this.underageMessage) {
            DOM.show(this.underageMessage, 'block');
            DOM.removeAttr(this.underageMessage, 'hidden');
        }
        
        // Esconde os botões de verificação quando mostra a mensagem de underage
        if (this.btnYes && this.btnNo) {
            const btnContainer = this.btnYes.parentElement;
            if (btnContainer) {
                DOM.hide(btnContainer);
                DOM.attr(btnContainer, 'hidden', '');
            }
        }
    }
    
    /**
     * Reseta o processo de verificação (botão "tentar novamente")
     */
    resetVerification() {
        // Esconde a mensagem para menores de idade
        if (this.underageMessage) {
            DOM.hide(this.underageMessage);
            DOM.attr(this.underageMessage, 'hidden', '');
        }
        
        // Mostra novamente os botões de verificação de idade
        if (this.btnYes && this.btnNo) {
            const btnContainer = this.btnYes.parentElement;
            if (btnContainer) {
                DOM.show(btnContainer, 'flex');
                DOM.removeAttr(btnContainer, 'hidden');
            }
        }
    }
    
    /**
     * Inicia a animação de transição após a verificação de idade
     */
    startTransition() {
        if (this.lightspeedAnimation) {
            // Inicia a animação
            DOM.addClass(this.lightspeedAnimation, 'active');
            
            // Após o término da animação, mostra o conteúdo principal
            setTimeout(() => {
                DOM.removeClass(this.lightspeedAnimation, 'active');
                this.showContent();
            }, 1500); // Tempo da animação (ajustar conforme CSS)
        } else {
            // Caso não tenha animação, mostra o conteúdo diretamente
            this.showContent();
        }
    }
    
    /**
     * Exibe o conteúdo principal do site após verificação bem-sucedida
     */
    showContent() {
        // Esconde a splash screen se ainda estiver visível
        if (this.splashScreen) {
            DOM.hide(this.splashScreen);
            DOM.attr(this.splashScreen, 'hidden', '');
        }
        
        // Mostra o conteúdo principal
        if (this.mainContent) {
            DOM.show(this.mainContent, 'block');
            DOM.removeAttr(this.mainContent, 'hidden');
            
            // Publica evento no Event Bus
            EventBus.publish('content:displayed');
        }
    }
}

// Inicializa o componente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.ageVerification = new AgeVerification();
});

// Export para uso em módulos
export default AgeVerification;
