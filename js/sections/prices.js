/**
 * Prices Section Module
 * Responsável pela integração com o utilitário date-time.js e exibição dos preços
 * baseados no dia da semana e horário atual.
 */
(function() {
    'use strict';

    // Tabela de preços completa
    const pricingTable = {
        weekdays: {
            morning: {
                name: "Manhã/Tarde (06h - 13:59h)",
                single: 29.99,
                duo: 35.99,
                trio: 49.99
            },
            afternoon: {
                name: "Tarde/Noite (14h - 19:59h)",
                single: 32.99,
                duo: 49.99,
                trio: 59.99
            },
            night: {
                name: "Noite/Madrugada (20h - 05:59h)",
                single: 35.99,
                duo: 54.99,
                trio: 69.99
            }
        },
        weekend: {
            morning: {
                name: "Manhã/Tarde (06h - 13:59h)",
                single: 34.99,
                duo: 58.99,
                trio: 79.99
            },
            afternoon: {
                name: "Tarde/Noite (14h - 19:59h)",
                single: 49.99,
                duo: 79.99,
                trio: 109.99
            },
            night: {
                name: "Noite/Madrugada (20h - 05:59h)",
                single: 53.99,
                duo: 89.99,
                trio: 119.99
            }
        },
        holidays: {
            morning: {
                name: "Manhã/Tarde (06h - 13:59h)",
                single: 34.99,
                duo: 58.99,
                trio: 79.99
            },
            afternoon: {
                name: "Tarde/Noite (14h - 19:59h)",
                single: 49.99,
                duo: 79.99,
                trio: 109.99
            },
            night: {
                name: "Noite/Madrugada (20h - 05:59h)",
                single: 53.99,
                duo: 89.99,
                trio: 119.99
            }
        }
    };

    // Elementos DOM
    let currentTab = 'today';
    let currentPeriod = '';
    let priceTabButtons;
    let priceTabContents;
    let sliderPrevButtons;
    let sliderNextButtons;
    let sliderIndicators;
    let currentPeriodText;
    let holidayDates = []; // Seria preenchido com datas de feriados

    /**
     * Obtém o período atual com base na hora
     * @param {Date} date - Objeto Date
     * @returns {string} - morning, afternoon ou night
     */
    function getCurrentPeriod(date) {
        const hour = date.getHours();
        
        if (hour >= 6 && hour < 14) {
            return 'morning';
        } else if (hour >= 14 && hour < 20) {
            return 'afternoon';
        } else {
            return 'night';
        }
    }

    /**
     * Verifica se a data é um feriado
     * @param {Date} date - Objeto Date
     * @returns {boolean} - true se for feriado
     */
    function isHoliday(date) {
        // Implementação simplificada - verificaria holidayDates
        // Idealmente usaria uma API ou biblioteca externa para feriados nacionais
        return false;
    }

    /**
     * Verifica se a data é fim de semana
     * @param {Date} date - Objeto Date
     * @returns {boolean} - true se for fim de semana (sábado ou domingo)
     */
    function isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = domingo, 6 = sábado
    }

    /**
     * Determina o tipo de dia para preços
     * @param {Date} date - Objeto Date
     * @returns {string} - weekdays, weekend ou holidays
     */
    function getDayType(date) {
        if (isHoliday(date)) {
            return 'holidays';
        } else if (isWeekend(date)) {
            return 'weekend';
        } else {
            return 'weekdays';
        }
    }

    /**
     * Atualiza o indicador de período atual
     */
    function updateCurrentPeriodIndicator() {
        const now = new Date();
        const period = getCurrentPeriod(now);
        const dayType = getDayType(now);
        
        // Atualiza o texto do período atual
        if (currentPeriodText) {
            currentPeriodText.textContent = pricingTable[dayType][period].name;
        }
        
        // Atualiza o período atual nas variáveis globais
        currentPeriod = period;
        
        // Ativa o slider do período atual
        if (currentTab === 'today') {
            const sliderIndex = period === 'morning' ? 0 : period === 'afternoon' ? 1 : 2;
            changeSlide('today', sliderIndex);
        }
    }

    /**
     * Troca entre as abas de preços (hoje, seg-sex, sab-dom, feriados)
     * @param {string} tabId - ID da aba a ser exibida
     */
    function changeTab(tabId) {
        // Remove a classe 'active' de todas as abas
        priceTabButtons.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-selected', 'false');
        });

        // Esconde todos os conteúdos das abas
        priceTabContents.forEach(content => {
            content.hidden = true;
        });

        // Adiciona a classe 'active' ao botão da aba selecionada
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
            selectedButton.setAttribute('aria-selected', 'true');
        }

        // Exibe o conteúdo da aba selecionada
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) {
            selectedContent.hidden = false;
        }

        // Atualiza a variável de controle
        currentTab = tabId;

        // Se a aba for "today", exibe o período atual
        if (tabId === 'today') {
            updateCurrentPeriodIndicator();
        } else {
            // Para outras abas, exibe o primeiro slide
            changeSlide(tabId, 0);
        }
    }

    /**
     * Muda para o slide específico dentro de uma aba
     * @param {string} tabId - ID da aba
     * @param {number} slideIndex - Índice do slide (0, 1 ou 2)
     */
    function changeSlide(tabId, slideIndex) {
        const sliderTrack = document.getElementById(`${tabId}-slider-track`);
        if (!sliderTrack) return;
        
        // Calcula o deslocamento baseado no índice do slide
        const slideWidth = sliderTrack.parentElement.offsetWidth;
        sliderTrack.style.transform = `translateX(-${slideIndex * slideWidth}px)`;
        
        // Atualiza os indicadores
        const indicators = document.querySelectorAll(`.slider-indicators .indicator`);
        indicators.forEach((indicator, index) => {
            if (index === slideIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    /**
     * Formata o preço para exibição
     * @param {number} price - Preço em formato decimal
     * @returns {string} - Preço formatado como R$ XX,XX
     */
    function formatPrice(price) {
        return `R$ ${price.toFixed(2).replace('.', ',')}`;
    }

    /**
     * Atualiza a exibição de preços com base no dayType e período
     * @param {string} dayType - weekdays, weekend ou holidays
     * @param {string} period - morning, afternoon ou night
     */
    function updatePriceDisplay(dayType, period) {
        // Seleciona os elementos de preço no slide atual
        const slide = document.getElementById(`${dayType}-${period}`);
        if (!slide) return;
        
        const priceValues = slide.querySelectorAll('.price-value');
        
        // Atualiza os valores
        if (priceValues.length >= 3) {
            priceValues[0].textContent = formatPrice(pricingTable[dayType][period].single);
            priceValues[1].textContent = formatPrice(pricingTable[dayType][period].duo);
            priceValues[2].textContent = formatPrice(pricingTable[dayType][period].trio);
        }
    }

    /**
     * Atualiza todos os displays de preço
     */
    function updateAllPrices() {
        const dayTypes = ['weekdays', 'weekend', 'holidays'];
        const periods = ['morning', 'afternoon', 'night'];
        
        dayTypes.forEach(dayType => {
            periods.forEach(period => {
                updatePriceDisplay(dayType, period);
            });
        });
        
        // Atualiza também para a aba "today" com base no dia atual
        const now = new Date();
        const todayType = getDayType(now);
        periods.forEach(period => {
            const todaySlide = document.getElementById(`today-${period}`);
            if (todaySlide) {
                const priceValues = todaySlide.querySelectorAll('.price-value');
                if (priceValues.length >= 3) {
                    priceValues[0].textContent = formatPrice(pricingTable[todayType][period].single);
                    priceValues[1].textContent = formatPrice(pricingTable[todayType][period].duo);
                    priceValues[2].textContent = formatPrice(pricingTable[todayType][period].trio);
                }
            }
        });
    }

    /**
     * Inicializa a seção de preços
     */
    function initPrices() {
        // Seleciona os elementos DOM necessários
        priceTabButtons = document.querySelectorAll('[data-tab]');
        priceTabContents = document.querySelectorAll('.price-tab-content');
        sliderPrevButtons = document.querySelectorAll('.slider-prev');
        sliderNextButtons = document.querySelectorAll('.slider-next');
        sliderIndicators = document.querySelectorAll('.slider-indicators .indicator');
        currentPeriodText = document.getElementById('currentPeriod');
        
        // Atualiza o display de preços
        updateAllPrices();
        
        // Adiciona event listeners para as abas
        priceTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                changeTab(button.getAttribute('data-tab'));
            });
            
            // Suporte a navegação por teclado
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    changeTab(button.getAttribute('data-tab'));
                }
            });
        });
        
        // Adiciona event listeners para os botões de slider
        sliderPrevButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sliderTrack = button.closest('.time-periods-slider').querySelector('.slider-track');
                const tabId = sliderTrack.id.split('-slider-track')[0];
                const indicators = button.closest('.slider-controls').querySelectorAll('.indicator');
                const activeIndex = Array.from(indicators).findIndex(ind => ind.classList.contains('active'));
                
                const newIndex = Math.max(0, activeIndex - 1);
                changeSlide(tabId, newIndex);
            });
        });
        
        sliderNextButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sliderTrack = button.closest('.time-periods-slider').querySelector('.slider-track');
                const tabId = sliderTrack.id.split('-slider-track')[0];
                const indicators = button.closest('.slider-controls').querySelectorAll('.indicator');
                const activeIndex = Array.from(indicators).findIndex(ind => ind.classList.contains('active'));
                
                const newIndex = Math.min(indicators.length - 1, activeIndex + 1);
                changeSlide(tabId, newIndex);
            });
        });
        
        // Adiciona event listeners para os indicadores de slide
        sliderIndicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const slideIndex = parseInt(indicator.getAttribute('data-slide'));
                const tabId = indicator.closest('.price-tab-content').id;
                changeSlide(tabId, slideIndex);
            });
        });
        
        // Inicializa com o tab "hoje" e o período atual
        updateCurrentPeriodIndicator();
        changeTab('today');
        
        // Atualiza o período e preços a cada minuto
        setInterval(updateCurrentPeriodIndicator, 60000);
    }

    // Verifica se o DOM está carregado e inicializa
    function onDOMReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPrices);
        } else {
            initPrices();
        }
    }

    // Inicia quando o DOM estiver pronto
    onDOMReady();

    // Exporta funções para uso global ou por outros módulos
    window.DedalosBar = window.DedalosBar || {};
    window.DedalosBar.Prices = {
        updatePrices: updateAllPrices,
        changeTab: changeTab,
        changeSlide: changeSlide
    };
})();
