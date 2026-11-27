/* Sabores — service worker: la carta se instala como app y funciona sin internet.
   - Páginas: primero la red (para ver siempre lo último) y, sin conexión, la última copia guardada.
   - Archivos de la web (_next/static, iconos, alérgenos, fuentes): se guardan y se sirven al instante.
   - Firestore no se toca: los datos en vivo siguen llegando como siempre. */
const VERSION = 'sabores-v2'
const PAGES = ['/menu/admin', '/menu/tapas', '/menu/medias', '/menu/vinos', '/menu/alergenos']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => Promise.all(PAGES.map((u) => cache.add(u).catch(() => {}))))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

/* La página avisa de los archivos que ya cargó antes de que existiera el service worker */
self.addEventListener('message', (event) => {
  const urls = event.data && event.data.type === 'cache-urls' ? event.data.urls : null
  if (!Array.isArray(urls)) return
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      Promise.all(urls.map((u) => cache.match(u).then((hit) => hit || cache.add(u).catch(() => {}))))
    )
  )
})

const isStatic = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/alergenos/') ||
  /\.(png|svg|ico|webmanifest|woff2?)$/.test(url.pathname)

async function cacheFirst(req) {
  const cache = await caches.open(VERSION)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) cache.put(req, res.clone())
  return res
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION)
  const hit = await cache.match(req)
  const net = fetch(req)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
      return res
    })
    .catch(() => hit)
  return hit || net
}

async function networkFirst(req, fallbackUrl) {
  const cache = await caches.open(VERSION)
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch (err) {
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }))
    if (hit) return hit
    if (fallbackUrl) {
      const fb = await cache.match(fallbackUrl)
      if (fb) return fb
    }
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req))
    return
  }
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, url.pathname.startsWith('/menu/admin') ? '/menu/admin' : '/menu/tapas'))
    return
  }
  if (isStatic(url)) {
    event.respondWith(cacheFirst(req))
    return
  }
  event.respondWith(networkFirst(req))
})
