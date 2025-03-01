// Dédalos Bar - Service Worker
// Versão 1.0.0

const CACHE_NAME = 'dedalos-cache-v1';
const OFFLINE_PAGE = '/offline.html';

// Recursos que serão cacheados imediatamente durante a instalação
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  
  // CSS Core
  '/css/core/reset.css',
  '/css/core/variables.css',
  '/css/core/typography.css',
  '/css/core/base.css',
  '/css/core/animations.css',
  '/css/core/accessibility.css',
  
  // CSS Componentes principais
  '/css/components/buttons.css',
  '/css/components/modals.css',
  '/css/components/navigation.css',
  
  // CSS Seções críticas
  '/css/sections/splash-screen.css',
  '/css/sections/age-verification.css',
  '/css/sections/header.css',
  '/css/sections/hero.css',
  
  // Imagens essenciais
  '/assets/images/logo/logo.png',
  '/assets/images/logo/logo-main.png',
  '/assets/images/logo/favicon.png',
  '/assets/images/icons/apple-touch-icon.png',
  
  // Fontes
  '/assets/fonts/poppins-v20-latin-regular.woff2',
  '/assets/fonts/poppins-v20-latin-500.woff2',
  '/assets/fonts/poppins-v20-latin-600.woff2',
  '/assets/fonts/poppins-v20-latin-700.woff2',
  
  // JavaScript crítico
  '/js/core/init.js',
  '/js/core/config.js',
  '/js/effects/multichrome.js',
  '/js/components/age-verification.js',
  '/js/utils/storage.js',
];

// Recursos adicionais para cache durante o uso
const DYNAMIC_CACHE_RESOURCES = [
  '/css/components/cards.css',
  '/css/components/forms.css',
  '/css/components/tabs.css',
  '/css/components/sliders.css',
  '/css/components/accordions.css',
  '/css/components/carousels.css',
  '/css/sections/prices.css',
  '/css/sections/info-tabs.css',
  '/css/sections/rules.css',
  '/css/sections/faq.css',
  '/css/sections/locations.css',
  '/css/sections/contact.css',
  '/css/sections/events.css',
  '/css/sections/footer.css',
  '/css/responsive/mobile.css',
  '/css/responsive/tablet.css',
  '/css/responsive/desktop.css',
  
  // JavaScript adicional
  '/js/components/tabs.js',
  '/js/components/sliders.js',
  '/js/components/accordions.js',
  '/js/sections/prices.js',
  '/js/sections/hero.js',
  '/js/sections/checkin-counter.js',
  '/js/effects/transitions.js',
  '/js/integrations/maps-api.js',
];

// Extensões de arquivo para cachear dinamicamente
const CACHE_EXTENSIONS = ['.html', '.css', '.js', '.json', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];

// Instalar o service worker e cachear recursos essenciais
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando arquivos essenciais');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => {
        console.log('[Service Worker] Instalação concluída');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Erro durante a instalação:', error);
      })
  );
});

// Limpar caches antigos ao ativar
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  
  const currentCaches = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          console.log('[Service Worker] Removendo cache antigo:', cacheToDelete);
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => {
        console.log('[Service Worker] Agora está ativo e controlando a página');
        return self.clients.claim();
      })
  );
});

// Estratégia para interceptar e responder às solicitações de recursos
self.addEventListener('fetch', event => {
  // Ignore solicitações de análise/rastreamento
  if (event.request.url.includes('/analytics') || 
      event.request.url.includes('/gtag') || 
      event.request.url.includes('/gtm')) {
    return;
  }
  
  // Ignora solicitações de outras origens (cross-origin)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Ignora solicitações de método diferente de GET
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  
  // Estratégia para a página principal e HTML: Network-first com fallback para cache
  if (requestUrl.pathname === '/' || 
      requestUrl.pathname === '/index.html' || 
      requestUrl.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a resposta atualizada
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // Fallback para o cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Se não tiver no cache, retorna a página offline
              return caches.match(OFFLINE_PAGE);
            });
        })
    );
    return;
  }
  
  // Estratégia para arquivos de fonte, CSS, JS e imagens: Cache-first com fallback para network
  const fileExt = requestUrl.pathname.split('.').pop();
  if (CACHE_EXTENSIONS.includes('.' + fileExt)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Retorna do cache se disponível
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Senão, busca na rede
          return fetch(event.request)
            .then(response => {
              // Cache a nova resposta
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
              return response;
            })
            .catch(error => {
              console.error('[Service Worker] Falha ao buscar recurso:', error);
              
              // Verifica se é uma imagem
              if (fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'gif' || fileExt === 'webp') {
                // Retorna uma imagem placeholder
                return caches.match('/assets/images/placeholder.png');
              }
              
              // Retorno vazio para outros recursos
              return new Response('', { status: 408, statusText: 'Recurso indisponível offline' });
            });
        })
    );
    return;
  }
  
  // Estratégia padrão para outros recursos: Network com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Verifica se devemos cachear este recurso dinamicamente
        if (shouldCacheDynamically(event.request.url)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Tenta buscar no cache se falhar na rede
        return caches.match(event.request);
      })
  );
});

// Verifica se um recurso deve ser cacheado dinamicamente
function shouldCacheDynamically(url) {
  // Não cache URLs de terceiros
  if (!url.startsWith(self.location.origin)) {
    return false;
  }
  
  // Verifica se a extensão está na lista para cache
  const fileExt = url.split('.').pop().toLowerCase();
  if (CACHE_EXTENSIONS.includes('.' + fileExt)) {
    return true;
  }
  
  // Verifica se é uma das rotas dinâmicas que queremos cachear
  for (const resource of DYNAMIC_CACHE_RESOURCES) {
    if (url.includes(resource)) {
      return true;
    }
  }
  
  return false;
}

// Recebe mensagens do cliente (página)
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Limpar o cache específico
  if (event.data && event.data.action === 'clearCache') {
    caches.delete(CACHE_NAME)
      .then(() => {
        console.log('[Service Worker] Cache limpo com sucesso');
        // Pode enviar uma resposta para o cliente se necessário
        event.ports[0].postMessage({ result: 'success' });
      })
      .catch(error => {
        console.error('[Service Worker] Erro ao limpar cache:', error);
        event.ports[0].postMessage({ result: 'error', message: error.message });
      });
  }
});

// Evento de sincronização em segundo plano (útil para envio de formulários pendentes)
self.addEventListener('sync', event => {
  if (event.tag === 'contactFormSync') {
    event.waitUntil(syncContactForm());
  }
});

// Sincroniza formulários de contato pendentes
function syncContactForm() {
  return self.clients.matchAll()
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          action: 'syncContactForms'
        });
      });
    });
}

console.log('[Service Worker] Script carregado');
