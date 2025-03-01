/**
 * @file maps.js - Gerencia o carregamento de mapas e marcadores para as unidades do Dédalos Bar
 * @requires js/integrations/maps-api.js
 * @requires js/utils/dom.js
 * @requires js/utils/geolocation.js
 */

(function() {
    'use strict';

    // Cache de elementos DOM
    let mapFrames = {};
    let locationTabs = [];
    let currentMapInstance = null;
    
    // Configurações dos marcadores para cada unidade
    const LOCATIONS = {
        sp: {
            name: 'São Paulo',
            address: 'R. Bento Freitas, 38 - República, São Paulo - SP, 01220-000',
            position: { lat: -23.543791, lng: -46.644762 },
            zoom: 16,
            icon: '/assets/images/icons/map-marker.png',
            nearbyText: 'Próximo ao Metrô República',
            parkingText: 'Estacionamento recomendado: SKY BLUE ESTACIONAMENTO LTDA, R. Rego Freitas, 147'
        },
        bh: {
            name: 'Belo Horizonte',
            address: 'R. São Paulo, 1735 - Lourdes, Belo Horizonte - MG, 30170-135',
            position: { lat: -19.935076, lng: -43.936413 },
            zoom: 16,
            icon: '/assets/images/icons/map-marker.png'
        },
        rj: {
            name: 'Rio de Janeiro',
            address: 'R. Baronesa, 1237 - Praca Seca, Rio de Janeiro - RJ, 21.321-000',
            position: { lat: -22.889922, lng: -43.345516 },
            zoom: 16,
            icon: '/assets/images/icons/map-marker.png'
        }
    };

    /**
     * Inicializa o módulo de mapas
     */
    function init() {
        // Verifica se a API do Maps foi carregada (pelo maps-api.js)
        if (window.DedalosApp?.mapsLoaded !== true) {
            console.warn('Maps API não foi carregada corretamente.');
            showMapPlaceholders();
            return;
        }

        cacheElements();
        bindEvents();
        initializeMaps();
    }

    /**
     * Armazena referências a elementos DOM frequentemente utilizados
     */
    function cacheElements() {
        mapFrames = {
            sp: document.getElementById('map-frame-sp'),
            bh: document.getElementById('map-frame-bh'),
            rj: document.getElementById('map-frame-rj')
        };
        
        locationTabs = Array.from(document.querySelectorAll('.location-tabs ul li'));
    }

    /**
     * Adiciona os event listeners necessários
     */
    function bindEvents() {
        // Evento de clique nas abas de localização
        locationTabs.forEach(tab => {
            tab.addEventListener('click', handleLocationTabClick);
        });

        // Event listener para redimensionamento da janela
        window.addEventListener('resize', debounce(handleWindowResize, 250));

        // Eventos personalizados do EventBus
        if (window.EventBus) {
            window.EventBus.subscribe('location:selected', showLocation);
            window.EventBus.subscribe('maps:recenter', recenterMap);
        }
    }

    /**
     * Manipula o clique em uma aba de localização
     * @param {Event} event - O evento de clique
     */
    function handleLocationTabClick(event) {
        const locationCode = event.currentTarget.getAttribute('data-location');
        showLocation(locationCode);
    }

    /**
     * Manipula o redimensionamento da janela
     */
    function handleWindowResize() {
        if (currentMapInstance) {
            const locationCode = getActiveLocationCode();
            if (locationCode && LOCATIONS[locationCode]) {
                currentMapInstance.setCenter(LOCATIONS[locationCode].position);
            }
        }
    }

    /**
     * Exibe a localização especificada
     * @param {string} locationCode - Código da localização (sp, bh, rj)
     */
    function showLocation(locationCode) {
        if (!LOCATIONS[locationCode]) return;

        // Atualiza as classes das abas
        locationTabs.forEach(tab => {
            const isActive = tab.getAttribute('data-location') === locationCode;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Mostra o mapa correto
        Object.keys(mapFrames).forEach(code => {
            const mapWrapper = document.getElementById(`map-${code}`);
            if (mapWrapper) {
                const isActive = code === locationCode;
                mapWrapper.classList.toggle('active', isActive);
                mapWrapper.hidden = !isActive;
            }
        });

        // Inicializa ou reposiciona o mapa, se necessário
        const mapElement = mapFrames[locationCode];
        if (mapElement && !mapElement.mapInitialized) {
            initializeMapForLocation(locationCode);
        } else if (currentMapInstance) {
            recenterMap(locationCode);
        }
    }

    /**
     * Inicializa todos os mapas
     */
    function initializeMaps() {
        // Inicializa apenas o mapa da localização ativa por padrão
        const activeLocationCode = getActiveLocationCode() || 'sp';
        initializeMapForLocation(activeLocationCode);
    }

    /**
     * Inicializa o mapa para uma localização específica
     * @param {string} locationCode - Código da localização (sp, bh, rj)
     */
    function initializeMapForLocation(locationCode) {
        if (!mapFrames[locationCode] || !LOCATIONS[locationCode]) return;

        const mapElement = mapFrames[locationCode];
        const location = LOCATIONS[locationCode];

        // Cria o mapa
        currentMapInstance = new google.maps.Map(mapElement, {
            center: location.position,
            zoom: location.zoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: getMapStyles()
        });

        // Adiciona o marcador
        const marker = new google.maps.Marker({
            position: location.position,
            map: currentMapInstance,
            title: location.name,
            icon: location.icon || null,
            animation: google.maps.Animation.DROP
        });

        // Adiciona uma janela de informações
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <h3>${location.name}</h3>
                    <p>${location.address}</p>
                    <a href="https://maps.google.com/?q=${encodeURIComponent(location.address)}" 
                       target="_blank" rel="noopener">Ver no Google Maps</a>
                </div>
            `
        });

        // Abre a janela de informações ao clicar no marcador
        marker.addListener('click', () => {
            infoWindow.open(currentMapInstance, marker);
        });

        // Marca o mapa como inicializado
        mapElement.mapInitialized = true;
        mapElement.mapInstance = currentMapInstance;
        mapElement.marker = marker;
        
        // Remove o placeholder se existir
        const placeholder = mapElement.querySelector('.map-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
    }

    /**
     * Recentra o mapa na localização especificada
     * @param {string} locationCode - Código da localização (sp, bh, rj)
     */
    function recenterMap(locationCode) {
        if (!currentMapInstance || !LOCATIONS[locationCode]) return;
        
        currentMapInstance.setCenter(LOCATIONS[locationCode].position);
        currentMapInstance.setZoom(LOCATIONS[locationCode].zoom);
    }

    /**
     * Obtém o código da localização atualmente ativa
     * @returns {string|null} O código da localização ativa ou null
     */
    function getActiveLocationCode() {
        const activeTab = locationTabs.find(tab => tab.classList.contains('active'));
        return activeTab ? activeTab.getAttribute('data-location') : null;
    }

    /**
     * Exibe placeholders nos containers de mapa quando a API não carrega
     */
    function showMapPlaceholders() {
        Object.values(mapFrames).forEach(frame => {
            if (frame) {
                const placeholder = frame.querySelector('.map-placeholder');
                if (placeholder) {
                    placeholder.textContent = 'Não foi possível carregar o mapa. Verifique sua conexão.';
                }
            }
        });
    }

    /**
     * Retorna os estilos personalizados para o mapa
     * @returns {Array} Array de objetos de estilo
     */
    function getMapStyles() {
        // Estilo escuro personalizado para o mapa, seguindo a paleta do site
        return [
            {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#ffffff"}]
            },
            {
                "featureType": "all",
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#000000"}, {"lightness": 13}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#000000"}]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#144b53"}, {"lightness": 14}, {"weight": 1.4}]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [{"color": "#1a1a1a"}]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{"color": "#0c4152"}, {"lightness": 5}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#f5a623"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#f76b1c"}, {"lightness": 25}]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#2d2d2d"}]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#0b3d51"}, {"lightness": 16}]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [{"color": "#1a1a1a"}]
            },
            {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [{"color": "#2d2d2d"}]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [{"color": "#0a0a0f"}, {"lightness": 8}]
            }
        ];
    }

    /**
     * Função utilitária para debounce
     * @param {Function} func - A função a ser executada após o delay
     * @param {number} wait - Tempo de espera em milissegundos
     * @returns {Function} Função com debounce aplicado
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Inicializa o módulo quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', init);

    // Inicializa o módulo quando a API do Google Maps for carregada
    window.initDedalosMapModule = init;

    // Expõe funções para uso externo
    window.DedalosApp = window.DedalosApp || {};
    window.DedalosApp.maps = {
        showLocation,
        recenterMap
    };
})();
