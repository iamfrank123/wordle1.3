// IMPORTANT: Increment this version number whenever you deploy updates
// This will force all users to download the new version automatically
const CACHE_VERSION = 4; // Changed from 3 to 4 for Socket.IO fixes
const CACHE_NAME = `wordle-cache-v${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './solo.js',
  './client_translations.js',
  './translation_manager.js',
  './duello.html',
  './duello.js',
  './maratona.html',
  './maratona.js',
  './all_vs_all.html',
  './all_vs_all.js',
  './all_vs_all_style.css',
  './modes/parole_xl/client.html',
  './modes/parole_xl/client.js',
  './modes/parole_xl/client.css',
  './immagini/splash.png',
  './audio/audio_win.mp3',
  './audio/audio_turn.mp3',
  './audio/tick.mp3',
  './audio/myturn.mp3'
];

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE).catch(() => {
          // Silently ignore cache errors during installation
          console.log('Some assets failed to cache, continuing anyway');
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches and take control immediately
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Don't intercept fetch requests at all - let everything go directly to the network
// This prevents ALL "Failed to fetch" errors with Socket.IO and dynamic requests
self.addEventListener('fetch', (event) => {
  // Do nothing - let requests pass through normally
});
