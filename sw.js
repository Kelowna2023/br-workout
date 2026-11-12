/* Offline copy of the app. Serves the saved copy at once, then refreshes it in the background. */
var CACHE = "br-workout-v3";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener("activate", function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener("fetch", function(e){
  var req = e.request; if(req.method !== "GET") return;
  var url = new URL(req.url), ok = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(!ok) return;
  e.respondWith(caches.open(CACHE).then(function(c){ return c.match(req, { ignoreSearch: url.origin === location.origin }).then(function(hit){
    var net = fetch(req).then(function(res){ if(res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(function(){ return hit; });
    return hit || net; }); }));
});
