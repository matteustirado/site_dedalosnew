/**
 * Neural Animation - Animação especial do logo
 * 
 * Este script cria uma animação do tipo rede neural artificial que forma
 * um labirinto triangular, aplicada ao logo do Dédalos Bar.
 * 
 * @author M_tecode
 */

// Namespace para evitar colisões
const NeuralAnimation = (() => {
    // Configurações da animação
    const config = {
        nodeCount: 100,         // Número de nós na rede
        connectionThreshold: 80, // Distância máxima para conexão entre nós
        nodeSize: 2,            // Tamanho dos nós
        nodeColor: '#f5a623',   // Cor dos nós (Laranja Vibrante da paleta)
        connectionColor: 'rgba(245, 166, 35, 0.5)', // Cor das conexões
        animationSpeed: 0.5,    // Velocidade da animação
        triangleFormationRate: 0.01, // Taxa de formação dos triângulos do labirinto
        canvasId: 'neural-canvas', // ID do canvas a ser criado
        logoSelectors: [        // Seletores para localizar elementos do logo
            '.main-logo img',
            '.logo-small img'
        ]
    };

    // Estado interno
    let canvas, ctx;
    let nodes = [];
    let animationFrame;
    let isActive = false;
    let targetElement = null;
    let canvasWidth, canvasHeight;

    // Classe Nó da rede neural
    class Node {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * config.animationSpeed;
            this.vy = (Math.random() - 0.5) * config.animationSpeed;
            this.connections = [];
            this.isLabyrinthNode = Math.random() < config.triangleFormationRate;
        }

        // Atualiza a posição do nó
        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Rebater nas bordas do canvas
            if (this.x <= 0 || this.x >= canvasWidth) this.vx *= -1;
            if (this.y <= 0 || this.y >= canvasHeight) this.vy *= -1;

            // Os nós que formam o labirinto se movem mais lentamente
            if (this.isLabyrinthNode) {
                this.vx *= 0.98;
                this.vy *= 0.98;
            }
        }

        // Desenha o nó
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 
                    this.isLabyrinthNode ? config.nodeSize * 1.5 : config.nodeSize, 
                    0, Math.PI * 2);
            ctx.fillStyle = this.isLabyrinthNode ? '#f76b1c' : config.nodeColor;
            ctx.fill();
        }

        // Calcula distância entre este nó e outro
        distanceTo(node) {
            return Math.sqrt(Math.pow(this.x - node.x, 2) + Math.pow(this.y - node.y, 2));
        }
    }

    // Funções privadas
    const findTargetElement = () => {
        // Procura o elemento do logo na página
        for (const selector of config.logoSelectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    };

    const createCanvas = () => {
        // Criar elemento canvas
        canvas = document.createElement('canvas');
        canvas.id = config.canvasId;
        canvas.className = 'neural-animation-canvas';
        ctx = canvas.getContext('2d');

        // Estilizar canvas
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none'; // Não bloquear interações
        canvas.style.zIndex = '1';
        
        // Posicionar o canvas
        targetElement.style.position = 'relative';
        targetElement.appendChild(canvas);
        
        // Configurar dimensões do canvas
        resizeCanvas();
    };

    const resizeCanvas = () => {
        const rect = targetElement.getBoundingClientRect();
        canvasWidth = rect.width;
        canvasHeight = rect.height;
        
        // Ajustar para pixel ratio para telas de alta resolução
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);
    };

    const initNodes = () => {
        nodes = [];
        for (let i = 0; i < config.nodeCount; i++) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight;
            nodes.push(new Node(x, y));
        }
    };

    const updateConnections = () => {
        // Limpar conexões anteriores
        nodes.forEach(node => node.connections = []);
        
        // Estabelecer novas conexões com base na proximidade
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const distance = nodes[i].distanceTo(nodes[j]);
                if (distance < config.connectionThreshold) {
                    nodes[i].connections.push(nodes[j]);
                    
                    // Se ambos formam parte do labirinto, formamos mais conexões
                    if (nodes[i].isLabyrinthNode && nodes[j].isLabyrinthNode) {
                        // Buscar um terceiro nó para formar um triângulo
                        for (let k = 0; k < nodes.length; k++) {
                            if (k !== i && k !== j && nodes[k].isLabyrinthNode) {
                                const distIK = nodes[i].distanceTo(nodes[k]);
                                const distJK = nodes[j].distanceTo(nodes[k]);
                                
                                if (distIK < config.connectionThreshold * 1.5 && 
                                    distJK < config.connectionThreshold * 1.5) {
                                    // Formamos um triângulo do labirinto
                                    if (!nodes[i].connections.includes(nodes[k])) {
                                        nodes[i].connections.push(nodes[k]);
                                    }
                                    if (!nodes[j].connections.includes(nodes[k])) {
                                        nodes[j].connections.push(nodes[k]);
                                    }
                                    break; // Um triângulo é suficiente por iteração
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    const animate = () => {
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Atualizar e desenhar nós
        nodes.forEach(node => {
            node.update();
            node.draw();
        });

        // Desenhar conexões
        ctx.strokeStyle = config.connectionColor;
        ctx.lineWidth = 0.5;
        
        nodes.forEach(node => {
            node.connections.forEach(connectedNode => {
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(connectedNode.x, connectedNode.y);
                
                // Conexões do labirinto são mais grossas
                if (node.isLabyrinthNode && connectedNode.isLabyrinthNode) {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(247, 107, 28, 0.6)'; // Laranja Incandescente
                } else {
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = config.connectionColor;
                }
                
                ctx.stroke();
            });
        });

        // Desenhar formas triangulares do labirinto
        drawLabyrinthTriangles();

        // Continuar animação
        if (isActive) {
            animationFrame = requestAnimationFrame(animate);
        }
    };

    const drawLabyrinthTriangles = () => {
        // Identificar triângulos formados por nós do labirinto
        const labyrinthNodes = nodes.filter(node => node.isLabyrinthNode);
        
        // Precisamos de pelo menos 3 nós para formar um triângulo
        if (labyrinthNodes.length >= 3) {
            ctx.fillStyle = 'rgba(245, 166, 35, 0.1)'; // Laranja translúcido
            
            // Buscar combinações de 3 nós próximos
            for (let i = 0; i < labyrinthNodes.length - 2; i++) {
                for (let j = i + 1; j < labyrinthNodes.length - 1; j++) {
                    for (let k = j + 1; k < labyrinthNodes.length; k++) {
                        const nodeA = labyrinthNodes[i];
                        const nodeB = labyrinthNodes[j];
                        const nodeC = labyrinthNodes[k];
                        
                        // Verificar se formam um triângulo válido (todos estão próximos)
                        if (nodeA.distanceTo(nodeB) < config.connectionThreshold * 1.5 &&
                            nodeB.distanceTo(nodeC) < config.connectionThreshold * 1.5 &&
                            nodeC.distanceTo(nodeA) < config.connectionThreshold * 1.5) {
                            
                            // Desenhar o triângulo
                            ctx.beginPath();
                            ctx.moveTo(nodeA.x, nodeA.y);
                            ctx.lineTo(nodeB.x, nodeB.y);
                            ctx.lineTo(nodeC.x, nodeC.y);
                            ctx.closePath();
                            ctx.fill();
                        }
                    }
                }
            }
        }
    };

    // API pública
    return {
        init(customConfig = {}) {
            // Mesclar configurações personalizadas
            Object.assign(config, customConfig);
            
            // Encontrar o elemento alvo (logo)
            targetElement = findTargetElement();
            if (!targetElement) {
                console.warn('Neural Animation: Logo element not found!');
                return false;
            }
            
            // Criar canvas e inicializar
            createCanvas();
            initNodes();
            
            // Eventos de redimensionamento
            window.addEventListener('resize', () => {
                if (isActive) {
                    resizeCanvas();
                    initNodes();
                }
            });
            
            return true;
        },
        
        start() {
            if (!targetElement || isActive) return;
            
            isActive = true;
            updateConnections();
            animate();
            
            // Adicionar classe para controle visual
            if (targetElement) {
                targetElement.classList.add('neural-animation-active');
            }
        },
        
        stop() {
            isActive = false;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
            
            // Remover classe
            if (targetElement) {
                targetElement.classList.remove('neural-animation-active');
            }
        },
        
        toggle() {
            if (isActive) {
                this.stop();
            } else {
                this.start();
            }
            return isActive;
        },
        
        isRunning() {
            return isActive;
        },
        
        updateConfig(newConfig) {
            Object.assign(config, newConfig);
            if (isActive) {
                // Reiniciar com as novas configurações
                this.stop();
                initNodes();
                this.start();
            }
        }
    };
})();

// Inicializar após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se temos suporte a canvas
    if (!window.HTMLCanvasElement) {
        console.warn('Neural Animation: Canvas not supported in this browser!');
        return;
    }
    
    // Inicializar o efeito
    const initialized = NeuralAnimation.init();
    
    // Iniciar automaticamente ao passar o mouse sobre o logo
    if (initialized) {
        document.querySelectorAll(NeuralAnimation.config?.logoSelectors?.join(', ') || '.main-logo')
            .forEach(element => {
                element.addEventListener('mouseenter', () => {
                    NeuralAnimation.start();
                });
                
                element.addEventListener('mouseleave', () => {
                    // Opcional: parar a animação quando o mouse sai
                    // NeuralAnimation.stop();
                    
                    // Ou deixar rodando para melhor efeito visual
                });
            });
            
        // Começar automaticamente na tela inicial
        if (document.querySelector('.splash-screen')) {
            setTimeout(() => {
                NeuralAnimation.start();
            }, 1000); // Pequeno atraso para melhor efeito
        }
    }
    
    // Expor para uso global e debugging
    window.NeuralAnimation = NeuralAnimation;
});
