const CACHE_PREFIX = 'workout-routine-pwa-';
const CACHE_NAME = CACHE_PREFIX + 'v8-release-5';
const BASE = '/workout-app/';
const APP_SHELL = [BASE, BASE+'index.html', BASE+'manifest.webmanifest', BASE+'icon-192.png', BASE+'icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(APP_SHELL.map(url => new Request(url, {cache:'reload'})))
  ));
  // Existing clients keep their worker until the user explicitly applies the update.
});
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING')event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET')return;
  const url=new URL(event.request.url);
  if(url.origin !== self.location.origin || !url.pathname.startsWith(BASE))return;
  const navigation=event.request.mode==='navigate';
  const fresh=navigation || /\/(index\.html|manifest\.webmanifest|icon-192\.png|icon-512\.png)$/.test(url.pathname);
  const key=navigation ? BASE+'index.html' : event.request;
  const cacheWrite=[];
  const task=(async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(!fresh){const hit=await cache.match(key);if(hit)return hit;}
    let response;
    try{
      response=await fetch(event.request,{cache:fresh?'no-store':'default'});
      if(response.ok){
        cacheWrite.push(cache.put(key,response.clone()).catch(()=>{}));
        return response;
      }
    }catch(error){}
    const fallback=await cache.match(key) || (navigation ? await cache.match(BASE) : null);
    return fallback || response || new Response('연결할 수 없어요. 인터넷 연결 후 다시 열어주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  })();
  event.respondWith(task);
  event.waitUntil(task.then(()=>Promise.all(cacheWrite)).catch(()=>{}));
});
