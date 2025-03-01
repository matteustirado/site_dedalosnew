
# Dédalos Bar - Documentação do Projeto

## Visão Geral

Bem-vindo à documentação oficial do site do Dédalos Bar! Este projeto é um website moderno e interativo para o Dédalos Bar, um estabelecimento exclusivo para homens cis e trans maiores de 18 anos localizado em São Paulo, Belo Horizonte e Rio de Janeiro.

O site combina design impactante com funcionalidades interativas, proporcionando aos usuários uma experiência digital que reflete a atmosfera única do bar.

## Índice

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Scripts e Ferramentas](#scripts-e-ferramentas)
- [Acessibilidade](#acessibilidade)
- [Contribuição](#contribuição)
- [Convenções de Código](#convenções-de-código)
- [Roadmap](#roadmap)
- [Contato e Suporte](#contato-e-suporte)

## Requisitos

### Requisitos de Sistema

- Node.js (v14.0.0 ou superior)
- npm (v6.0.0 ou superior)
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Servidor web para hospedagem (produção)

### Requisitos de Desenvolvimento

- Editor de código (recomendado: VS Code)
- Git
- Conhecimento em HTML, CSS e JavaScript
- Familiaridade com design responsivo

## Instalação

Para iniciar o desenvolvimento, siga os passos abaixo:

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/dedalos-bar.git
```

2. Navegue até a pasta do projeto:

```bash
cd dedalos-bar
```

3. Instale as dependências (se aplicável para futuras implementações):

```bash
npm install
```

4. Inicie o servidor de desenvolvimento:

```bash
# Se estiver usando extensão Live Server no VS Code:
# Clique com o botão direito no arquivo index.html e selecione "Open with Live Server"

# Ou usando um servidor local simples via Node:
npx serve
```

5. O site estará disponível em `http://localhost:3000` ou porta similar.

## Estrutura do Projeto

O projeto segue uma arquitetura organizada e modular:

```
dedalos_site/
│
├── index.html                # Página principal
├── termos.html               # Página de termos de uso
├── privacidade.html          # Página de política de privacidade
├── manifest.json             # Configuração PWA
├── service-worker.js         # Service worker para funcionalidade offline
│
├── assets/                   # Recursos estáticos
│   ├── images/               # Imagens e gráficos
│   ├── fonts/                # Arquivos de fontes (Poppins)
│   └── videos/               # Recursos de vídeo
│
├── css/                      # Estilos
│   ├── core/                 # Estilos fundamentais
│   ├── components/           # Estilos de componentes reutilizáveis
│   ├── sections/             # Estilos específicos para seções
│   └── responsive/           # Ajustes responsivos
│
├── js/                       # JavaScript
│   ├── core/                 # Scripts fundamentais
│   ├── utils/                # Utilitários e helpers
│   ├── effects/              # Efeitos visuais
│   ├── components/           # Componentes interativos
│   ├── sections/             # Lógica específica de seções
│   ├── integrations/         # Integrações com APIs
│   ├── user/                 # Funcionalidades relacionadas a usuários
│   └── pwa/                  # Recursos PWA
│
├── docs/                     # Documentação
└── tests/                    # Testes
```

## Desenvolvimento

### Fluxo de Trabalho

O site segue um fluxo de desenvolvimento em fases, definido no arquivo `nova ordem.txt`. O desenvolvimento é organizado em 13 fases, desde a fundação até a preparação para lançamento.

### Paleta de Cores

O projeto utiliza uma paleta específica de cores, definida em `css/core/variables.css`, baseada nas especificações encontradas em `nova-paleta.txt`. As cores principais incluem:

- Laranja Vibrante (#f5a623)
- Laranja Incandescente (#f76b1c)
- Vermelho Neon (#ff2424)
- Cinza Escuro (#1a1a1a)
- Preto Absoluto (#000000)
- Branco Neutro (#ffffff)

### Funcionalidades Principais

1. **Tela Inicial com Efeito Multichrome**: Fundo interativo reativo ao movimento do mouse
2. **Verificação de Idade**: Garantia de que os usuários são maiores de 18 anos
3. **Sistema de Preços**: Exibição dinâmica de preços por horário e dia da semana
4. **Localização**: Integração com mapas para as três unidades
5. **FAQ Interativo**: Sistema de busca e acordeão para perguntas frequentes
6. **Contato e Carreiras**: Formulários e informações sobre oportunidades

## Scripts e Ferramentas

### Scripts Core

- `js/core/init.js`: Inicializa todo o site e carrega os módulos necessários
- `js/utils/dom.js`: Utilitários para manipulação do DOM
- `js/effects/multichrome.js`: Implementa o efeito de fundo reativo

### Componentes Principais

- Verificação de idade (`js/components/age-verification.js`)
- Sistema de abas (`js/components/tabs.js`)
- Acordeões para FAQ (`js/components/accordions.js`)
- Sliders e carrosséis (`js/components/sliders.js`)

## Acessibilidade

O projeto prioriza a acessibilidade seguindo:

- Semântica HTML apropriada
- Contraste adequado de cores
- Suporte a navegação por teclado
- Compatibilidade com leitores de tela
- WAI-ARIA quando necessário

Todos os componentes interativos devem ser testados para acessibilidade antes de serem implementados no ambiente de produção.

## Contribuição

### Como Contribuir

1. Crie um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Escreva código seguindo as convenções do projeto
4. Teste suas alterações
5. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
6. Push para a branch (`git push origin feature/nova-funcionalidade`)
7. Abra um Pull Request

### Sistema de Rastreamento de Progresso

Utilizamos um sistema visual para acompanhar o progresso do desenvolvimento:

- 🟢 Completo - Item finalizado, testado e aprovado
- 🟡 Em andamento - Desenvolvimento iniciado, mas não concluído
- 🟠 Em revisão - Desenvolvimento concluído, aguardando revisão/testes
- 🔴 Não iniciado - Item ainda a ser desenvolvido
- 🔵 Bloqueado - Dependente de outro componente incompleto
- ⚫ Descartado - Item removido do escopo atual

## Convenções de Código

### HTML
- Indentação com 4 espaços
- Uso de atributos ARIA para acessibilidade
- Nomes de classes usando kebab-case (`class="exemplo-de-classe"`)

### CSS
- Organização por componentes e seções
- Uso de variáveis CSS para cores e valores reutilizáveis
- Convenção BEM (Block Element Modifier) para nomenclatura

### JavaScript
- Padrão camelCase para nomes de variáveis e funções
- Uso do padrão de módulos para organização
- Documentação com JSDoc para funções principais

## Roadmap

Nosso plano de desenvolvimento segue as 13 fases descritas em `nova ordem.txt`:

1. Fundação (Semana 1)
2. Componentes UI (Semana 2-3)
3. Tela Inicial e Verificação (Semana 3-4)
4. Layout Principal (Semana 4-5)
5. Sistema de Preços (Semana 5-6)
6. Sistema de Informações (Semana 6-7)
7. Integração de Mapas (Semana 7-8)
8. Sistema de Contato (Semana 8-9)
9. Social e Eventos (Semana 9-10)
10. PWA e Features Avançadas (Semana 10-11)
11. Responsividade (Semana 11-12)
12. Testes e Otimização (Semana 12-13)
13. Preparação para Lançamento (Semana 13-14)

Após o lançamento inicial, planejamos adicionar:
- Área de login e recursos para usuários cadastrados
- Dashboard com saldo e benefícios
- Sistema de gamificação para frequentadores
- Recursos exclusivos para membros

## Contato e Suporte

Para dúvidas, sugestões ou problemas relacionados ao desenvolvimento, entre em contato com:

- Time de Desenvolvimento: [contato@dedalosbar.com](mailto:contato@dedalosbar.com)
- Desenvolvedor Principal: [@M_tecode](https://instagram.com.br/m_tecode)

---

© 2023 Dédalos Bar | Desenvolvido em parceria com [M_tecode](https://instagram.com.br/m_tecode)
