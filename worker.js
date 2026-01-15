import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
  try {
    event.respondWith(getAssetFromKV(event));
  } catch (e) {
    // Fallback for not found pages
    event.respondWith(
      new Response("404 Not Found", {
        status: 404
      })
    );
  }
});