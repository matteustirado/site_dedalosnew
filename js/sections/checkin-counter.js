/**
 * Checkin Counter - Contador de check-ins em tempo real
 * 
 * Este módulo implementa um contador dinâmico que simula e exibe
 * o número de pessoas presentes no Dédalos Bar em tempo real.
 */

// Importações (garantindo compatibilidade com a estrutura do projeto)
import { EventBus } from '../core/event-bus.js';
import { storageGet, storageSet } from '../utils/storage.js';
import { config } from '../core/config.js';

class CheckinCounter {
    constructor() {
        // Elemento DOM do contador
        this.counterElement = document.getElementById('checkinCounter');
        
        // Valor atual do contador
        this.currentValue = parseInt(this.counterElement?.textContent || '42');
        
        // Configurações do contador
        this.config = {
            // Intervalo de atualização (em milissegundos)
            updateInterval: 15000, // 15 segundos
            
            // Limites de valor para o contador
            minValue: 18,
            maxValue: 110,
            
            // Probabilidades (%)
            increaseChance: 65, // Chance de aumentar
            decreaseChance: 35, // Chance de diminuir
            
            // Limites de variação por atualização
            maxIncrease: 3,
            maxDecrease: 2,
            
            // Horários de pico (maior chance de aumento)
            peakHours: [
                { day: 'all', start: 19, end: 2 }, // 19h às 2h todos os dias
                { day: 'friday', start: 20, end: 4 }, // 20h às 4h nas sextas
                { day: 'saturday', start: 20, end: 5 } // 20h às 5h nos sábados
            ],
            
            // Durante horário de pico
            peakIncreaseChance: 80,
            peakMaxIncrease: 5
        };
        
        // Timer da atualização
        this.updateTimer = null;
        
        // Flags
        this.isAnimating = false;
        this.initialized = false;
    }

    /**
     * Inicializa o contador
     */
    init() {
        if (!this.counterElement || this.initialized) return;
        
        // Recupera o último valor salvo (se existir)
        const savedCount = storageGet('lastCheckinCount');
        if (savedCount) {
            this.currentValue = parseInt(savedCount);
            this.updateCounterDisplay(this.currentValue, false);
        }
        
        // Inicia a atualização periódica
        this.startAutoUpdate();
        
        // Registra eventos
        this.registerEvents();
        
        this.initialized = true;
        
        // Emite evento de inicialização
        EventBus.emit('checkinCounter:initialized', { count: this.currentValue });
    }
    
    /**
     * Registra eventos no EventBus
     */
    registerEvents() {
        // Escuta por eventos de check-in manual (por exemplo, quando um usuário faz login)
        EventBus.on('user:checkin', () => {
            this.increaseCount(1);
        });
        
        // Escuta por eventos de check-out manual
        EventBus.on('user:checkout', () => {
            this.decreaseCount(1);
        });
    }

    /**
     * Inicia a atualização automática do contador
     */
    startAutoUpdate() {
        if (this.updateTimer) clearInterval(this.updateTimer);
        
        this.updateTimer = setInterval(() => {
            this.generateRandomUpdate();
        }, this.config.updateInterval);
        
        // Faz uma primeira atualização imediata
        setTimeout(() => this.generateRandomUpdate(), 3000);
    }

    /**
     * Para a atualização automática
     */
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Gera uma atualização aleatória baseada nas configurações e hora do dia
     */
    generateRandomUpdate() {
        // Verifica se estamos em horário de pico
        const isPeakHour = this.checkIfPeakHour();
        
        // Define as chances com base no horário
        const increaseChance = isPeakHour ? 
            this.config.peakIncreaseChance : 
            this.config.increaseChance;
        
        // Decide se aumenta ou diminui
        const shouldIncrease = Math.random() * 100 < increaseChance;
        
        if (shouldIncrease) {
            // Aumenta o contador
            const maxIncrease = isPeakHour ? 
                this.config.peakMaxIncrease : 
                this.config.maxIncrease;
                
            const amount = Math.ceil(Math.random() * maxIncrease);
            this.increaseCount(amount);
        } else {
            // Diminui o contador
            const amount = Math.ceil(Math.random() * this.config.maxDecrease);
            this.decreaseCount(amount);
        }
    }

    /**
     * Verifica se estamos em horário de pico
     * @returns {boolean} Verdadeiro se for horário de pico
     */
    checkIfPeakHour() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = domingo, 6 = sábado
        
        // Mapeia dias da semana para nomes
        const dayNames = [
            'sunday', 'monday', 'tuesday', 'wednesday', 
            'thursday', 'friday', 'saturday'
        ];
        
        // Verifica cada horário de pico configurado
        return this.config.peakHours.some(peak => {
            // Se for para todos os dias ou se for o dia específico
            if (peak.day === 'all' || peak.day === dayNames[currentDay]) {
                if (peak.start > peak.end) {
                    // Período que atravessa a meia-noite (ex: 22h às 4h)
                    return currentHour >= peak.start || currentHour <= peak.end;
                } else {
                    // Período normal (ex: 14h às 19h)
                    return currentHour >= peak.start && currentHour <= peak.end;
                }
            }
            return false;
        });
    }

    /**
     * Aumenta o contador
     * @param {number} amount Quantidade a aumentar
     */
    increaseCount(amount = 1) {
        // Limita ao valor máximo configurado
        const newValue = Math.min(
            this.currentValue + amount, 
            this.config.maxValue
        );
        
        if (newValue !== this.currentValue) {
            this.updateCounterDisplay(newValue);
        }
    }

    /**
     * Diminui o contador
     * @param {number} amount Quantidade a diminuir
     */
    decreaseCount(amount = 1) {
        // Limita ao valor mínimo configurado
        const newValue = Math.max(
            this.currentValue - amount, 
            this.config.minValue
        );
        
        if (newValue !== this.currentValue) {
            this.updateCounterDisplay(newValue);
        }
    }

    /**
     * Atualiza o display do contador com animação
     * @param {number} newValue Novo valor
     * @param {boolean} animate Se deve animar a transição
     */
    updateCounterDisplay(newValue, animate = true) {
        if (this.isAnimating) return;
        
        const oldValue = this.currentValue;
        this.currentValue = newValue;
        
        // Salva o valor para persistência
        storageSet('lastCheckinCount', this.currentValue);
        
        // Emite evento de mudança
        EventBus.emit('checkinCounter:changed', {
            oldCount: oldValue,
            newCount: this.currentValue,
            difference: this.currentValue - oldValue
        });
        
        // Se não for para animar, apenas atualiza o texto
        if (!animate || !this.counterElement) {
            this.counterElement.textContent = this.currentValue;
            return;
        }
        
        // Anima a mudança
        this.isAnimating = true;
        
        // Cria elementos temporários para animação
        const containerRect = this.counterElement.getBoundingClientRect();
        const tempElement = document.createElement('div');
        tempElement.className = 'counter-value-change';
        tempElement.textContent = (this.currentValue > oldValue ? '+' : '') + 
                                  (this.currentValue - oldValue);
        tempElement.style.position = 'absolute';
        tempElement.style.top = `${containerRect.top}px`;
        tempElement.style.left = `${containerRect.left + containerRect.width/2}px`;
        tempElement.style.transform = 'translate(-50%, 0)';
        tempElement.style.opacity = '0';
        tempElement.style.color = this.currentValue > oldValue ? '#4cd137' : '#e84118';
        tempElement.style.fontSize = '1rem';
        tempElement.style.transition = 'all 1.5s ease-out';
        tempElement.style.zIndex = '10';
        
        document.body.appendChild(tempElement);
        
        // Anima o elemento temporário
        setTimeout(() => {
            tempElement.style.opacity = '1';
            tempElement.style.transform = 'translate(-50%, -20px)';
        }, 10);
        
        // Contador para animação de intervalo
        let current = oldValue;
        const step = (this.currentValue - oldValue) / 20;
        const interval = setInterval(() => {
            current += step;
            if ((step > 0 && current >= this.currentValue) || 
                (step < 0 && current <= this.currentValue)) {
                clearInterval(interval);
                this.counterElement.textContent = this.currentValue;
                
                // Remove o elemento temporário após a animação
                setTimeout(() => {
                    document.body.removeChild(tempElement);
                    this.isAnimating = false;
                }, 500);
            } else {
                this.counterElement.textContent = Math.round(current);
            }
        }, 50);
    }

    /**
     * Define um valor específico para o contador (útil para debugging)
     * @param {number} value Valor a ser definido
     */
    setCount(value) {
        const newValue = Math.max(
            Math.min(value, this.config.maxValue),
            this.config.minValue
        );
        
        this.updateCounterDisplay(newValue);
    }
}

// Inicializa o contador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const checkinCounter = new CheckinCounter();
    
    // Expõe a instância para debugging e chamadas externas
    window.checkinCounter = checkinCounter;
    
    // Inicia após um pequeno delay para garantir que outros componentes críticos já foram carregados
    setTimeout(() => {
        checkinCounter.init();
    }, 1000);
});

// Compatibilidade com módulos ES e CommonJS
export { CheckinCounter };
