/**
 * Dédalos Bar - Configurações Globais
 * Arquivo central com parâmetros e configurações utilizadas por todo o site
 */

const DEDALOS_CONFIG = {
    // Informações gerais do site
    site: {
        name: "Dédalos Bar",
        tagline: "O próximo Level!",
        version: "1.0.0",
        description: "Bar exclusivo para homens maiores de 18 anos",
        domain: "dedalosbar.com",
        baseUrl: "https://dedalosbar.com"
    },

    // Restrições de idade
    age: {
        minimumAge: 18,
        cookieLifetime: 30, // Dias que o cookie de verificação de idade permanece válido
        storageKey: "dedalos_age_verified"
    },

    // Localizações das unidades
    locations: {
        sao_paulo: {
            id: "sp",
            name: "São Paulo",
            address: "R. Bento Freitas, 38 - República, São Paulo - SP, 01220-000",
            coordinates: {
                lat: -23.543791,
                lng: -46.644762
            },
            metro: "Próximo ao Metrô República",
            parking: "SKY BLUE ESTACIONAMENTO LTDA, R. Rego Freitas, 147"
        },
        belo_horizonte: {
            id: "bh",
            name: "Belo Horizonte",
            address: "R. São Paulo, 1735 - Lourdes, Belo Horizonte - MG, 30170-135",
            coordinates: {
                lat: -19.9332,
                lng: -43.9421
            }
        },
        rio_de_janeiro: {
            id: "rj",
            name: "Rio de Janeiro",
            address: "R. Baronesa, 1237 - Praca Seca, Rio de Janeiro - RJ, 21.321-000",
            coordinates: {
                lat: -22.8789,
                lng: -43.3651
            }
        }
    },

    // Horários de funcionamento
    businessHours: {
        open24Hours: true,
        statusUpdateInterval: 60000, // Atualiza o status a cada 1 minuto (em ms)
        periods: {
            morning: {
                id: "morning",
                label: "Manhã/Tarde",
                startHour: 6,
                endHour: 13,
                endMinute: 59
            },
            afternoon: {
                id: "afternoon",
                label: "Tarde/Noite",
                startHour: 14,
                endHour: 19,
                endMinute: 59
            },
            night: {
                id: "night",
                label: "Noite/Madrugada",
                startHour: 20,
                endHour: 5,
                endMinute: 59
            }
        }
    },

    // Configurações de preços e categorias
    prices: {
        categoryLabels: {
            single: "Single",
            duo: "Mão Amiga",
            trio: "Marmitex"
        },
        categoryDescriptions: {
            single: "Entrada individual",
            duo: "Entrada para duas pessoas",
            trio: "Entrada para três pessoas"
        }
    },

    // Configurações do efeito Multichrome
    multichrome: {
        enabled: true,
        sensitivity: 0.03,
        inertia: 0.08,
        maxLightRadius: 400,
        ambientMovement: true,
        ambientMovementSpeed: 0.5,
        colors: {
            primary: "#f5a623",
            secondary: "#f76b1c",
            accent: "#ff2424",
            background: "#0a0a0f"
        }
    },

    // Configurações de animações e transições
    animations: {
        splashDuration: 3000, // Duração da tela de splash em ms
        impactPhraseChangeInterval: 5000, // Intervalo de troca das frases de impacto
        ageVerificationDelay: 500, // Atraso para mostrar o modal de verificação de idade
        lightspeedDuration: 1200, // Duração da animação de transição lightspeed
        transitionDuration: 800, // Duração padrão das transições entre seções
        enableReducedMotion: true // Respeita configuração de redução de movimento do usuário
    },

    // Controle do contador de check-ins
    checkinCounter: {
        updateInterval: 30000, // Atualiza a cada 30 segundos
        initialValue: 42, // Valor inicial
        fluctuationRange: {
            min: -3,
            max: 5
        },
        minValue: 8, // Valor mínimo
        storageKey: "dedalos_checkin_last_count"
    },

    // Configurações de API (para integrações futuras)
    api: {
        baseUrl: "https://api.dedalosbar.com/v1",
        endpoints: {
            contact: "/contact",
            events: "/events",
            checkins: "/checkins",
            careers: "/careers"
        },
        timeout: 10000, // Timeout de requisições em ms
        retryAttempts: 2
    },

    // Configurações para integrações
    integrations: {
        googleMaps: {
            apiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Substitua em produção
            zoom: 16,
            mapType: "roadmap"
        },
        analytics: {
            enabled: true,
            trackingId: "UA-XXXXXXXX-X" // Substitua em produção
        }
    },

    // Configurações de PWA
    pwa: {
        enabled: true,
        installPromptDelay: 120000, // 2 minutos após interação
        offlinePagePath: "/offline.html",
        cacheVersion: "v1"
    },

    // Debug e ambiente de desenvolvimento
    debug: {
        enabled: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
        logLevel: "info", // "error", "warn", "info", "debug"
        verboseMultichrome: false,
        mockCheckinCounter: true, // Em dev, usar dados mock para o contador
        skipAgeVerification: false // Nunca pule em produção!
    }
};

// Previne modificações acidentais nas configurações
if (Object.freeze) {
    Object.freeze(DEDALOS_CONFIG);
}

// Exporta as configurações
export default DEDALOS_CONFIG;
