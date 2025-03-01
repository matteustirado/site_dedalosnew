/**
 * @file geolocation.js
 * @description Utilitários para obtenção e manipulação de localização do usuário
 */

const GeolocationUtils = (() => {
    // Constantes para configuração
    const DEFAULT_TIMEOUT = 10000; // 10 segundos
    const DEFAULT_MAX_AGE = 300000; // 5 minutos
    
    // Cache para armazenamento temporário da localização
    let locationCache = null;
    let cacheTimestamp = 0;
    
    /**
     * Verifica se a API de Geolocalização está disponível no navegador
     * @returns {boolean} Verdadeiro se a API estiver disponível
     */
    const isAvailable = () => {
        return 'geolocation' in navigator;
    };
    
    /**
     * Obtém a localização atual do usuário
     * @param {Object} options Opções para a API de geolocalização
     * @param {boolean} options.useCache Utiliza cache se disponível e não expirado
     * @param {number} options.maxAge Tempo máximo em ms para utilizar cache
     * @param {number} options.timeout Tempo máximo em ms para aguardar resposta
     * @returns {Promise<GeolocationPosition>} Promise com os dados de posição
     */
    const getCurrentPosition = (options = {}) => {
        const {
            useCache = true,
            maxAge = DEFAULT_MAX_AGE,
            timeout = DEFAULT_TIMEOUT
        } = options;
        
        // Verifica se pode usar cache e se o cache é válido
        if (useCache && locationCache && (Date.now() - cacheTimestamp < maxAge)) {
            return Promise.resolve(locationCache);
        }
        
        // Verifica se a API está disponível
        if (!isAvailable()) {
            return Promise.reject(new Error('Geolocalização não suportada neste navegador'));
        }
        
        // Configurações para a API de geolocalização
        const geolocationOptions = {
            enableHighAccuracy: true,
            timeout: timeout,
            maximumAge: maxAge
        };
        
        // Retorna uma Promise que será resolvida quando obtivermos a localização
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Atualiza o cache
                    locationCache = position;
                    cacheTimestamp = Date.now();
                    resolve(position);
                },
                (error) => {
                    // Mapeia erros de geolocalização para mensagens mais amigáveis
                    let errorMessage;
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Acesso à localização foi negado pelo usuário';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Informações de localização não estão disponíveis';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Tempo limite excedido ao obter localização';
                            break;
                        default:
                            errorMessage = `Erro ao obter localização: ${error.message}`;
                    }
                    
                    reject(new Error(errorMessage));
                },
                geolocationOptions
            );
        });
    };
    
    /**
     * Monitora continuamente a posição do usuário
     * @param {Function} successCallback Função chamada quando receber nova posição
     * @param {Function} errorCallback Função chamada em caso de erro
     * @param {Object} options Opções para a API de geolocalização
     * @returns {number} ID do monitor para uso com clearWatch
     */
    const watchPosition = (successCallback, errorCallback, options = {}) => {
        if (!isAvailable()) {
            if (errorCallback) {
                errorCallback(new Error('Geolocalização não suportada neste navegador'));
            }
            return null;
        }
        
        const geolocationOptions = {
            enableHighAccuracy: options.enableHighAccuracy || true,
            timeout: options.timeout || DEFAULT_TIMEOUT,
            maximumAge: options.maxAge || DEFAULT_MAX_AGE
        };
        
        return navigator.geolocation.watchPosition(
            (position) => {
                // Também atualiza o cache ao monitorar
                locationCache = position;
                cacheTimestamp = Date.now();
                successCallback(position);
            },
            errorCallback,
            geolocationOptions
        );
    };
    
    /**
     * Para de monitorar a posição do usuário
     * @param {number} watchId ID retornado por watchPosition
     */
    const clearWatch = (watchId) => {
        if (watchId !== null && isAvailable()) {
            navigator.geolocation.clearWatch(watchId);
        }
    };
    
    /**
     * Calcula a distância entre duas coordenadas em km (fórmula de Haversine)
     * @param {number} lat1 Latitude do ponto 1 em graus decimais
     * @param {number} lon1 Longitude do ponto 1 em graus decimais
     * @param {number} lat2 Latitude do ponto 2 em graus decimais
     * @param {number} lon2 Longitude do ponto 2 em graus decimais
     * @returns {number} Distância em quilômetros
     */
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Raio da Terra em km
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    };
    
    /**
     * Calcula a distância entre a posição atual do usuário e um ponto definido
     * @param {number} destLat Latitude do destino
     * @param {number} destLon Longitude do destino
     * @returns {Promise<number>} Promise com a distância em quilômetros
     */
    const distanceFromCurrentPosition = async (destLat, destLon) => {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            return calculateDistance(latitude, longitude, destLat, destLon);
        } catch (error) {
            throw new Error(`Não foi possível calcular a distância: ${error.message}`);
        }
    };
    
    /**
     * Converte graus para radianos
     * @param {number} degrees Ângulo em graus
     * @returns {number} Ângulo em radianos
     */
    const toRadians = (degrees) => {
        return degrees * (Math.PI / 180);
    };
    
    /**
     * Formata coordenadas para exibição
     * @param {number} latitude Latitude em graus decimais
     * @param {number} longitude Longitude em graus decimais
     * @param {string} format Formato desejado ('dms' para graus, minutos e segundos ou 'dd' para decimal)
     * @returns {string} Coordenadas formatadas
     */
    const formatCoordinates = (latitude, longitude, format = 'dd') => {
        if (format === 'dms') {
            return `${convertToDMS(latitude, 'lat')}, ${convertToDMS(longitude, 'lon')}`;
        }
        
        // Formato decimal padrão com 6 casas decimais
        return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    };
    
    /**
     * Converte coordenadas decimais para graus, minutos e segundos
     * @param {number} decimal Coordenada em graus decimais
     * @param {string} type 'lat' para latitude ou 'lon' para longitude
     * @returns {string} Coordenada formatada em graus, minutos e segundos
     */
    const convertToDMS = (decimal, type) => {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutesNotTruncated = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesNotTruncated);
        const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
        
        let direction = '';
        if (type === 'lat') {
            direction = decimal >= 0 ? 'N' : 'S';
        } else {
            direction = decimal >= 0 ? 'E' : 'W';
        }
        
        return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
    };
    
    /**
     * Verifica se as coordenadas estão dentro de um raio específico
     * @param {number} centerLat Latitude do centro
     * @param {number} centerLon Longitude do centro
     * @param {number} pointLat Latitude do ponto
     * @param {number} pointLon Longitude do ponto
     * @param {number} radiusKm Raio em quilômetros
     * @returns {boolean} Verdadeiro se o ponto estiver dentro do raio
     */
    const isWithinRadius = (centerLat, centerLon, pointLat, pointLon, radiusKm) => {
        const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
        return distance <= radiusKm;
    };
    
    /**
     * Encontra o local mais próximo de uma lista de locais
     * @param {Array} locations Array de locais, cada um com {lat, lon, name}
     * @returns {Promise<Object>} Promise com o local mais próximo
     */
    const findNearestLocation = async (locations) => {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            let nearestLocation = null;
            let shortestDistance = Infinity;
            
            locations.forEach(location => {
                const distance = calculateDistance(
                    latitude, 
                    longitude, 
                    location.lat, 
                    location.lon
                );
                
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestLocation = {
                        ...location,
                        distance: distance
                    };
                }
            });
            
            return nearestLocation;
        } catch (error) {
            throw new Error(`Não foi possível encontrar o local mais próximo: ${error.message}`);
        }
    };
    
    // API pública
    return {
        isAvailable,
        getCurrentPosition,
        watchPosition,
        clearWatch,
        calculateDistance,
        distanceFromCurrentPosition,
        formatCoordinates,
        isWithinRadius,
        findNearestLocation
    };
})();

// Exporta o módulo para uso em outros arquivos
export default GeolocationUtils;
