/**
 * Twitter API Integration
 * Handles communication with Twitter API for fetching and displaying tweets
 * related to Dédalos Bar.
 * 
 * @module twitter-api
 */

import { eventBus } from '../core/event-bus.js';
import { config } from '../core/config.js';
import { storageUtil } from '../utils/storage.js';

/**
 * Twitter API integration service
 */
const twitterApi = (function() {
    // Configuration constants for Twitter API
    const TWITTER_CACHE_KEY = 'dedalos_twitter_cache';
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    // Twitter API endpoint URL prefixes
    const API_BASE = 'https://api.twitter.com/2';
    const TIMELINE_ENDPOINT = '/tweets/search/recent';
    
    // OAuth2 tokens (would normally come from environment variables or config.js)
    const auth = {
        bearerToken: config.twitterApi?.bearerToken || '',
    };
    
    /**
     * Initialize Twitter API integration
     */
    function init() {
        eventBus.subscribe('social.requestTwitterFeed', fetchLatestTweets);
        console.log('Twitter API integration initialized');
    }
    
    /**
     * Fetch latest tweets about Dédalos Bar
     * @param {Object} options - Options for tweet fetching
     * @param {number} options.count - Number of tweets to fetch (default: 5)
     * @param {string} options.query - Search query (default: related to Dédalos Bar)
     */
    async function fetchLatestTweets(options = {}) {
        const count = options.count || 5;
        const query = options.query || 'dedalosbar OR "Dédalos Bar" OR #dedalosbar';
        
        // Check if we have cached data first
        const cachedData = getCachedTweets();
        if (cachedData) {
            eventBus.publish('social.twitterFeedLoaded', cachedData);
            return;
        }
        
        try {
            eventBus.publish('social.twitterFeedLoading', true);
            
            // Format the search query for the API
            const searchQuery = encodeURIComponent(query);
            const url = `${API_BASE}${TIMELINE_ENDPOINT}?query=${searchQuery}&max_results=${count}&tweet.fields=created_at,public_metrics&expansions=author_id&user.fields=name,username,profile_image_url`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${auth.bearerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Twitter API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Process and format the tweets
            const formattedTweets = formatTweets(data);
            
            // Cache the fetched data
            cacheTweets(formattedTweets);
            
            // Publish the formatted tweets to the application
            eventBus.publish('social.twitterFeedLoaded', formattedTweets);
            eventBus.publish('social.twitterFeedLoading', false);
            
            return formattedTweets;
        } catch (error) {
            console.error('Error fetching tweets:', error);
            eventBus.publish('social.twitterFeedError', {
                message: 'Não foi possível carregar os tweets.',
                error: error.message
            });
            eventBus.publish('social.twitterFeedLoading', false);
            
            // Use fallback content if available
            const fallbackContent = getFallbackContent();
            if (fallbackContent) {
                eventBus.publish('social.twitterFeedLoaded', fallbackContent);
                return fallbackContent;
            }
            
            return [];
        }
    }
    
    /**
     * Format raw Twitter API response into a more usable structure
     * @param {Object} data - Raw Twitter API response data
     * @returns {Array} Formatted tweets array
     */
    function formatTweets(data) {
        if (!data.data || !data.includes || !data.includes.users) {
            return [];
        }
        
        // Create a map of user IDs to user objects for quick lookup
        const userMap = {};
        data.includes.users.forEach(user => {
            userMap[user.id] = user;
        });
        
        // Format each tweet with necessary data
        return data.data.map(tweet => {
            const user = userMap[tweet.author_id] || {};
            
            return {
                id: tweet.id,
                text: tweet.text,
                createdAt: new Date(tweet.created_at),
                formattedDate: formatDate(new Date(tweet.created_at)),
                metrics: tweet.public_metrics || {
                    retweet_count: 0,
                    like_count: 0,
                    reply_count: 0
                },
                author: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    profileImageUrl: user.profile_image_url
                },
                tweetUrl: `https://twitter.com/${user.username}/status/${tweet.id}`
            };
        });
    }
    
    /**
     * Format a date for display
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    function formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return 'agora';
        } else if (diffMin < 60) {
            return `${diffMin}m`;
        } else if (diffHour < 24) {
            return `${diffHour}h`;
        } else if (diffDay < 7) {
            return `${diffDay}d`;
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }
    }
    
    /**
     * Cache tweets in browser storage
     * @param {Array} tweets - Tweets to cache
     */
    function cacheTweets(tweets) {
        if (!tweets || tweets.length === 0) return;
        
        const cacheData = {
            tweets: tweets,
            timestamp: Date.now()
        };
        
        storageUtil.setItem(TWITTER_CACHE_KEY, JSON.stringify(cacheData));
    }
    
    /**
     * Get cached tweets if they exist and are still valid
     * @returns {Array|null} Cached tweets or null if no valid cache exists
     */
    function getCachedTweets() {
        const cachedData = storageUtil.getItem(TWITTER_CACHE_KEY);
        if (!cachedData) return null;
        
        try {
            const parsedCache = JSON.parse(cachedData);
            const now = Date.now();
            
            // Check if cache is still valid (less than CACHE_DURATION old)
            if (parsedCache.timestamp && (now - parsedCache.timestamp < CACHE_DURATION)) {
                return parsedCache.tweets;
            }
            
            // Cache is too old, remove it
            storageUtil.removeItem(TWITTER_CACHE_KEY);
            return null;
        } catch (e) {
            console.error('Error parsing cached tweets:', e);
            storageUtil.removeItem(TWITTER_CACHE_KEY);
            return null;
        }
    }
    
    /**
     * Get fallback content for when the API fails
     * @returns {Array} Array of fallback tweets
     */
    function getFallbackContent() {
        return [
            {
                id: 'fallback1',
                text: 'Noite especial no #DedalosBar ontem! Muito obrigado a todos que compareceram e fizeram da nossa festa um sucesso! 🔥🚀 #noite #diversao',
                formattedDate: '2d',
                metrics: {
                    retweet_count: 12,
                    like_count: 48,
                    reply_count: 3
                },
                author: {
                    name: 'Dédalos Bar',
                    username: 'dedalosbar',
                    profileImageUrl: '/assets/images/logo/logo-small.png'
                },
                tweetUrl: 'https://twitter.com/dedalosbar'
            },
            {
                id: 'fallback2',
                text: 'Hoje é dia de Marmitex no Dédalos! Traga seus amigos e aproveite nossos preços especiais para grupos! 🍹🎮 #DedalosBar #BoaNoite',
                formattedDate: '4d',
                metrics: {
                    retweet_count: 8,
                    like_count: 32,
                    reply_count: 5
                },
                author: {
                    name: 'Dédalos Bar',
                    username: 'dedalosbar',
                    profileImageUrl: '/assets/images/logo/logo-small.png'
                },
                tweetUrl: 'https://twitter.com/dedalosbar'
            },
            {
                id: 'fallback3',
                text: 'Agora no Dédalos Bar: novo cocktail "Labirinto" disponível! Venha experimentar essa explosão de sabores! 🍸 #DedalosBar #NovosSabores',
                formattedDate: '1sem',
                metrics: {
                    retweet_count: 15,
                    like_count: 67,
                    reply_count: 9
                },
                author: {
                    name: 'Dédalos Bar',
                    username: 'dedalosbar',
                    profileImageUrl: '/assets/images/logo/logo-small.png'
                },
                tweetUrl: 'https://twitter.com/dedalosbar'
            }
        ];
    }
    
    /**
     * Render tweets in the specified container
     * @param {string|HTMLElement} container - Container selector or element
     * @param {Array} tweets - Tweets to render
     */
    function renderTweets(container, tweets = null) {
        const containerElement = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
            
        if (!containerElement) {
            console.error('Twitter feed container not found');
            return;
        }
        
        // Use provided tweets or fetch new ones
        if (tweets) {
            renderTweetsToContainer(containerElement, tweets);
        } else {
            // If no tweets provided, fetch them first
            fetchLatestTweets().then(fetchedTweets => {
                renderTweetsToContainer(containerElement, fetchedTweets);
            });
        }
    }
    
    /**
     * Render tweets to a container element
     * @param {HTMLElement} container - Container element
     * @param {Array} tweets - Tweets to render
     */
    function renderTweetsToContainer(container, tweets) {
        if (!tweets || tweets.length === 0) {
            container.innerHTML = '<p class="twitter-empty">Nenhum tweet recente encontrado.</p>';
            return;
        }
        
        container.innerHTML = '';
        
        tweets.forEach(tweet => {
            const tweetElement = document.createElement('div');
            tweetElement.className = 'twitter-card';
            tweetElement.setAttribute('data-tweet-id', tweet.id);
            
            tweetElement.innerHTML = `
                <div class="twitter-card-header">
                    <div class="twitter-avatar">
                        <img src="${tweet.author.profileImageUrl || '/assets/images/social/twitter-default-avatar.png'}" 
                             alt="${tweet.author.name}" width="48" height="48">
                    </div>
                    <div class="twitter-user-info">
                        <div class="twitter-name">${tweet.author.name}</div>
                        <div class="twitter-username">@${tweet.author.username}</div>
                    </div>
                    <div class="twitter-logo">
                        <i class="fab fa-twitter"></i>
                    </div>
                </div>
                <div class="twitter-card-body">
                    <p class="twitter-text">${formatTweetText(tweet.text)}</p>
                </div>
                <div class="twitter-card-footer">
                    <div class="twitter-date">${tweet.formattedDate}</div>
                    <div class="twitter-metrics">
                        <span class="twitter-metric twitter-replies">
                            <i class="fas fa-comment"></i> ${tweet.metrics.reply_count}
                        </span>
                        <span class="twitter-metric twitter-retweets">
                            <i class="fas fa-retweet"></i> ${tweet.metrics.retweet_count}
                        </span>
                        <span class="twitter-metric twitter-likes">
                            <i class="fas fa-heart"></i> ${tweet.metrics.like_count}
                        </span>
                    </div>
                </div>
                <a href="${tweet.tweetUrl}" class="twitter-card-link" target="_blank" rel="noopener">Ver no Twitter</a>
            `;
            
            container.appendChild(tweetElement);
        });
    }
    
    /**
     * Format tweet text with links, hashtags, and mentions
     * @param {string} text - Raw tweet text
     * @returns {string} Formatted HTML for tweet text
     */
    function formatTweetText(text) {
        // Convert URLs to clickable links
        text = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );
        
        // Convert hashtags to links
        text = text.replace(
            /#(\w+)/g, 
            '<a href="https://twitter.com/hashtag/$1" target="_blank" rel="noopener">#$1</a>'
        );
        
        // Convert @mentions to links
        text = text.replace(
            /@(\w+)/g, 
            '<a href="https://twitter.com/$1" target="_blank" rel="noopener">@$1</a>'
        );
        
        return text;
    }
    
    // Public API
    return {
        init,
        fetchLatestTweets,
        renderTweets,
        formatTweetText
    };
})();

// Initialize the module automatically if DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    twitterApi.init();
} else {
    document.addEventListener('DOMContentLoaded', twitterApi.init);
}

export default twitterApi;
