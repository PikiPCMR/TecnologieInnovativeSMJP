import { supabase } from '../collegamentoDb.js';
import {
  checkLogin,
  toggleProfileMenu,
  accedi,
  registrati,
  handleProfile,
  handleLogout
} from '../index.js';

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
    const indirizzo = `${spazio.indirizzo_spazio || ''}, ${spazio.Numero_Civico || ''}`;
    return `
      <div class="workspace-card">
        <img class="workspace-img" src="${immagine}" alt="${spazio.id_spazio}" />
        <div class="workspace-info">
          <h3>${spazio.id_spazio}</h3>
          <p class="location">${spazio.Città}, ${spazio.Provincia}</p>
          <p class="services">📍 ${indirizzo}</p>
          <p class="services">🧭 Categoria: ${spazio.categoria}</p>
          <div class="workspace-footer">
            <div class="price">Italia</div>
            <button class="btn-book" onclick="prenotaSpazio('${spazio.id_spazio}')">Prenota</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.filtraSpazi = () => {
  const citta = document.getElementById('filtroCitta')?.value.toLowerCase() || '';
  const tipo = document.getElementById('filtroTipo')?.value.toLowerCase() || '';

  const filtrati = spazi.filter(s =>
    (!citta || s.Città.toLowerCase().includes(citta)) &&
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



const cercaCoordinate = async (indirizzo) => {
  try {
    const response = await fetch(`http://localhost:3000/api/geocode?address=${encodeURIComponent(indirizzo)}`);
    const data = await response.json();

    if (response.ok) {
      console.log("Coordinate:", data.lat, data.lng);
      // Puoi usarle nel tuo stato o nella mappa, ecc.
    } else {
      console.error("Errore:", data.error || "Errore generico");
    }
  } catch (error) {
    console.error("Errore nella richiesta:", error);
  }
};


cercaCoordinate("Piazza del Duomo, Milano, Italia"); // Esempio di utilizzo