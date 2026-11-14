/* Offline copy of the app.
   The app page itself: always try the network first (so a new version shows the moment you open it),
   fall back to the saved copy when there's no signal. Everything else: saved copy first. */
var CACHE = "br-workout-v16";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(CORE.map(function(u){ return fetch(new Request(u, { cache:"reload" })).then(function(r){ if(r.ok) return c.put(u, r); }); }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
function timeout(ms){ return new Promise(function(_, rej){ setTimeout(function(){ rej(new Error("slow")); }, ms); }); }
self.addEventListener("fetch", function(e){
  var req = e.request; if(req.method !== "GET") return;
  var url = new URL(req.url), same = url.origin === location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(!same && !font) return;
  var page = req.mode === "navigate" || (same && /\/(index\.html)?$/.test(url.pathname));
  if(page){
    e.respondWith(caches.open(CACHE).then(function(c){
      var net = fetch(new Request("index.html", { cache:"no-cache" })).then(function(res){ if(res.ok){ c.put("index.html", res.clone()); c.put("./", res.clone()); } return res; });
      return Promise.race([net, timeout(4000)]).catch(function(){ return c.match("index.html").then(function(hit){ return hit || net; }); });
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function(c){ return c.match(req, { ignoreSearch: same }).then(function(hit){
    var net = fetch(same ? new Request(req, { cache:"no-cache" }) : req).then(function(res){ if(res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(function(){ return hit; });
    return hit || net; }); }));
});
