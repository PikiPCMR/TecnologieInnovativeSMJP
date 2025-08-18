// spazio.js
import { supabase } from './collegamentoDb.js';

const $ = (s)=>document.querySelector(s);
const params = new URLSearchParams(location.search);
const spazioId = params.get("id");

// fasce orarie
const FASCE = [
  {id:1, label:"08:00–09:00"},
  {id:2, label:"09:00–10:00"},
  {id:3, label:"10:00–11:00"},
  {id:4, label:"11:00–12:00"},
  {id:5, label:"14:00–15:00"},
  {id:6, label:"15:00–16:00"},
  {id:7, label:"16:00–17:00"},
  {id:8, label:"17:00–18:00"},
];

let valuta = "€";
let selectedSlot = null;
let user = null;
let selectedSlots = [];

document.addEventListener("DOMContentLoaded", async () => {
  user = JSON.parse(localStorage.getItem('user'));
  if (!spazioId) { alert("ID spazio mancante (?id=...)"); return; }

  await loadSpazio();
  await loadRelated();
  initDateInputs();
  await refreshAvailability();
  bindCTA();
});

function setText(id, text){
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ====== CARICAMENTO SPAZIO + HOST ======
async function loadSpazio(){
  const { data: spazio, error } = await supabase
    .from("spazi_lavoro")
    .select("*")
    .eq("id_spazio", spazioId)
    .maybeSingle();

  if(error){ console.error("Errore loadSpazio:", error); return; }
  if(!spazio){ console.warn("Spazio non trovato"); return; }

  // Titoli (bc-title può non esistere: la funzione setText è sicura)
  const titolo = spazio.title || spazio.id_spazio;
  setText("title", titolo);
  setText("bc-title", titolo);
  setText("subtitle", `${spazio.categoria || ""} · ${spazio["Città"] || ""}, ${spazio.provincia || ""} – ${spazio.nazione || ""}`);
  setText("categoria", spazio.categoria || "—");

  // Indirizzo
  const indirizzo = [spazio.indirizzo_spazio, spazio.numero_civico, spazio["Città"]].filter(Boolean).join(" ");
  setText("indirizzo", indirizzo || "—");

  // Capienza & descrizione
  setText("capienza", spazio.capienza_max ?? "—");
  setText("descrizione", spazio.descrizione_lunga || spazio.descrizione_breve || "—");

// Prezzo (legge da DB: prezzo_ora [text] -> numero)
const prezzoDb = parseFloat(spazio.prezzo_ora ?? spazio.prezzo_base_ora);
valuta = spazio.valuta || "€";
setText("prezzo", Number.isFinite(prezzoDb) ? formatPrice(prezzoDb, valuta) : "—");


  // Servizi
  renderServizi(spazio.servizi);

  // Gallery
  renderGallery(spazio.immagini_spazio);

  // Mappa (fallback su latitudine/longitudine se i nomi campo sono quelli)
  const lat = parseFloat(spazio.lat ?? spazio.latitudine ?? 45.07);
  const lng = parseFloat(spazio.lng ?? spazio.longitudine ?? 7.69);
  initMap({ lat, lng, title: titolo });

  // Dati gestore (in "registrazione" la chiave è "id")
  if (spazio.id_gestore){
    const { data: host } = await supabase.from("registrazione")
      .select("id, nome, cognome, email , numero_telefono, immagine_profilo")
      .eq("id", spazio.id_gestore)
      .maybeSingle();

    if(host){
      setText("hostName", `${host.nome || ""} ${host.cognome || ""}`.trim() || "Gestore");
      setText("hostMail", "Email: "+host.email || "");
      setText("hostPhone", "Telefono: "+host.numero_telefono || "");
      const av = document.getElementById("hostAvatar");
      if (av) av.src = host.immagine_profilo || "https://ui-avatars.com/api/?name=G";
    }
  }
}

function renderServizi(servizi){
  const ul = $("#servizi"); if (!ul) return;
  ul.innerHTML = "";
  (Array.isArray(servizi) ? servizi : []).forEach(s=>{
    const li = document.createElement("li");
    li.textContent = s;
    ul.appendChild(li);
  });
}

function renderGallery(imgs){
  const hero = $("#hero");
  if (!hero) return;

  const arr = Array.isArray(imgs) ? imgs : [];
  if(arr.length){
    hero.src = arr[0];
    const thumbs = $("#thumbs");
    if (thumbs){
      thumbs.innerHTML = "";
      arr.slice(0,4).forEach(url=>{
        const i = document.createElement("img");
        i.src = url; i.alt = "foto spazio";
        i.addEventListener("click", ()=> hero.src = url);
        thumbs.appendChild(i);
      });
    }
  } else {
    hero.src = "https://picsum.photos/1200/800?blur=2";
  }
}

// ====== DATE & DISPONIBILITÀ ======
function initDateInputs(){
  const today = new Date().toISOString().slice(0,10);
  const g = $("#giorno"), bkd = $("#bk-date");
  if (g) g.value = today;
  if (bkd) bkd.value = today;

  g?.addEventListener("change", refreshAvailability);
  bkd?.addEventListener("change", ()=>{
    if (g && bkd) g.value = bkd.value;
    refreshAvailability();
  });
}

async function refreshAvailability(){
  selectedSlot = null;
  const bkSel = $("#bk-slot");
  if (bkSel) bkSel.innerHTML = `<option value="">Seleziona</option>`;
  const day = $("#giorno")?.value;

  const { data: prenotazioni } = await supabase
    .from("prenotazione")
    .select("fascia_oraria")
    .eq("id_spazio", spazioId)
    .eq("giorno", day);

  const occupate = new Set((prenotazioni||[]).map(p=>String(p.fascia_oraria)));

  const wrap = $("#slots"); if (!wrap) return;
  wrap.innerHTML = "";
  FASCE.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "slot";
    btn.type = "button";
    btn.textContent = f.label;
    const busy = occupate.has(String(f.id));
    btn.setAttribute("aria-disabled", busy ? "true" : "false");
    if (!busy) {
      btn.addEventListener("click", () => {
        // Toggle selezione multipla
        if (selectedSlots.includes(f.id)) {
          selectedSlots = selectedSlots.filter(id => id !== f.id);
          btn.setAttribute("aria-selected", "false");
        } else {
          selectedSlots.push(f.id);
          btn.setAttribute("aria-selected", "true");
        }
        toggleCTA();
      });
      btn.setAttribute("aria-selected", selectedSlots.includes(f.id) ? "true" : "false");
    }
    wrap.appendChild(btn);
  });

  toggleCTA();
  drawSparkline(await occupancyLast30());
}

function toggleCTA() {
  const enabled = Boolean($("#bk-date")?.value && selectedSlots.length > 0);
  const btn = $("#ctaPrenota");
  if (btn) btn.disabled = !enabled;
}

// ====== PRENOTAZIONE ======
function bindCTA(){
   document.getElementById("ctaPrenota")?.addEventListener("click", async ()=> {
    if(!user || !user.id){
      alert("Devi essere loggato per prenotare.");
      return;
    }
    const giorno = $("#bk-date")?.value;
    if (!giorno || !selectedSlots.length) return;

    let errorOccurred = false;

    for (const fascia of selectedSlots) {
      const payload = {
        id_prenotazione: crypto.randomUUID(),
        id_utente: user.id,
        id_spazio: spazioId,
        giorno,
        fascia_oraria: fascia,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase.from("prenotazione").insert(payload);
      if (error) {
        alert("Errore prenotazione");
        console.error(error);
        errorOccurred = true;
        break;
      }
    }

    await refreshAvailability();

    if (!errorOccurred) {
      window.location.href = `prenotazione.html?id=${encodeURIComponent(spazioId)}&giorno=${encodeURIComponent(giorno)}&selectedSlots=${encodeURIComponent(selectedSlots)}`;
    }
  });
    
}


// ====== RELATED ======
async function loadRelated(){
  const { data: rows } = await supabase.from("spazi_lavoro")
    .select("id_spazio, title, immagini_spazio, categoria, città")
    .neq("id_spazio", spazioId)
    .limit(4);

  const box = $("#related"); if (!box) return;
  box.innerHTML = "";
  (rows||[]).forEach(r=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${(r.immagini_spazio||[])[0] || "https://picsum.photos/600/400"}" alt="">
      <div style="padding:10px">
        <strong>${r.title || r.id_spazio}</strong><br>
        <span class="muted">${r.categoria || ""} · ${r["Città"] || ""}</span>
      </div>`;
    card.addEventListener("click", ()=>location.href=`spazio.html?id=${encodeURIComponent(r.id_spazio)}`);
    box.appendChild(card);
  });
}

// ====== MAPPA ======
function initMap({lat, lng, title}){
  const map = L.map("map").setView([lat, lng], 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  L.marker([lat,lng]).addTo(map).bindPopup(title);
}

// ====== OCCUPAZIONE ======
async function occupancyLast30(){
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate()-29);
  const { data = [] } = await supabase.from("prenotazione")
    .select("giorno, fascia_oraria")
    .eq("id_spazio", spazioId)
    .gte("giorno", start.toISOString().slice(0,10))
    .lte("giorno", end.toISOString().slice(0,10));

  const byDay = {};
  data.forEach(r=>{
    const k = r.giorno;
    byDay[k] = (byDay[k] || new Set());
    byDay[k].add(String(r.fascia_oraria));
  });
  const points = [];
  for(let i=0;i<30;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const k = d.toISOString().slice(0,10);
    const occ = byDay[k]?.size || 0;
    const pct = (occ / FASCE.length) * 100;
    points.push({x:i, y:pct});
  }
  return points;
}

function drawSparkline(points){
  const svg = $("#sparkline"); if (!svg) return;
  const maxY = 100;
  if(!points?.length){ svg.innerHTML=""; return; }
  const d = points.map((p,i)=>{
    const x = (i/(points.length-1))*100;
    const y = 24 - (p.y/maxY)*24;
    return `${i===0?"M":"L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  svg.innerHTML = `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5"></path>`;
}

function formatPrice(n, cur="€"){
  const num = Number(n);
  return Number.isFinite(num) ? `${cur}${num.toLocaleString("it-IT")}` : "—";
}
// ====== RECENSIONI ======
async function loadReviews() {
  // 1) Prendo tutte le recensioni di questo spazio
  const { data: recs, error } = await supabase
    .from('recensioni')
    .select(`
      voto,
      commento,
      data_recensione,
      registrazione:registrazione ( nome, cognome )
    `)
    .eq('id_spazio', spazioId)
    .order('data_recensione', { ascending: false });

  if (error) {
    console.error('loadReviews error:', error);
    return;
  }

  // 2) Media e count
  const count = recs.length;
  const avg = count ? (recs.reduce((s, r) => s + Number(r.voto || 0), 0) / count) : 0;

  // summary
  const summary = document.getElementById('reviews-summary');
  const avgEl = document.getElementById('avg-rating');
  const cntEl = document.getElementById('reviews-count');
  if (summary && avgEl && cntEl) {
    if (count > 0) {
      avgEl.textContent = avg.toFixed(1);
      cntEl.textContent = count;
      summary.hidden = false;
    } else {
      summary.hidden = true;
    }
  }

  // 3) Badge in testata
  const badge = document.getElementById('ratingBadge');
  const ratingValue = document.getElementById('ratingValue');
  if (badge && ratingValue) {
    if (count > 0) {
      ratingValue.textContent = avg.toFixed(1);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  // 4) Lista recensioni
  const container = document.getElementById('reviews-list');
  container.innerHTML = '';
  recs.forEach(r => {
    const div = document.createElement('div');
    div.className = 'review-item';
    const autore = `${r.registrazione?.nome || ''} ${r.registrazione?.cognome || ''}`.trim() || 'Utente';
    const stelle = '★'.repeat(Number(r.voto || 0)) + '☆'.repeat(5 - Number(r.voto || 0));
    const dataIT = r.data_recensione ? new Date(r.data_recensione).toLocaleDateString('it-IT') : '';
    div.innerHTML = `
      <div><strong>${autore}</strong> <span class="review-rating">${stelle}</span></div>
      <small>${dataIT}</small>
      <p>${(r.commento || '').replaceAll('<','&lt;')}</p>
    `;
    container.appendChild(div);
  });
}

// invio / aggiornamento recensione (upsert per evitare errore di vincolo unico)
document.getElementById('submit-review')?.addEventListener('click', async () => {
  const voto = parseInt(document.getElementById('review-rating').value, 10);
  const commento = document.getElementById('review-comment').value.trim();

  if (!user?.id) {
    alert("Accedi per lasciare una recensione.");
    return;
  }
  if (!voto || voto < 1 || voto > 5 || !commento) {
    alert("Inserisci un voto (1–5) e un commento.");
    return;
  }

  // NB: usa onConflict con (id_spazio, id_utente) se hai creato il vincolo UNIQUE su quelle colonne
  const { error } = await supabase
    .from('recensioni')
    .upsert({
      id_spazio: spazioId,
      id_utente: user.id,            // deve combaciare con registrazione.id
      voto,
      commento,
      data_recensione: new Date().toISOString()
    }, { onConflict: 'id_spazio,id_utente' });

  if (error) {
    console.error('submit review error:', error);
    alert("Errore durante l'invio.");
    return;
  }

  document.getElementById('review-rating').value = '';
  document.getElementById('review-comment').value = '';
  await loadReviews();
});

// carica anche le recensioni all’avvio pagina
document.addEventListener("DOMContentLoaded", loadReviews);
