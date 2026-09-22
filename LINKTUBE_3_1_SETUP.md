# Link&Tube 3.1 — collaudo e pubblicazione

## File da pubblicare insieme
- `linktube_3_1.html`
- `linktube-sw-final.js`
- `icon-192.png`
- `icon-512.png`

Per una pubblicazione più pulita puoi rinominare `linktube_3_1.html` in `index.html`, ma in quel caso aggiorna anche `linktube-sw-final.js` sostituendo il riferimento `./linktube_3_1.html` con `./index.html`.

## PWA
La PWA richiede HTTPS (oppure localhost durante i test). Il Service Worker usa solo risorse dello stesso dominio.

## Sincronizzazione cloud
1. Crea un KV Cloudflare chiamato `LINKTUBE_SYNC`.
2. Crea un Worker e incolla `linktube-sync-worker-final.js`.
3. Collega il KV al Worker con binding `LINKTUBE_SYNC`.
4. Nell'app inserisci l'URL del Worker, un codice di sincronizzazione casuale di almeno 32 caratteri e una password di cifratura di almeno 8 caratteri.
5. Usa lo stesso codice e la stessa password su tutti i dispositivi.

I dati dei bookmark vengono cifrati nel browser con AES-GCM prima dell'invio.

## Collaudo effettuato
- Sintassi JavaScript dell'app verificata con Node.js.
- Sintassi del Worker verificata con Node.js.
- Backup completo e import JSON presenti.
- Ripristino di backup completo supportato.
- Pull remoto non aggiorna più erroneamente il timestamp locale.
- Service Worker usa un file reale e una cache versionata.
- Icone PWA locali presenti.

## Limite noto
La sincronizzazione 3.1 lavora ancora a livello di intero archivio: se due dispositivi modificano contemporaneamente dati diversi, prevale la versione più recente dell'archivio. Per una sincronizzazione più sofisticata serve la 4.0 con merge per singolo bookmark.
