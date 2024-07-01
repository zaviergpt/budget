
storage = {
    name: "budget", 
    resources: [
        "/", "/script.js", "/style.css"
    ]
}

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(storage.name).then((cache) => {
        cache.addAll(storage.resources)
    }))
})
self.addEventListener("activate", (event) => {
    console.log("Service Worker activated.")
})
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) return response
            return fetch(event.request)
        })
    )
})