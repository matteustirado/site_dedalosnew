/**
 * phrases.js
 * 
 * Biblioteca de frases para exibição dinâmica na splash screen do Dédalos Bar.
 * As frases são exibidas aleatoriamente na tela inicial e seguem o tom 
 * de comunicação voltado para temas de jogos, prazer e diversão.
 */

const DedalosPhrasesModule = (function() {
    'use strict';

    /**
     * Coleção de frases impactantes para a splash screen.
     * Tom: desejo, mistério, jogos, prazer, diversão
     */
    const phrases = [
        // Frases sobre o labirinto e exploração
        "Entre no labirinto do desejo e alcance seu próximo nível.",
        "Cada corredor do labirinto te leva a uma nova experiência.",
        "Perca-se no labirinto e encontre quem você realmente é.",
        "O mito do labirinto: entre se tiver coragem de se descobrir.",
        "Dédalos: o labirinto onde os caminhos sempre levam ao prazer.",

        // Frases sobre liberdade e experiência
        "Liberte-se das amarras e viva a experiência completa.",
        "A liberdade tem um endereço, e você acaba de encontrá-lo.",
        "Seja você mesmo, sem filtros, sem repressão.",
        "Abandone o mundo lá fora e viva o seu verdadeiro eu.",
        "Lugar de homem é onde ele se sente livre para ser quem é.",

        // Frases sobre jogo e diversão
        "Aqui, o jogo só acaba quando você decide parar.",
        "Aperte start e comece uma nova fase da sua diversão.",
        "O game está ligado 24h. Você está pronto para jogar?",
        "A pontuação é alta para quem sabe jogar.",
        "Jogue, provoque, desafie-se no território dos prazeres.",

        // Frases sobre prazer e desejo
        "Há lugares que nos chamam. Este sussurra seu nome.",
        "Desejos proibidos? Aqui, são apenas o começo da aventura.",
        "O desejo não tem limites quando as portas estão abertas.",
        "Permita-se viver o que só existe nos seus sonhos mais quentes.",
        "Um universo de sensações espera por você a cada porta aberta.",

        // Frases sobre encontros e conexões
        "Conexões reais, sem filtros, sem apps. Apenas você e o momento.",
        "Encontros inesperados nos corredores que levam ao prazer.",
        "O que acontece no labirinto, fica no labirinto.",
        "Entre desconhecidos que se entendem no silêncio dos olhares.",
        "Histórias que começam com um olhar e terminam... bem, você decide.",

        // Frases sobre o ambiente e atmosfera
        "Um mundo paralelo onde as regras são outras e a noite nunca acaba.",
        "24 horas onde o tempo passa diferente. Mais intenso. Mais livre.",
        "No calor da noite, reacenda seus instintos mais profundos.",
        "A temperatura sobe conforme você avança pelos corredores.",
        "Música, corpos, sussurros e o pulsar constante da adrenalina.",

        // Frases relacionadas ao nome Dédalos
        "Dédalos: o arquiteto que criou o labirinto do prazer.",
        "Dédalos: perca-se para se encontrar.",
        "Dédalos: no centro do labirinto, você encontra a si mesmo.",
        "Dédalos: onde cada corredor guarda um segredo a ser descoberto.",
        "Dédalos: não há saída porque você não vai querer ir embora.",

        // Frases sobre o espaço físico
        "Cabines, Glory Holes, Glory Ass – a aventura está em cada detalhe.",
        "Um lugar onde o próximo corredor sempre guarda uma surpresa.",
        "Drinks que acendem o fogo, espaços que liberam os instintos.",
        "Do bar ao dark room, deixe seu instinto ser o guia.",
        "Games, drinks, cinema e mais: escolha sua forma de prazer.",

        // Frases de impacto direto
        "Excite-se. Liberte-se. Entregue-se.",
        "Além das portas do comum, o extraordinário acontece a cada minuto.",
        "Quem você é quando ninguém está vendo? Descubra aqui.",
        "A realidade é apenas um conceito. A sua está esperando por você.",
        "Seu coração vai acelerar antes mesmo que você perceba.",

        // Frases com chamadas para ação
        "Abandone o controle. Assuma o prazer.",
        "Atravesse o portal e esqueça o mundo lá fora.",
        "Dê o próximo passo. A aventura te espera.",
        "Não leia mais. Venha sentir.",
        "Menos regras, mais prazer. Entre."
    ];

    /**
     * Retorna uma frase aleatória da coleção.
     * @return {string} Uma frase aleatória.
     */
    function getRandomPhrase() {
        const randomIndex = Math.floor(Math.random() * phrases.length);
        return phrases[randomIndex];
    }

    /**
     * Retorna uma frase específica pelo índice.
     * @param {number} index - O índice da frase desejada.
     * @return {string} A frase selecionada ou uma frase aleatória se o índice for inválido.
     */
    function getPhraseByIndex(index) {
        if (index >= 0 && index < phrases.length) {
            return phrases[index];
        }
        return getRandomPhrase();
    }

    /**
     * Retorna todas as frases disponíveis.
     * @return {Array} O array completo de frases.
     */
    function getAllPhrases() {
        return [...phrases]; // Retorna uma cópia para evitar modificações externas
    }

    /**
     * Retorna o número total de frases disponíveis.
     * @return {number} O número total de frases.
     */
    function getPhrasesCount() {
        return phrases.length;
    }

    /**
     * Atualiza um elemento HTML com uma frase aleatória.
     * @param {string|HTMLElement} elementSelector - O seletor CSS ou elemento HTML a ser atualizado.
     * @param {boolean} [animation=false] - Se verdadeiro, aplica uma animação de fade.
     */
    function updateElementWithRandomPhrase(elementSelector, animation = false) {
        const element = typeof elementSelector === 'string' 
            ? document.querySelector(elementSelector) 
            : elementSelector;
            
        if (!element) return;
        
        if (animation) {
            element.style.opacity = 0;
            
            setTimeout(() => {
                element.textContent = getRandomPhrase();
                element.style.opacity = 1;
            }, 300);
        } else {
            element.textContent = getRandomPhrase();
        }
    }

    // API pública do módulo
    return {
        getRandomPhrase,
        getPhraseByIndex,
        getAllPhrases,
        getPhrasesCount,
        updateElementWithRandomPhrase
    };
})();

// Exportar o módulo para uso global
if (typeof window !== 'undefined') {
    window.DedalosPhrasesModule = DedalosPhrasesModule;
}

// Compatibilidade com sistemas de módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DedalosPhrasesModule;
}
