const CACHE_NAME = 'IProxyCache';
let cachelist = [];
self.addEventListener('install', async function (installEvent) {
    self.skipWaiting();
    installEvent.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(cachelist);
            })
    );
});
self.addEventListener('fetch', async event => {
    try {
        event.respondWith(handle(event.request))
    } catch (msg) {
        event.respondWith(handleerr(event.request, msg))
    }
});
const handleerr = async (req, msg) => {
    return new Response(`<h1>IProxy遇到了致命错误</h1>
    <b>${msg}</b>`, { headers: { "content-type": "text/html; charset=utf-8" } })
}
//固定头



const handle = async function (req) {
    const urlStr = req.url
    const domain = (urlStr.split('/'))[2]
    
    let qdomain
    if(domain.indexOf("coderfan.cf")>-1){
    qdomain = domain.split('.')[0].replace(/\-/g, '.')
    }else{
    qdomain=domain
    }
    //const qdomain = "www.google.com"
    let proxy_url = urlStr.replace(domain, 'cnk.cyfan.workers.dev')
    const proxy_header = new Headers()

    for (let [key, value] of req.headers) {
        proxy_header.set(key, value)
    }
    proxy_header.set('c-origin', qdomain)
    //在header中指定实际域名
    proxy_header.set('c-type', 'CORS')
    //还原整个fetch
    return fetch(proxy_url, {
        method: req.method,
        headers: proxy_header,
        body: req.body
    }).then(function (res) {
        if (!res) { throw 'error' }
        return caches.open(CACHE_NAME).then(function (cache) {
            cache.delete(req);
            cache.put(req, res.clone());
            return res;
        });
    }).catch(function (err) {
        return caches.match(req).then(function (resp) {
            return resp || new Response(null, { status: 500 })
        })
    })
}
