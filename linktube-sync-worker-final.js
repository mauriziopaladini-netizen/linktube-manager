/* Link&Tube Sync Worker 1.1 — Cloudflare Worker + KV
   Bind a KV namespace as LINKTUBE_SYNC.
   The browser encrypts bookmark data before it reaches this Worker.
*/
const MAX_PACKET_BYTES = 2 * 1024 * 1024;

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (!env.LINKTUBE_SYNC) return json({ error: 'KV binding LINKTUBE_SYNC non configurato.' }, 500, origin);

    const auth = request.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token.length < 32) return json({ error: 'Codice sincronizzazione non valido.' }, 401, origin);

    const key = 'sync:' + await sha256Hex(token);

    try {
      if (request.method === 'GET') {
        const raw = await env.LINKTUBE_SYNC.get(key);
        return json({ packet: raw ? JSON.parse(raw) : null }, 200, origin);
      }

      if (request.method === 'PUT') {
        const contentLength = Number(request.headers.get('Content-Length') || 0);
        if (contentLength && contentLength > MAX_PACKET_BYTES) return json({ error: 'Pacchetto troppo grande.' }, 413, origin);
        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > MAX_PACKET_BYTES) return json({ error: 'Pacchetto troppo grande.' }, 413, origin);
        const packet = JSON.parse(rawBody);
        if (!packet || packet.v !== 1 || packet.alg !== 'AES-GCM' || packet.kdf !== 'PBKDF2-SHA256' || !packet.data || !packet.salt || !packet.iv) {
          return json({ error: 'Pacchetto cifrato non valido.' }, 400, origin);
        }
        await env.LINKTUBE_SYNC.put(key, JSON.stringify(packet));
        return json({ ok: true, savedAt: new Date().toISOString() }, 200, origin);
      }

      return json({ error: 'Metodo non supportato.' }, 405, origin);
    } catch (e) {
      return json({ error: 'Errore interno.' }, 500, origin);
    }
  }
};
