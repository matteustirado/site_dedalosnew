/**
 * @file maps-api.js
 * @description Configuração e integração com a API do Google Maps para o Dédalos Bar
 * Gerencia a criação de mapas para as diferentes unidades (SP, BH e RJ)
 */

// Namespace para evitar conflitos globais
const DedalosMapAPI = (function() {
    // Chave da API (substitua por sua chave real quando em produção)
    const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
    
    // Armazena referências aos mapas criados
    let maps = {
        sp: null,
        bh: null,
        rj: null
    };
    
    // Marcadores para cada unidade
    let markers = {
        sp: null,
        bh: null,
        rj: null
    };
    
    // Informações das unidades do Dédalos Bar
    const locations = {
        sp: {
            name: 'Dédalos Bar - São Paulo',
            position: { lat: -23.543791, lng: -46.644762 },
            address: 'R. Bento Freitas, 38 - República, São Paulo - SP, 01220-000',
            metroInfo: 'Próximo ao Metrô República',
            parkingInfo: 'Estacionamento recomendado: SKY BLUE ESTACIONAMENTO LTDA, R. Rego Freitas, 147'
        },
        bh: {
            name: 'Dédalos Bar - Belo Horizonte',
            position: { lat: -19.932339, lng: -43.938053 },
            address: 'R. São Paulo, 1735 - Lourdes, Belo Horizonte - MG, 30170-135'
        },
        rj: {
            name: 'Dédalos Bar - Rio de Janeiro',
            position: { lat: -22.891833, lng: -43.364233 },
            address: 'R. Baronesa, 1237 - Praca Seca, Rio de Janeiro - RJ, 21.321-000'
        }
    };
    
    // Opções padrão para todos os mapas
    const defaultMapOptions = {
        zoom: 16,
        mapTypeId: 'roadmap',
        styles: [
            // Estilo personalizado para combinar com a identidade visual do Dédalos
            // Tons escuros para combinar com a paleta
            {
                "elementType": "geometry",
                "stylers": [{ "color": "#1a1a1a" }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{ "color": "#000000" }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#b3b3b3" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{ "color": "#28241e" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{ "color": "#000000" }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#f5a623" }]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#f76b1c" }]
            }
        ]
    };
    
    // Personalização do ícone do marcador
    const markerIcon = {
        url: '/assets/images/logo/marker-icon.png', // Criar este ícone personalizado
        scaledSize: { width: 40, height: 40 },
        origin: { x: 0, y: 0 },
        anchor: { x: 20, y: 40 }
    };
    
    /**
     * Carrega o script da API do Google Maps de forma assíncrona
     * @returns {Promise} Promise que resolve quando a API estiver carregada
     */
    function loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            // Verifica se a API já foi carregada
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
                return;
            }
            
            // Callback para quando a API for carregada
            window.initGoogleMaps = function() {
                resolve(window.google.maps);
                delete window.initGoogleMaps;
            };
            
            // Cria o script e adiciona ao documento
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initGoogleMaps`;
            script.async = true;
            script.defer = true;
            script.onerror = function() {
                reject(new Error('Falha ao carregar a API do Google Maps'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Inicializa um mapa para uma unidade específica
     * @param {string} unit - Código da unidade ('sp', 'bh' ou 'rj')
     * @param {string} containerId - ID do elemento HTML que vai conter o mapa
     * @returns {Promise} Promise que resolve com o objeto do mapa
     */
    function initMap(unit, containerId) {
        if (!locations[unit]) {
            return Promise.reject(new Error(`Unidade '${unit}' não encontrada`));
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            return Promise.reject(new Error(`Container '${containerId}' não encontrado no DOM`));
        }
        
        return loadGoogleMapsAPI()
            .then(googleMaps => {
                // Remove o placeholder de carregamento se existir
                const placeholder = container.querySelector('.map-placeholder');
                if (placeholder) {
                    placeholder.remove();
                }
                
                // Configura as opções do mapa
                const mapOptions = {
                    ...defaultMapOptions,
                    center: locations[unit].position
                };
                
                // Cria o mapa
                maps[unit] = new googleMaps.Map(container, mapOptions);
                
                // Cria o marcador
                markers[unit] = new googleMaps.Marker({
                    position: locations[unit].position,
                    map: maps[unit],
                    title: locations[unit].name,
                    icon: markerIcon,
                    animation: googleMaps.Animation.DROP
                });
                
                // Adiciona info window com detalhes da unidade
                const infoContent = `
                    <div class="map-info-window">
                        <h3>${locations[unit].name}</h3>
                        <p>${locations[unit].address}</p>
                        ${locations[unit].metroInfo ? `<p><strong>Transporte:</strong> ${locations[unit].metroInfo}</p>` : ''}
                        ${locations[unit].parkingInfo ? `<p><strong>Estacionamento:</strong> ${locations[unit].parkingInfo}</p>` : ''}
                        <a href="https://maps.google.com/?q=${encodeURIComponent(locations[unit].address)}" 
                           target="_blank" rel="noopener" class="maps-link">
                           Abrir no Google Maps
                        </a>
                    </div>
                `;
                
                const infoWindow = new googleMaps.InfoWindow({
                    content: infoContent
                });
                
                // Abre a janela de informações ao clicar no marcador
                markers[unit].addListener('click', () => {
                    infoWindow.open(maps[unit], markers[unit]);
                });
                
                // Retorna o mapa criado
                return maps[unit];
            })
            .catch(error => {
                console.error('Erro ao inicializar o mapa:', error);
                // Exibe mensagem de erro no container
                container.innerHTML = `
                    <div class="map-error">
                        <p>Não foi possível carregar o mapa. Por favor, tente novamente mais tarde.</p>
                    </div>
                `;
                throw error;
            });
    }
    
    /**
     * Calcula rota entre a localização do usuário e uma unidade
     * @param {string} unit - Código da unidade ('sp', 'bh' ou 'rj')
     * @returns {Promise} Promise que resolve com informações da rota
     */
    function calculateRoute(unit) {
        if (!locations[unit]) {
            return Promise.reject(new Error(`Unidade '${unit}' não encontrada`));
        }
        
        if (!maps[unit]) {
            return Promise.reject(new Error(`Mapa da unidade '${unit}' não inicializado`));
        }
        
        return new Promise((resolve, reject) => {
            // Verifica permissão de geolocalização
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não é suportada pelo seu navegador'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    const origin = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    loadGoogleMapsAPI()
                        .then(googleMaps => {
                            const directionsService = new googleMaps.DirectionsService();
                            const directionsRenderer = new googleMaps.DirectionsRenderer({
                                map: maps[unit],
                                suppressMarkers: false
                            });
                            
                            directionsService.route(
                                {
                                    origin: origin,
                                    destination: locations[unit].position,
                                    travelMode: googleMaps.TravelMode.DRIVING
                                },
                                (result, status) => {
                                    if (status === 'OK') {
                                        directionsRenderer.setDirections(result);
                                        
                                        // Extrai informações da rota
                                        const route = result.routes[0].legs[0];
                                        resolve({
                                            distance: route.distance.text,
                                            duration: route.duration.text,
                                            startAddress: route.start_address,
                                            endAddress: route.end_address
                                        });
                                    } else {
                                        reject(new Error(`Erro ao calcular rota: ${status}`));
                                    }
                                }
                            );
                        })
                        .catch(reject);
                },
                error => {
                    reject(new Error(`Erro ao obter localização: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    }
    
    /**
     * Centraliza o mapa em um endereço específico
     * @param {string} unit - Código da unidade ('sp', 'bh' ou 'rj')
     * @param {string} address - Endereço para geocodificar
     * @returns {Promise} Promise que resolve quando o mapa for centralizado
     */
    function centerMapOnAddress(unit, address) {
        if (!maps[unit]) {
            return Promise.reject(new Error(`Mapa da unidade '${unit}' não inicializado`));
        }
        
        return loadGoogleMapsAPI()
            .then(googleMaps => {
                const geocoder = new googleMaps.Geocoder();
                
                return new Promise((resolve, reject) => {
                    geocoder.geocode({ address: address }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            const location = results[0].geometry.location;
                            maps[unit].setCenter(location);
                            
                            // Adiciona um marcador temporário
                            const tempMarker = new googleMaps.Marker({
                                position: location,
                                map: maps[unit],
                                title: 'Localização pesquisada',
                                animation: googleMaps.Animation.DROP
                            });
                            
                            // Remove o marcador após 8 segundos
                            setTimeout(() => {
                                tempMarker.setMap(null);
                            }, 8000);
                            
                            resolve(location);
                        } else {
                            reject(new Error(`Geocodificação falhou: ${status}`));
                        }
                    });
                });
            });
    }
    
    /**
     * Ativa/desativa o modo de visualização de rua (Street View)
     * @param {string} unit - Código da unidade ('sp', 'bh' ou 'rj')
     * @param {boolean} enable - Se true, ativa o Street View; se false, desativa
     */
    function toggleStreetView(unit, enable) {
        if (!maps[unit]) {
            console.error(`Mapa da unidade '${unit}' não inicializado`);
            return;
        }
        
        const panorama = maps[unit].getStreetView();
        if (enable) {
            panorama.setPosition(locations[unit].position);
            panorama.setPov({
                heading: 265,
                pitch: 0
            });
            panorama.setVisible(true);
        } else {
            panorama.setVisible(false);
        }
    }
    
    // Interface pública do módulo
    return {
        initMap,
        calculateRoute,
        centerMapOnAddress,
        toggleStreetView,
        getLocations: () => ({ ...locations }) // Retorna uma cópia para evitar modificações externas
    };
})();

// Exporta o módulo para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DedalosMapAPI;
} else {
    window.DedalosMapAPI = DedalosMapAPI;
}
