/**
 * Dédalos Bar - Route Calculator
 * 
 * Este módulo calcula rotas e tempo estimado de chegada às diferentes unidades
 * do Dédalos Bar, integrado com a API do Google Maps.
 */

class RouteCalculator {
    constructor() {
        // Referências aos elementos DOM
        this.mapContainer = null;
        this.originInput = null;
        this.destinationSelect = null;
        this.transportModeButtons = null;
        this.routeResultsContainer = null;
        
        // Armazena a referência do DirectionsService e DirectionsRenderer do Google Maps
        this.directionsService = null;
        this.directionsRenderer = null;
        
        // Armazena a localização atual do usuário
        this.userLocation = null;
        
        // Endereços das unidades Dédalos
        this.locations = {
            'sp': {
                address: 'R. Bento Freitas, 38 - República, São Paulo - SP, 01220-000',
                name: 'Dédalos São Paulo',
                coords: { lat: -23.543791, lng: -46.644762 }
            },
            'bh': {
                address: 'R. São Paulo, 1735 - Lourdes, Belo Horizonte - MG, 30170-135',
                name: 'Dédalos Belo Horizonte',
                coords: { lat: -19.932230, lng: -43.941173 }
            },
            'rj': {
                address: 'R. Baronesa, 1237 - Praca Seca, Rio de Janeiro - RJ, 21.321-000',
                name: 'Dédalos Rio de Janeiro',
                coords: { lat: -22.891306, lng: -43.372403 }
            }
        };
        
        // Modos de transporte disponíveis
        this.transportModes = {
            'DRIVING': { icon: 'fa-car', label: 'Carro' },
            'TRANSIT': { icon: 'fa-bus', label: 'Transporte Público' },
            'WALKING': { icon: 'fa-walking', label: 'A pé' },
            'BICYCLING': { icon: 'fa-bicycle', label: 'Bicicleta' }
        };
        
        // Modo de transporte padrão
        this.currentTransportMode = 'DRIVING';
    }

    /**
     * Inicializa o calculador de rotas
     * @param {string} mapContainerId - ID do elemento que conterá o mapa
     * @param {string} formContainerId - ID do elemento que conterá o formulário
     * @param {string} resultsContainerId - ID do elemento que mostrará os resultados
     */
    init(mapContainerId, formContainerId, resultsContainerId) {
        // Verifica se a API do Google Maps está carregada
        if (!window.google || !window.google.maps) {
            console.error('Google Maps API não foi carregada corretamente.');
            return;
        }
        
        // Obtém referências aos elementos DOM
        this.mapContainer = document.getElementById(mapContainerId);
        const formContainer = document.getElementById(formContainerId);
        this.routeResultsContainer = document.getElementById(resultsContainerId);
        
        if (!this.mapContainer || !formContainer || !this.routeResultsContainer) {
            console.error('Elementos DOM necessários não encontrados.');
            return;
        }
        
        // Inicializa os serviços do Google Maps
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        
        // Cria o mapa e associa o renderer
        const map = new google.maps.Map(this.mapContainer, {
            zoom: 12,
            center: this.locations.sp.coords, // Centro inicial em São Paulo
            styles: this.getMapStyles(),
            mapTypeControl: false,
            fullscreenControl: true,
            streetViewControl: false
        });
        
        this.directionsRenderer.setMap(map);
        
        // Cria a interface de usuário
        this.createUserInterface(formContainer);
        
        // Tenta obter a localização do usuário
        this.getUserLocation();
        
        // Adiciona ouvintes de eventos
        this.addEventListeners();
    }
    
    /**
     * Cria a interface de usuário para o calculador de rotas
     * @param {HTMLElement} container - Elemento que conterá o formulário
     */
    createUserInterface(container) {
        // Limpa o container
        container.innerHTML = '';
        
        // Cria o formulário
        const form = document.createElement('form');
        form.className = 'route-calculator-form';
        form.setAttribute('aria-label', 'Calculadora de rotas');
        
        // Campo de origem
        const originGroup = document.createElement('div');
        originGroup.className = 'form-group';
        
        const originLabel = document.createElement('label');
        originLabel.textContent = 'Sua localização:';
        originLabel.setAttribute('for', 'route-origin');
        
        this.originInput = document.createElement('input');
        this.originInput.type = 'text';
        this.originInput.id = 'route-origin';
        this.originInput.placeholder = 'Digite seu endereço ou use sua localização atual';
        
        const useLocationBtn = document.createElement('button');
        useLocationBtn.type = 'button';
        useLocationBtn.className = 'btn btn-location';
        useLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Usar minha localização';
        useLocationBtn.setAttribute('aria-label', 'Usar minha localização atual');
        
        originGroup.appendChild(originLabel);
        originGroup.appendChild(this.originInput);
        originGroup.appendChild(useLocationBtn);
        
        // Campo de destino (select com as unidades)
        const destinationGroup = document.createElement('div');
        destinationGroup.className = 'form-group';
        
        const destinationLabel = document.createElement('label');
        destinationLabel.textContent = 'Unidade Dédalos:';
        destinationLabel.setAttribute('for', 'route-destination');
        
        this.destinationSelect = document.createElement('select');
        this.destinationSelect.id = 'route-destination';
        
        // Adiciona as opções de destino
        for (const [key, location] of Object.entries(this.locations)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = location.name;
            this.destinationSelect.appendChild(option);
        }
        
        destinationGroup.appendChild(destinationLabel);
        destinationGroup.appendChild(this.destinationSelect);
        
        // Modos de transporte
        const transportGroup = document.createElement('div');
        transportGroup.className = 'transport-modes';
        
        const transportLabel = document.createElement('span');
        transportLabel.className = 'transport-label';
        transportLabel.textContent = 'Meio de transporte:';
        
        transportGroup.appendChild(transportLabel);
        
        this.transportModeButtons = document.createElement('div');
        this.transportModeButtons.className = 'transport-buttons';
        
        // Cria botões para cada modo de transporte
        for (const [mode, details] of Object.entries(this.transportModes)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `transport-btn ${mode === this.currentTransportMode ? 'active' : ''}`;
            btn.dataset.mode = mode;
            btn.innerHTML = `<i class="fas ${details.icon}"></i> ${details.label}`;
            btn.setAttribute('aria-label', `Calcular rota de ${details.label}`);
            
            this.transportModeButtons.appendChild(btn);
        }
        
        transportGroup.appendChild(this.transportModeButtons);
        
        // Botão para calcular a rota
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-calculate';
        submitBtn.innerHTML = '<i class="fas fa-route"></i> Calcular Rota';
        
        // Monta o formulário
        form.appendChild(originGroup);
        form.appendChild(destinationGroup);
        form.appendChild(transportGroup);
        form.appendChild(submitBtn);
        
        container.appendChild(form);
    }
    
    /**
     * Adiciona ouvintes de eventos aos elementos da interface
     */
    addEventListeners() {
        // Ouvinte para o botão "Usar minha localização"
        const useLocationBtn = document.querySelector('.btn-location');
        if (useLocationBtn) {
            useLocationBtn.addEventListener('click', () => {
                this.getUserLocation();
            });
        }
        
        // Ouvinte para os botões de modo de transporte
        if (this.transportModeButtons) {
            const btns = this.transportModeButtons.querySelectorAll('.transport-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Remove a classe ativa de todos os botões
                    btns.forEach(b => b.classList.remove('active'));
                    
                    // Adiciona a classe ativa ao botão clicado
                    e.target.closest('.transport-btn').classList.add('active');
                    
                    // Atualiza o modo de transporte atual
                    this.currentTransportMode = e.target.closest('.transport-btn').dataset.mode;
                    
                    // Se já existe uma rota calculada, recalcula com o novo modo
                    if (this.originInput.value && this.destinationSelect.value) {
                        this.calculateRoute();
                    }
                });
            });
        }
        
        // Ouvinte para o formulário
        const form = document.querySelector('.route-calculator-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateRoute();
            });
        }
        
        // Ouvinte para mudança de unidade
        if (this.destinationSelect) {
            this.destinationSelect.addEventListener('change', () => {
                if (this.originInput.value) {
                    this.calculateRoute();
                }
            });
        }
    }
    
    /**
     * Tenta obter a localização atual do usuário
     */
    getUserLocation() {
        // Verifica se o navegador suporta geolocalização
        if (!navigator.geolocation) {
            this.showError('Seu navegador não suporta geolocalização.');
            return;
        }
        
        // Mostra indicador de carregamento
        this.routeResultsContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-pulse"></i> Obtendo sua localização...</div>';
        
        // Solicita a localização atual
        navigator.geolocation.getCurrentPosition(
            // Sucesso
            (position) => {
                const { latitude, longitude } = position.coords;
                this.userLocation = { lat: latitude, lng: longitude };
                
                // Faz geocoding reverso para obter o endereço legível
                this.reverseGeocode(this.userLocation);
            },
            // Erro
            (error) => {
                let errorMessage;
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Acesso à localização negado.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Informações de localização indisponíveis.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Tempo esgotado ao tentar obter localização.';
                        break;
                    default:
                        errorMessage = 'Erro desconhecido ao obter localização.';
                }
                
                this.showError(errorMessage);
            },
            // Opções
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }
    
    /**
     * Faz geocoding reverso para obter o endereço legível a partir de coordenadas
     * @param {Object} coords - Coordenadas {lat, lng}
     */
    reverseGeocode(coords) {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ location: coords }, (results, status) => {
            if (status === 'OK' && results[0]) {
                // Preenche o campo de origem com o endereço encontrado
                this.originInput.value = results[0].formatted_address;
                
                // Calcula a rota automaticamente se um destino estiver selecionado
                this.calculateRoute();
            } else {
                this.showError('Não foi possível determinar seu endereço.');
                // Usa as coordenadas como fallback
                this.originInput.value = `${coords.lat}, ${coords.lng}`;
            }
        });
    }
    
    /**
     * Calcula a rota entre a origem e o destino usando o modo de transporte atual
     */
    calculateRoute() {
        if (!this.originInput.value || !this.destinationSelect.value) {
            this.showError('Preencha a origem e selecione um destino.');
            return;
        }
        
        // Obtém a unidade selecionada
        const selectedLocation = this.locations[this.destinationSelect.value];
        if (!selectedLocation) {
            this.showError('Unidade inválida selecionada.');
            return;
        }
        
        // Mostra indicador de carregamento
        this.routeResultsContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-pulse"></i> Calculando rota...</div>';
        
        // Configura a requisição para o serviço de direções
        const request = {
            origin: this.originInput.value,
            destination: selectedLocation.address,
            travelMode: google.maps.TravelMode[this.currentTransportMode],
            provideRouteAlternatives: true,
            unitSystem: google.maps.UnitSystem.METRIC
        };
        
        // Faz a requisição ao serviço de direções
        this.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                // Renderiza a rota no mapa
                this.directionsRenderer.setDirections(result);
                
                // Exibe as informações da rota
                this.displayRouteInfo(result, selectedLocation);
            } else {
                // Trata os erros comuns
                let errorMessage;
                
                switch (status) {
                    case 'ZERO_RESULTS':
                        errorMessage = `Não foi possível encontrar uma rota de ${this.originInput.value} para ${selectedLocation.name} usando o modo de transporte selecionado.`;
                        break;
                    case 'NOT_FOUND':
                        errorMessage = 'Não foi possível localizar um ou mais endereços informados.';
                        break;
                    case 'OVER_QUERY_LIMIT':
                        errorMessage = 'Limite de consultas à API excedido. Tente novamente mais tarde.';
                        break;
                    default:
                        errorMessage = `Erro ao calcular a rota: ${status}`;
                }
                
                this.showError(errorMessage);
            }
        });
    }
    
    /**
     * Exibe as informações da rota calculada
     * @param {Object} directionsResult - Resultado retornado pelo DirectionsService
     * @param {Object} destination - Informações sobre o destino selecionado
     */
    displayRouteInfo(directionsResult, destination) {
        // Obtém a rota principal (primeira)
        const route = directionsResult.routes[0];
        
        // Obtém a perna principal da rota (primeira)
        const leg = route.legs[0];
        
        // Limpa o container de resultados
        this.routeResultsContainer.innerHTML = '';
        
        // Cria o container de informações da rota
        const routeInfoContainer = document.createElement('div');
        routeInfoContainer.className = 'route-info';
        
        // Título da rota
        const routeTitle = document.createElement('h3');
        routeTitle.className = 'route-title';
        routeTitle.innerHTML = `<i class="fas fa-map-marker-alt"></i> Rota para ${destination.name}`;
        
        // Informações sobre distância e tempo
        const routeDetails = document.createElement('div');
        routeDetails.className = 'route-details';
        
        // Mostra distância
        const distanceInfo = document.createElement('div');
        distanceInfo.className = 'route-distance';
        distanceInfo.innerHTML = `<i class="fas fa-road"></i> <span>Distância:</span> ${leg.distance.text}`;
        
        // Mostra tempo estimado
        const durationInfo = document.createElement('div');
        durationInfo.className = 'route-duration';
        durationInfo.innerHTML = `<i class="fas fa-clock"></i> <span>Tempo estimado:</span> ${leg.duration.text}`;
        
        // Mostra modo de transporte
        const transportInfo = document.createElement('div');
        transportInfo.className = 'route-transport';
        transportInfo.innerHTML = `<i class="fas ${this.transportModes[this.currentTransportMode].icon}"></i> <span>Transporte:</span> ${this.transportModes[this.currentTransportMode].label}`;
        
        // Endereço de origem
        const originInfo = document.createElement('div');
        originInfo.className = 'route-origin';
        originInfo.innerHTML = `<i class="fas fa-location-arrow"></i> <span>De:</span> ${leg.start_address}`;
        
        // Endereço de destino
        const destinationInfo = document.createElement('div');
        destinationInfo.className = 'route-destination';
        destinationInfo.innerHTML = `<i class="fas fa-flag-checkered"></i> <span>Para:</span> ${leg.end_address}`;
        
        // Adiciona os elementos ao container de detalhes
        routeDetails.appendChild(distanceInfo);
        routeDetails.appendChild(durationInfo);
        routeDetails.appendChild(transportInfo);
        routeDetails.appendChild(originInfo);
        routeDetails.appendChild(destinationInfo);
        
        // Instruções passo a passo
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'route-steps';
        
        const stepsTitle = document.createElement('h4');
        stepsTitle.textContent = 'Instruções de Rota';
        stepsContainer.appendChild(stepsTitle);
        
        // Lista de passos
        const stepsList = document.createElement('ol');
        stepsList.className = 'steps-list';
        
        // Adiciona cada passo da rota
        leg.steps.forEach(step => {
            const stepItem = document.createElement('li');
            stepItem.className = 'step-item';
            
            // Remove as tags HTML das instruções para manter apenas o texto
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = step.instructions;
            const instructions = tempDiv.textContent || tempDiv.innerText;
            
            // Adiciona ícone adequado com base no modo de viagem
            let icon = 'fa-arrow-right';
            if (step.travel_mode === 'TRANSIT') {
                icon = 'fa-bus';
            } else if (step.maneuver) {
                if (step.maneuver.includes('left')) {
                    icon = 'fa-arrow-left';
                } else if (step.maneuver.includes('right')) {
                    icon = 'fa-arrow-right';
                } else if (step.maneuver.includes('uturn')) {
                    icon = 'fa-arrow-circle-right';
                }
            }
            
            stepItem.innerHTML = `
                <div class="step-icon"><i class="fas ${icon}"></i></div>
                <div class="step-details">
                    <div class="step-instruction">${instructions}</div>
                    <div class="step-distance">${step.distance.text}</div>
                </div>
            `;
            
            stepsList.appendChild(stepItem);
        });
        
        stepsContainer.appendChild(stepsList);
        
        // Adiciona informações sobre alternativas de rota, se disponíveis
        if (directionsResult.routes.length > 1) {
            const alternativesContainer = document.createElement('div');
            alternativesContainer.className = 'route-alternatives';
            
            const alternativesTitle = document.createElement('h4');
            alternativesTitle.textContent = 'Rotas Alternativas';
            alternativesContainer.appendChild(alternativesTitle);
            
            const alternativesList = document.createElement('ul');
            alternativesList.className = 'alternatives-list';
            
            // Itera pelas rotas alternativas (ignora a primeira, que já foi exibida)
            for (let i = 1; i < directionsResult.routes.length; i++) {
                const altRoute = directionsResult.routes[i];
                const altLeg = altRoute.legs[0];
                
                const altItem = document.createElement('li');
                altItem.className = 'alternative-item';
                altItem.innerHTML = `
                    <button class="btn btn-alternative" data-route-index="${i}">
                        <span class="alt-info">Alternativa ${i}: ${altLeg.distance.text}, ${altLeg.duration.text}</span>
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                `;
                
                alternativesList.appendChild(altItem);
            }
            
            alternativesContainer.appendChild(alternativesList);
            
            // Adiciona ouvinte de eventos para as rotas alternativas
            alternativesContainer.querySelectorAll('.btn-alternative').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const routeIndex = parseInt(e.currentTarget.dataset.routeIndex);
                    this.directionsRenderer.setRouteIndex(routeIndex);
                    
                    // Atualiza as informações exibidas para a rota alternativa
                    this.displayRouteInfo({
                        routes: [directionsResult.routes[routeIndex]]
                    }, destination);
                });
            });
            
            stepsContainer.appendChild(alternativesContainer);
        }
        
        // Monta o container de informações da rota
        routeInfoContainer.appendChild(routeTitle);
        routeInfoContainer.appendChild(routeDetails);
        
        // Adiciona botão para compartilhar a rota
        const shareButton = document.createElement('button');
        shareButton.className = 'btn btn-share';
        shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Compartilhar Rota';
        shareButton.addEventListener('click', () => {
            this.shareRoute(leg.start_address, leg.end_address);
        });
        
        // Adiciona botões de ação
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'route-actions';
        
        // Botão para abrir no Google Maps
        const googleMapsButton = document.createElement('a');
        googleMapsButton.className = 'btn btn-google-maps';
        googleMapsButton.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(leg.start_address)}&destination=${encodeURIComponent(leg.end_address)}&travelmode=${this.currentTransportMode.toLowerCase()}`;
        googleMapsButton.target = '_blank';
        googleMapsButton.rel = 'noopener';
        googleMapsButton.innerHTML = '<i class="fab fa-google"></i> Abrir no Google Maps';
        
        actionsContainer.appendChild(shareButton);
        actionsContainer.appendChild(googleMapsButton);
        
        // Adiciona tudo ao container principal
        this.routeResultsContainer.appendChild(routeInfoContainer);
        this.routeResultsContainer.appendChild(actionsContainer);
        this.routeResultsContainer.appendChild(stepsContainer);
    }
    
    /**
     * Compartilha a rota usando a Web Share API, se disponível
     * @param {string} origin - Endereço de origem
     * @param {string} destination - Endereço de destino
     */
    shareRoute(origin, destination) {
        // Verifica se a Web Share API está disponível
        if (navigator.share) {
            const shareData = {
                title: 'Rota para o Dédalos Bar',
                text: `Minha rota de ${origin} para ${destination}`,
                url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${this.currentTransportMode.toLowerCase()}`
            };
            
            navigator.share(shareData)
                .catch(error => {
                    console.warn('Erro ao compartilhar:', error);
                });
        } else {
            // Fallback para navegadores que não suportam a Web Share API
            // Copia o link para a área de transferência
            const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${this.currentTransportMode.toLowerCase()}`;
            
            // Cria um elemento de input temporário para copiar o texto
            const tempInput = document.createElement('input');
            tempInput.value = url;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            // Mostra uma notificação
            alert('Link da rota copiado para a área de transferência!');
        }
    }
    
    /**
     * Exibe uma mensagem de erro no container de resultados
     * @param {string} message - Mensagem de erro a ser exibida
     */
    showError(message) {
        if (!this.routeResultsContainer) return;
        
        this.routeResultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
    
    /**
     * Define estilos personalizados para o mapa
     * @returns {Array} Array de estilos para o mapa
     */
    getMapStyles() {
        // Estilo dark com detalhes em laranja inspirado na paleta do Dédalos
        return [
            {
                "elementType": "geometry",
                "stylers": [{"color": "#1a1a1a"}]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#000000"}]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#b3b3b3"}]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#f5a623"}]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [{"color": "#28241e"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{"color": "#2c2c2c"}]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#000000"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{"color": "#f76b1c"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#e68e09"}]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [{"color": "#3a3a3a"}]
            },
            {
                "featureType": "transit.station",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#f5a623"}]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#0a0a0f"}]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#b3b3b3"}]
            },
            {
                "featureType": "administrative.locality",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#f76b1c"}]
            }
        ];
    }
}

// Exporta a classe RouteCalculator para uso em outros módulos
export default RouteCalculator;
