const CACHE_NAME='sanpaid-runtime-v69';
const FALLBACK_ASSETS=[
  './','./index.html','./styles.css','./mobile.css','./design-tokens.css','./color-system-v5.css',
  './app.js','./mobile.js','./evaluator-final.css','./evaluator-final.js','./top1-polish.js',
  './connected-demo.css','./connected-demo.js','./auth-unified.css','./auth-unified.js',
  './customer-worker-dashboard.css','./customer-worker-dashboard.js','./handover-evidence.css','./handover-evidence.js',
  './manifest.webmanifest','./app-icon.svg','./social-preview.svg','./robots.txt','./sitemap.xml'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const results=await Promise.allSettled(FALLBACK_ASSETS.map(async asset=>{
      const request=new Request(asset,{cache:'reload'});
      const response=await fetch(request);
      if(!response.ok)throw new Error(`Precache failed: ${asset} (${response.status})`);
      await cache.put(request,response);
    }));
    const failed=results.filter(result=>result.status==='rejected');
    if(failed.length)console.warn(`[SanPaid SW] ${failed.length} optional shell assets were not precached.`);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sanpaid-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='CLEAR_SANPAID_CACHE')event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sanpaid-')).map(key=>caches.delete(key)))));
});

async function networkFirst(request,fallbackKey=null){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok){try{await cache.put(request,response.clone());}catch{}}
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached)return cached;
    if(fallbackKey){const fallback=await cache.match(fallbackKey);if(fallback)return fallback;}
    throw error;
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname==='/build-info.json')return;
  if(request.mode==='navigate'){event.respondWith(networkFirst(request,'./index.html'));return;}
  if(/\.(?:js|css|html)$/i.test(url.pathname)){event.respondWith(networkFirst(request));return;}
  if(/\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$/i.test(url.pathname)){
    event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
      const cached=await cache.match(request);
      const network=fetch(request).then(response=>{if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});return response;}).catch(()=>cached);
      return cached||network;
    }));
  }
});
