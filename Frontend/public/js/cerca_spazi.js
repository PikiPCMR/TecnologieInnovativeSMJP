import { supabase } from '../js/collegamentoDb.js';
import {
  checkLogin,
  toggleProfileMenu,
  accedi,
  registrati,
  handleProfile,
  handleLogout
} from '../js/index.js';

const queryString = window.location.search;

const params = new URLSearchParams(queryString);
let editMode = params.get('edit') === 'true';
window.checkLogin = checkLogin;
window.toggleProfileMenu = toggleProfileMenu;
window.accedi = accedi;
window.registrati = registrati;
window.handleProfile = handleProfile;
window.handleLogout = handleLogout;

let spazi = [];
let map;
let markers = [];

export async function caricaSpazi() {
  checkLogin();
  const { data, error } = await supabase.from('spazi_lavoro').select('*');
  if (error) {
    console.error('❌ Errore nel caricamento degli spazi:', error);
    return;
  }

  spazi = data;
  mostraSpazi(spazi);
  inizializzaMappa(spazi);
}

function mostraSpazi(lista) {
  const container = document.getElementById('listaSpazi');
  if (!lista.length) {
    container.innerHTML = '<p style="color:white; text-align:center;">Nessuno spazio trovato.</p>';
    return;
  }

  container.innerHTML = lista.map(spazio => {
    const immagine = spazio.immagini_spazio?.[0] || 'img/placeholder.jpg';
    const indirizzo = `${spazio.indirizzo_spazio || ''}, ${spazio.numero_civico || ''}`;
    aggiungiMarker(`${indirizzo}, ${spazio.città}`);
    if(editMode) {
      return `
        <div class="workspace-card">
          <img class="workspace-img" src="${immagine}" alt="${spazio.id_spazio}" />
          <div class="workspace-info">
            <h3>${spazio.id_spazio}</h3>
            <p class="location">${spazio.città}, ${spazio.provincia}</p>
            <p class="services">📍 ${indirizzo}</p>
            <p class="services">🧭 Categoria: ${spazio.categoria}</p>
            <div class="workspace-footer">
              <div class="price">Italia</div>
              <button class="btn-book" onclick="Seleziona('${spazio.id_spazio}')">Seleziona</button>
            </div>
          </div>
        </div>
      `;
    }else{
      return `
        <div class="workspace-card">
          <img class="workspace-img" src="${immagine}" alt="${spazio.id_spazio}" />
          <div class="workspace-info">
            <h3>${spazio.id_spazio}</h3>
            <p class="location">${spazio.città}, ${spazio.provincia}</p>
            <p class="services">📍 ${indirizzo}</p>
            <p class="services">🧭 Categoria: ${spazio.categoria}</p>
            <div class="workspace-footer">
              <div class="price">Italia</div>
              <button class="btn-book" onclick="vaiAScheda('${spazio.id_spazio}')">Dettagli</button>
            </div>
          </div>
        </div>
      `;
    }
    
  }).join('');
}

window.filtraSpazi = () => {
  const citta = document.getElementById('filtroCitta')?.value.toLowerCase() || '';
  const tipo = document.getElementById('filtroTipo')?.value.toLowerCase() || '';

  const filtrati = spazi.filter(s =>
    (!citta || citta.includes(s.Città.toLowerCase())) &&
    (!tipo || s.categoria?.toLowerCase() === tipo)
  );

  mostraSpazi(filtrati);
  inizializzaMappa(filtrati);
};

window.prenotaSpazio = (idSpazio) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    alert("Effettua il login per prenotare.");
    return;
  }
  alert(`Prenotazione avviata per: ${idSpazio}`);
};

function inizializzaMappa(spazi) {
  if (map) map.remove();

  map = L.map('mappa').setView([45.5, 9.2], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  spazi.forEach(spazio => {
    const lat = parseFloat(spazio.latitudine);
    const lon = parseFloat(spazio.longitudine);
    if (!lat || !lon) return;

    const marker = L.marker([lat, lon]).addTo(map);
    marker.bindPopup(`<strong>${spazio.id_spazio}</strong><br>${spazio.Città}`);
    markers.push(marker);
  });
}

window.caricaSpazi = caricaSpazi;
window.mostraSpazi = mostraSpazi;



// Funzione per aggiungere un marker alla mappa
// Utilizza Nominatim per ottenere le coordinate da un indirizzo
function aggiungiMarker(indirizzo) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(indirizzo)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        L.marker([lat, lon])
          .addTo(map)
          .bindPopup(indirizzo);
      }
    })
    .catch(err => console.error("Errore nel geocoding:", err));
}

const input = document.getElementById("filtroCitta");
const suggerimenti = document.getElementById("suggerimenti");

let timeout = null;

input.addEventListener("input", () => {
  clearTimeout(timeout);
  const query = input.value.trim();

  if (query.length < 2) {
    suggerimenti.style.display = "none";
    return;
  }

  timeout = setTimeout(() => {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`)
      .then(res => res.json())
      .then(data => {
        suggerimenti.innerHTML = "";
        data.forEach(place => {
          const item = document.createElement("div");
          item.className = "suggestion-item";
          item.innerHTML = `
            <div class="text">
              <span class="title">${place.display_name.split(",")[0]}, </span>
              <span class="subtitle">${place.address.city || place.address.town || place.address.village || ""}, </span>
              <span class="subtitle">${place.address.country || ""}</span>
            </div>
          `;
          item.addEventListener("click", () => {
            input.value = `${place.display_name.split(",")[0]}, ${place.address.city || place.address.town || place.address.village || ""}, ${place.address.country || ""}`;
            suggerimenti.style.display = "none";
          });
          suggerimenti.appendChild(item);
        });
        suggerimenti.style.display = "block";
      });
  }, 300);
});

window.vaiAScheda = (idSpazio) => {
  // Reindirizza alla pagina con parametro id
  window.location.href = `spazio.html?id=${encodeURIComponent(idSpazio)}`;
};

window.Seleziona = (idSpazio) => {
  // Reindirizza alla pagina di prenotazione con parametro id
  window.location.href = `gestione_prenotazioni.html?id=${encodeURIComponent(idSpazio)}`;
}
