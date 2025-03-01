/**
 * @file social-feeds.js
 * @description Integração e exibição de postagens de redes sociais para o Dédalos Bar.
 * Gerencia a conexão com APIs sociais e renderiza feeds no site.
 */

// Inicializa o módulo usando o padrão IIFE para encapsulamento
const SocialFeeds = (function() {
    // Configurações dos feeds sociais
    const config = {
        twitter: {
            handle: '@dedalosbar',
            maxPosts: 5,
            updateInterval: 300000, // 5 minutos em milissegundos
        },
        instagram: {
            handle: 'dedalosbar',
            maxPosts: 6,
            updateInterval: 600000, // 10 minutos em milissegundos
        }
    };

    // Elementos DOM
    let elements = {
        twitterContainer: null,
        instagramContainer: null,
        loadingIndicators: null,
        errorMessages: null
    };

    // Cache dos dados carregados
    let cache = {
        twitter: {
            posts: [],
            lastUpdate: null
        },
        instagram: {
            posts: [],
            lastUpdate: null
        }
    };

    // Timers para atualizações automáticas
    let timers = {
        twitter: null,
        instagram: null
    };

    /**
     * Inicializa o módulo
     * @param {Object} options - Opções de configuração
     */
    function init(options = {}) {
        console.log('Inicializando módulo SocialFeeds...');
        
        // Mescla opções personalizadas com as padrões
        if (options.twitter) Object.assign(config.twitter, options.twitter);
        if (options.instagram) Object.assign(config.instagram, options.instagram);
        
        // Inicializa elementos DOM
        cacheElements();
        
        // Registra os ouvintes de eventos
        bindEvents();
        
        // Carrega os feeds iniciais
        loadTwitterFeed();
        loadInstagramFeed();
        
        // Configura atualizações automáticas
        setupAutoRefresh();
        
        // Reporta inicialização pelo event-bus
        if (window.EventBus) {
            EventBus.publish('socialFeeds:initialized');
        }
        
        return this;
    }

    /**
     * Referencia elementos DOM necessários
     */
    function cacheElements() {
        elements.twitterContainer = document.getElementById('twitterFeed');
        elements.instagramContainer = document.getElementById('instagramFeed');
        elements.loadingIndicators = document.querySelectorAll('.social-feed-loading');
        elements.errorMessages = document.querySelectorAll('.social-feed-error');
    }

    /**
     * Adiciona listeners de eventos
     */
    function bindEvents() {
        // Ouvinte para o botão de atualizar feeds
        const refreshButtons = document.querySelectorAll('.refresh-social-feed');
        if (refreshButtons) {
            refreshButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    const platform = this.dataset.platform;
                    if (platform === 'twitter') {
                        loadTwitterFeed(true);
                    } else if (platform === 'instagram') {
                        loadInstagramFeed(true);
                    }
                });
            });
        }

        // Ouvinte para eventos de visibilidade da página
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Recarrega feeds quando a página ficar visível novamente
                // se a última atualização for mais antiga que 5 minutos
                const now = Date.now();
                if (cache.twitter.lastUpdate && (now - cache.twitter.lastUpdate > 300000)) {
                    loadTwitterFeed();
                }
                if (cache.instagram.lastUpdate && (now - cache.instagram.lastUpdate > 300000)) {
                    loadInstagramFeed();
                }
            }
        });
    }

    /**
     * Configura atualizações automáticas
     */
    function setupAutoRefresh() {
        // Limpa timers existentes
        if (timers.twitter) clearInterval(timers.twitter);
        if (timers.instagram) clearInterval(timers.instagram);
        
        // Configura novos timers
        timers.twitter = setInterval(loadTwitterFeed, config.twitter.updateInterval);
        timers.instagram = setInterval(loadInstagramFeed, config.instagram.updateInterval);
    }

    /**
     * Carrega o feed do Twitter
     * @param {boolean} force - Força atualização ignorando cache
     */
    function loadTwitterFeed(force = false) {
        if (!elements.twitterContainer) return;
        
        // Verifica se precisa atualizar
        const now = Date.now();
        if (!force && cache.twitter.lastUpdate && (now - cache.twitter.lastUpdate < 300000)) {
            return; // Usa cache se a última atualização foi recente (menos de 5 minutos)
        }
        
        showLoading('twitter');
        
        // Em ambiente de produção, usaria a função para chamadas de API do arquivo api.js
        fetchTwitterPosts()
            .then(posts => {
                cache.twitter.posts = posts;
                cache.twitter.lastUpdate = now;
                renderTwitterFeed(posts);
                hideLoading('twitter');
            })
            .catch(error => {
                console.error('Erro ao carregar feed do Twitter:', error);
                showError('twitter', 'Não foi possível carregar as últimas postagens. Tente novamente mais tarde.');
            });
    }

    /**
     * Carrega o feed do Instagram
     * @param {boolean} force - Força atualização ignorando cache
     */
    function loadInstagramFeed(force = false) {
        if (!elements.instagramContainer) return;
        
        // Verifica se precisa atualizar
        const now = Date.now();
        if (!force && cache.instagram.lastUpdate && (now - cache.instagram.lastUpdate < 600000)) {
            return; // Usa cache se a última atualização foi recente (menos de 10 minutos)
        }
        
        showLoading('instagram');
        
        fetchInstagramPosts()
            .then(posts => {
                cache.instagram.posts = posts;
                cache.instagram.lastUpdate = now;
                renderInstagramFeed(posts);
                hideLoading('instagram');
            })
            .catch(error => {
                console.error('Erro ao carregar feed do Instagram:', error);
                showError('instagram', 'Não foi possível carregar as últimas postagens. Tente novamente mais tarde.');
            });
    }

    /**
     * Busca postagens do Twitter (simulação)
     * @returns {Promise<Array>} Promessa resolvida com array de posts
     */
    function fetchTwitterPosts() {
        // NOTA: Em produção, isto usaria a API real do Twitter/X
        // Por enquanto, simulamos com dados mockados
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 't1',
                        text: 'Noite Rainbow chegando! 🌈 Preparem-se para a melhor festa da temporada no Dédalos Bar. DJ internacional e open bar premium até às 23h!',
                        date: new Date(Date.now() - 86400000), // Ontem
                        likes: 45,
                        retweets: 12,
                        url: 'https://twitter.com/dedalosbar/status/1',
                        author: {
                            name: 'Dédalos Bar',
                            handle: '@dedalosbar',
                            avatar: 'assets/images/logo/logo-small.png'
                        }
                    },
                    {
                        id: 't2',
                        text: 'Quinta é dia de Karaokê do Labirinto! 🎤 Venha mostrar seu talento e ganhe drinks especiais. #DedalosExperience #KaraokeNight',
                        date: new Date(Date.now() - 172800000), // 2 dias atrás
                        likes: 36,
                        retweets: 8,
                        url: 'https://twitter.com/dedalosbar/status/2',
                        author: {
                            name: 'Dédalos Bar',
                            handle: '@dedalosbar',
                            avatar: 'assets/images/logo/logo-small.png'
                        }
                    },
                    {
                        id: 't3',
                        text: 'Hoje temos 42 players curtindo o Dédalos agora. Vem ser o próximo! 🔥 #NivelSeguinte',
                        date: new Date(Date.now() - 259200000), // 3 dias atrás
                        likes: 23,
                        retweets: 5,
                        url: 'https://twitter.com/dedalosbar/status/3',
                        author: {
                            name: 'Dédalos Bar',
                            handle: '@dedalosbar',
                            avatar: 'assets/images/logo/logo-small.png'
                        }
                    }
                ]);
            }, 800); // Simulando delay de rede
        });
    }

    /**
     * Busca postagens do Instagram (simulação)
     * @returns {Promise<Array>} Promessa resolvida com array de posts
     */
    function fetchInstagramPosts() {
        // NOTA: Em produção, isto usaria a API real do Instagram
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 'i1',
                        imageUrl: 'assets/images/events/event1.jpg',
                        caption: 'Noite Rainbow chegando! 🌈 #DedalosExperience',
                        likes: 128,
                        comments: 32,
                        date: new Date(Date.now() - 86400000), // Ontem
                        url: 'https://instagram.com/p/abc123',
                        author: {
                            name: 'Dédalos Bar',
                            handle: 'dedalosbar',
                            avatar: 'assets/images/logo/logo-small.png'
                        }
                    },
                    {
                        id: 'i2',
                        imageUrl: 'assets/images/events/event2.jpg',
                        caption: 'Baile do Labirinto em preparação! 🕺 Festa temática com decoração especial e performances exclusivas.',
                        likes: 98,
                        comments: 24,
                        date: new Date(Date.now() - 172800000), // 2 dias atrás
                        url: 'https://instagram.com/p/def456',
                        author: {
                            name: 'Dédalos Bar',
                            handle: 'dedalosbar',
                            avatar: 'assets/images/logo/logo-small.png'
                        }
                    },
                    {
                        id: 'i3',
                        imageUrl: 'assets/images/events/event3.jpg',
                        caption: 'Rodeio dos Solteiros - Se preparem para a melhor noite country de SP! 🤠 #DedalosExperience',
                        likes: 145,
                        comments: 38,
                        date: new Date(Date.now() - 259200000), // 3 dias atrás
                        url: 'https://instagram.com/p/ghi789',
                        author: {
                            name: 'Dédalos Bar',
                            handle: 'dedalosbar',
                            avatar: 'assets/images/logo/logo-small.png'
                        }
                    }
                ]);
            }, 800); // Simulando delay de rede
        });
    }

    /**
     * Renderiza o feed do Twitter
     * @param {Array} posts - Array de postagens
     */
    function renderTwitterFeed(posts) {
        if (!elements.twitterContainer) return;
        
        // Limpa o contêiner antes de renderizar
        elements.twitterContainer.innerHTML = '';
        
        if (!posts || posts.length === 0) {
            elements.twitterContainer.innerHTML = '<p class="social-feed-empty">Não há postagens recentes para exibir.</p>';
            return;
        }
        
        posts.forEach(post => {
            const postElement = createTwitterPostElement(post);
            elements.twitterContainer.appendChild(postElement);
        });
        
        // Adiciona um link para ver mais
        const moreLink = document.createElement('a');
        moreLink.href = `https://twitter.com/${config.twitter.handle.replace('@', '')}`;
        moreLink.className = 'social-feed-more-link';
        moreLink.target = '_blank';
        moreLink.rel = 'noopener noreferrer';
        moreLink.textContent = 'Ver mais no Twitter';
        elements.twitterContainer.appendChild(moreLink);
    }

    /**
     * Renderiza o feed do Instagram
     * @param {Array} posts - Array de postagens
     */
    function renderInstagramFeed(posts) {
        if (!elements.instagramContainer) return;
        
        // Limpa o contêiner antes de renderizar
        elements.instagramContainer.innerHTML = '';
        
        if (!posts || posts.length === 0) {
            elements.instagramContainer.innerHTML = '<p class="social-feed-empty">Não há postagens recentes para exibir.</p>';
            return;
        }
        
        // Cria grid para postagens do Instagram
        const grid = document.createElement('div');
        grid.className = 'instagram-grid';
        
        posts.forEach(post => {
            const postElement = createInstagramPostElement(post);
            grid.appendChild(postElement);
        });
        
        elements.instagramContainer.appendChild(grid);
        
        // Adiciona um link para ver mais
        const moreLink = document.createElement('a');
        moreLink.href = `https://instagram.com/${config.instagram.handle}`;
        moreLink.className = 'social-feed-more-link';
        moreLink.target = '_blank';
        moreLink.href = `https://instagram.com/${config.instagram.handle}`;
        moreLink.className = 'social-feed-more-link';
        moreLink.target = '_blank';
        moreLink.rel = 'noopener noreferrer';
        moreLink.textContent = 'Ver mais no Instagram';
        elements.instagramContainer.appendChild(moreLink);
    }

    /**
     * Cria elemento DOM para postagem do Twitter
     * @param {Object} post - Dados da postagem
     * @returns {HTMLElement} Elemento DOM da postagem
     */
    function createTwitterPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'twitter-post';
        postElement.setAttribute('data-post-id', post.id);
        
        // Formata a data relativa (ex: "2h atrás", "ontem")
        const formattedDate = formatRelativeDate(post.date);
        
        // Estrutura HTML da postagem
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
                <div class="author-info">
                    <div class="author-name">${post.author.name}</div>
                    <div class="author-handle">${post.author.handle}</div>
                </div>
                <div class="post-date">${formattedDate}</div>
            </div>
            <div class="post-content">${formatTwitterText(post.text)}</div>
            <div class="post-actions">
                <a href="${post.url}" class="post-action" target="_blank" rel="noopener noreferrer" aria-label="Ver no Twitter">
                    <i class="fab fa-twitter"></i>
                </a>
                <span class="post-stat post-likes">
                    <i class="far fa-heart"></i> ${post.likes}
                </span>
                <span class="post-stat post-retweets">
                    <i class="fas fa-retweet"></i> ${post.retweets}
                </span>
            </div>
        `;
        
        return postElement;
    }

    /**
     * Cria elemento DOM para postagem do Instagram
     * @param {Object} post - Dados da postagem
     * @returns {HTMLElement} Elemento DOM da postagem
     */
    function createInstagramPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'instagram-post';
        postElement.setAttribute('data-post-id', post.id);
        
        // Formata a data relativa
        const formattedDate = formatRelativeDate(post.date);
        
        // Estrutura HTML da postagem
        postElement.innerHTML = `
            <a href="${post.url}" class="instagram-post-link" target="_blank" rel="noopener noreferrer">
                <div class="post-image-container">
                    <img src="${post.imageUrl}" alt="${post.caption}" class="post-image" loading="lazy">
                    <div class="post-overlay">
                        <div class="post-stats">
                            <span class="post-likes"><i class="far fa-heart"></i> ${post.likes}</span>
                            <span class="post-comments"><i class="far fa-comment"></i> ${post.comments}</span>
                        </div>
                    </div>
                </div>
                <div class="post-caption">
                    <p>${truncateText(post.caption, 60)}</p>
                    <span class="post-date">${formattedDate}</span>
                </div>
            </a>
        `;
        
        return postElement;
    }

    /**
     * Formata texto do Twitter (hashtags, menções, links)
     * @param {string} text - Texto original da postagem
     * @returns {string} HTML formatado
     */
    function formatTwitterText(text) {
        if (!text) return '';
        
        // Converte URLs em links clicáveis
        let formattedText = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Converte hashtags em links
        formattedText = formattedText.replace(
            /#(\w+)/g, 
            '<a href="https://twitter.com/hashtag/$1" target="_blank" rel="noopener noreferrer">#$1</a>'
        );
        
        // Converte menções em links
        formattedText = formattedText.replace(
            /@(\w+)/g, 
            '<a href="https://twitter.com/$1" target="_blank" rel="noopener noreferrer">@$1</a>'
        );
        
        return formattedText;
    }

    /**
     * Trunca texto para exibição limitada
     * @param {string} text - Texto original
     * @param {number} maxLength - Comprimento máximo
     * @returns {string} Texto truncado
     */
    function truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Formata data relativa (ex: "2h atrás", "ontem")
     * @param {Date} date - Data original
     * @returns {string} Texto formatado
     */
    function formatRelativeDate(date) {
        if (!date) return '';
        
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // diferença em segundos
        
        if (diff < 60) return 'agora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
        if (diff < 172800) return 'ontem';
        if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
        
        // Para posts mais antigos, exibe a data formatada
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short'
        });
    }

    /**
     * Exibe indicador de carregamento
     * @param {string} platform - Nome da plataforma
     */
    function showLoading(platform) {
        if (!elements.loadingIndicators) return;
        
        // Oculta possíveis mensagens de erro
        hideError(platform);
        
        // Encontra o indicador específico para a plataforma
        const loader = Array.from(elements.loadingIndicators).find(
            el => el.dataset.platform === platform
        );
        
        if (loader) {
            loader.hidden = false;
        }
    }

    /**
     * Oculta indicador de carregamento
     * @param {string} platform - Nome da plataforma
     */
    function hideLoading(platform) {
        if (!elements.loadingIndicators) return;
        
        const loader = Array.from(elements.loadingIndicators).find(
            el => el.dataset.platform === platform
        );
        
        if (loader) {
            loader.hidden = true;
        }
    }

    /**
     * Exibe mensagem de erro
     * @param {string} platform - Nome da plataforma
     * @param {string} message - Mensagem de erro
     */
    function showError(platform, message) {
        if (!elements.errorMessages) return;
        
        // Oculta indicador de carregamento
        hideLoading(platform);
        
        const errorElement = Array.from(elements.errorMessages).find(
            el => el.dataset.platform === platform
        );
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.hidden = false;
        }
    }

    /**
     * Oculta mensagem de erro
     * @param {string} platform - Nome da plataforma
     */
    function hideError(platform) {
        if (!elements.errorMessages) return;
        
        const errorElement = Array.from(elements.errorMessages).find(
            el => el.dataset.platform === platform
        );
        
        if (errorElement) {
            errorElement.hidden = true;
        }
    }

    /**
     * Encerra o módulo, removendo timers e listeners
     */
    function destroy() {
        // Limpa timers
        if (timers.twitter) clearInterval(timers.twitter);
        if (timers.instagram) clearInterval(timers.instagram);
        
        // Remove listeners de eventos (se necessário)
        const refreshButtons = document.querySelectorAll('.refresh-social-feed');
        if (refreshButtons) {
            refreshButtons.forEach(button => {
                button.removeEventListener('click', null);
            });
        }
        
        console.log('Módulo SocialFeeds encerrado.');
    }

    // Interface pública do módulo
    return {
        init,
        loadTwitterFeed,
        loadInstagramFeed,
        destroy
    };
})();

// Exporta o módulo para uso global
window.SocialFeeds = SocialFeeds;

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se estamos em uma página que utiliza os feeds sociais
    if (document.getElementById('twitterFeed') || document.getElementById('instagramFeed')) {
        SocialFeeds.init();
    }
});
