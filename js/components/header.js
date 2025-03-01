/**
 * Header Component
 * 
 * Gerencia comportamentos do cabeçalho como:
 * - Efeitos de scroll (fixação, mudança de tamanho)
 * - Menu mobile responsivo (toggle e animações)
 * - Navegação suave para âncoras
 * - Estado ativo dos links de navegação
 */

// Uso de IIFE para isolar o escopo
(function() {
    'use strict';

    // Importar utilitários do DOM (supondo que já foram carregados)
    const EventBus = window.EventBus || { subscribe: () => {}, publish: () => {} };

    // Elementos do DOM
    let header, 
        mobileMenuToggle, 
        mobileNav, 
        navLinks,
        loginButton;

    // Configurações
    const config = {
        scrollThreshold: 50,
        scrolledClass: 'header-scrolled',
        mobileBreakpoint: 768,
        menuOpenClass: 'menu-open',
        activeNavClass: 'active',
        navItemSelector: '.main-nav ul li a',
        sectionOffset: 100 // Offset para considerar o header fixo ao rolar para seções
    };

    /**
     * Inicializa o componente de cabeçalho
     */
    function init() {
        // Captura elementos do DOM
        header = document.querySelector('.main-header');
        mobileMenuToggle = document.getElementById('mobileMenuToggle');
        mobileNav = document.querySelector('.main-nav');
        navLinks = document.querySelectorAll(config.navItemSelector);
        loginButton = document.querySelector('.btn-login');

        if (!header) return;
        
        // Configura event listeners
        setupEventListeners();
        
        // Verifica o estado inicial do scroll
        checkScrollPosition();
        
        // Configura a ativação do item de navegação com base na URL atual
        highlightActiveNavItem();
        
        // Log de inicialização bem-sucedida
        console.log('Header component initialized');
        
        // Notifica outros componentes via event bus
        EventBus.publish('header:initialized', {});
    }

    /**
     * Configura todos os event listeners
     */
    function setupEventListeners() {
        // Listener para o scroll da janela
        window.addEventListener('scroll', handleScroll);
        
        // Listener para redimensionamento da janela
        window.addEventListener('resize', handleResize);
        
        // Listener para o botão do menu mobile
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        }
        
        // Listeners para os links de navegação
        navLinks.forEach(link => {
            link.addEventListener('click', handleNavLinkClick);
        });
        
        // Listener para o botão de login
        if (loginButton) {
            loginButton.addEventListener('click', handleLoginClick);
            
            // Se tiver tooltip, configura os eventos de hover
            if (loginButton.dataset.tooltip) {
                loginButton.addEventListener('mouseenter', showTooltip);
                loginButton.addEventListener('mouseleave', hideTooltip);
            }
        }
        
        // Listener para cliques fora do menu mobile (para fechar automaticamente)
        document.addEventListener('click', closeMenuOnClickOutside);
        
        // Listener para a tecla ESC (para fechar o menu)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllDropdowns();
        });
    }

    /**
     * Manipula o evento de scroll
     */
    function handleScroll() {
        checkScrollPosition();
        updateActiveNavOnScroll();
    }

    /**
     * Verifica a posição do scroll e aplica/remove classes
     */
    function checkScrollPosition() {
        if (!header) return;
        
        if (window.scrollY > config.scrollThreshold) {
            header.classList.add(config.scrolledClass);
        } else {
            header.classList.remove(config.scrolledClass);
        }
    }

    /**
     * Manipula o redimensionamento da janela
     */
    function handleResize() {
        // Fecha o menu mobile se a tela for redimensionada para desktop
        if (window.innerWidth > config.mobileBreakpoint && 
            header.classList.contains(config.menuOpenClass)) {
            closeMobileMenu();
        }
    }

    /**
     * Alterna o estado do menu mobile
     */
    function toggleMobileMenu() {
        if (!header || !mobileMenuToggle) return;
        
        const isOpen = header.classList.contains(config.menuOpenClass);
        
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    /**
     * Abre o menu mobile
     */
    function openMobileMenu() {
        if (!header || !mobileMenuToggle || !mobileNav) return;
        
        header.classList.add(config.menuOpenClass);
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        mobileMenuToggle.setAttribute('aria-label', 'Fechar menu');
        
        // Adiciona animação de entrada
        mobileNav.classList.add('animate-in');
        
        // Notifica outros componentes
        EventBus.publish('header:mobileMenuOpened', {});
    }

    /**
     * Fecha o menu mobile
     */
    function closeMobileMenu() {
        if (!header || !mobileMenuToggle || !mobileNav) return;
        
        header.classList.remove(config.menuOpenClass);
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.setAttribute('aria-label', 'Abrir menu');
        
        // Adiciona animação de saída
        mobileNav.classList.remove('animate-in');
        
        // Notifica outros componentes
        EventBus.publish('header:mobileMenuClosed', {});
    }

    /**
     * Fecha o menu mobile se o clique for fora dele
     */
    function closeMenuOnClickOutside(event) {
        if (!header || !mobileNav || !mobileMenuToggle) return;
        
        // Se o menu estiver aberto e o clique não for no menu ou no botão toggle
        if (header.classList.contains(config.menuOpenClass) && 
            !mobileNav.contains(event.target) && 
            !mobileMenuToggle.contains(event.target)) {
            closeMobileMenu();
        }
    }

    /**
     * Fecha todos os dropdowns e menus abertos
     */
    function closeAllDropdowns() {
        if (header && header.classList.contains(config.menuOpenClass)) {
            closeMobileMenu();
        }
    }

    /**
     * Manipula cliques nos links de navegação
     */
    function handleNavLinkClick(event) {
        const link = event.currentTarget;
        const href = link.getAttribute('href');
        
        // Se for link para uma seção da mesma página
        if (href.startsWith('#')) {
            event.preventDefault();
            
            // Fecha o menu mobile se estiver aberto
            if (header.classList.contains(config.menuOpenClass)) {
                closeMobileMenu();
            }
            
            // Rola suavemente até a seção
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                scrollToSection(targetElement);
            }
        }
        
        // Destaca o item clicado
        navLinks.forEach(navLink => navLink.parentElement.classList.remove(config.activeNavClass));
        link.parentElement.classList.add(config.activeNavClass);
    }

    /**
     * Rola suavemente até a seção alvo
     */
    function scrollToSection(element) {
        const headerHeight = header.offsetHeight;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerHeight - config.sectionOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        // Publica evento para outros componentes
        EventBus.publish('header:scrolledToSection', { 
            sectionId: element.id,
            section: element
        });
    }

    /**
     * Destaca o item de navegação com base no scroll da página
     */
    function updateActiveNavOnScroll() {
        // Implementa o destaque do item de navegação com base na seção visível
        // Usa um pouco de debounce para não rodar constantemente
        if (!window.requestAnimationFrame) return;
        
        window.requestAnimationFrame(() => {
            // Obtém todas as seções
            const sections = Array.from(navLinks).map(link => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    const section = document.getElementById(sectionId);
                    return { link, section };
                }
                return null;
            }).filter(item => item && item.section);
            
            // Encontra a seção visível
            const headerHeight = header.offsetHeight;
            let currentSection = null;
            
            sections.forEach(({ section, link }) => {
                const sectionTop = section.offsetTop - headerHeight - config.sectionOffset;
                const sectionBottom = sectionTop + section.offsetHeight;
                
                // Se o scroll estiver dentro dos limites da seção
                if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                    currentSection = link;
                }
            });
            
            // Destaca o item correspondente
            if (currentSection) {
                navLinks.forEach(navLink => navLink.parentElement.classList.remove(config.activeNavClass));
                currentSection.parentElement.classList.add(config.activeNavClass);
            }
        });
    }

    /**
     * Destaca o item de navegação ativo com base na URL atual
     */
    function highlightActiveNavItem() {
        const currentUrl = window.location.hash || '#hero';
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === currentUrl) {
                link.parentElement.classList.add(config.activeNavClass);
            } else {
                link.parentElement.classList.remove(config.activeNavClass);
            }
        });
    }

    /**
     * Manipula o clique no botão de login
     */
    function handleLoginClick(event) {
        // Publicar evento para ser capturado pelo componente de login
        EventBus.publish('header:loginButtonClicked', { event });
    }

    /**
     * Exibe tooltip ao passar o mouse sobre elementos
     */
    function showTooltip(event) {
        const button = event.currentTarget;
        const tooltipText = button.dataset.tooltip;
        
        if (!tooltipText) return;
        
        // Cria o tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        
        // Insere no DOM
        document.body.appendChild(tooltip);
        
        // Posiciona o tooltip
        const buttonRect = button.getBoundingClientRect();
        tooltip.style.top = `${buttonRect.bottom + 10}px`;
        tooltip.style.left = `${buttonRect.left + (buttonRect.width / 2)}px`;
        tooltip.style.transform = 'translateX(-50%)';
        
        // Adiciona classe para animar entrada
        setTimeout(() => tooltip.classList.add('visible'), 10);
        
        // Armazena referência ao tooltip
        button._tooltip = tooltip;
    }

    /**
     * Esconde tooltip
     */
    function hideTooltip(event) {
        const button = event.currentTarget;
        const tooltip = button._tooltip;
        
        if (!tooltip) return;
        
        // Anima saída
        tooltip.classList.remove('visible');
        
        // Remove do DOM após animação
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
            button._tooltip = null;
        }, 200);
    }

    // API Pública
    window.HeaderComponent = {
        init,
        closeMobileMenu,
        openMobileMenu,
        scrollToSection: (sectionId) => {
            const section = document.getElementById(sectionId);
            if (section) scrollToSection(section);
        }
    };

    // Inicializa quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', init);

    // Também exporta para o sistema de módulos se estiver disponível
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.HeaderComponent;
    }
})();
