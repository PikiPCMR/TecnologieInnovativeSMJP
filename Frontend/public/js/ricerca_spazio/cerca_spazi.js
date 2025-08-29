/**
 * @file Gestisce la visualizzazione degli spazi di lavoro, la ricerca e il filtraggio,
 * e l'integrazione con una mappa interattiva (Leaflet).
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from '../collegamentoDb.js';
import {
    checkLogin,
    toggleProfileMenu,
    accedi,
    registrati,
    handleProfile,
    handleLogout
} from '../index.js';

const queryString = window.location.search;
const params = new URLSearchParams(queryString);
/** @type {boolean} editMode - Indica se la pagina è in modalità di modifica. */
let editMode = params.get('edit') === 'true';

// Esponi le funzioni globali
window.checkLogin = checkLogin;
window.toggleProfileMenu = toggleProfileMenu;
window.accedi = accedi;
window.registrati = registrati;
window.handleProfile = handleProfile;
window.handleLogout = handleLogout;

/** @type {Array<Object>} spazi - Array di oggetti che rappresentano gli spazi di lavoro. */
let spazi = [];
/** @type {Object} map - L'istanza della mappa Leaflet. */
let map;
/** @type {Array<Object>} markers - Array di marker Leaflet sulla mappa. */
let markers = [];

/**
 * Carica gli spazi di lavoro dal database e li visualizza.
 * @async
 */
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

/**
 * Mostra una lista di spazi di lavoro nel container HTML.
 * Il layout cambia in base alla modalità (modifica o visualizzazione).
 * @param {Array<Object>} lista - L'array di spazi di lavoro da visualizzare.
 */
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
        } else {
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

/**
 * Filtra gli spazi di lavoro in base a città e tipo, aggiornando la visualizzazione e la mappa.
 */
window.filtraSpazi = () => {
    const citta = document.getElementById('filtroCitta')?.value.toLowerCase() || '';
    const tipo = document.getElementById('filtroTipo')?.value.toLowerCase() || '';

    const filtrati = spazi.filter(s =>
        (!citta || s.città.toLowerCase().includes(citta)) &&
        (!tipo || s.categoria?.toLowerCase() === tipo)
    );

    mostraSpazi(filtrati);
    inizializzaMappa(filtrati);
};

/**
 * Avvia il processo di prenotazione per uno spazio di lavoro specifico.
 * Reindirizza l'utente se non è loggato.
 * @param {string} idSpazio - L'ID dello spazio da prenotare.
 */
window.prenotaSpazio = (idSpazio) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert("Effettua il login per prenotare.");
        return;
    }
    alert(`Prenotazione avviata per: ${idSpazio}`);
};

/**
 * Inizializza o aggiorna la mappa Leaflet con i marker degli spazi di lavoro.
 * @param {Array<Object>} spazi - L'array di spazi di lavoro da visualizzare sulla mappa.
 */
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

// Esponi le funzioni nel contesto globale per l'uso in HTML
window.caricaSpazi = caricaSpazi;
window.mostraSpazi = mostraSpazi;

/**
 * Aggiunge un marker alla mappa utilizzando un indirizzo per ottenere le coordinate.
 * @param {string} indirizzo - L'indirizzo da geocodificare.
 */
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

/** @type {number|null} timeout - Timeout per la ricerca dei suggerimenti di geocodifica. */
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

/**
 * Reindirizza l'utente alla pagina dei dettagli di uno specifico spazio di lavoro.
 * @param {string} idSpazio - L'ID dello spazio da visualizzare.
 */
window.vaiAScheda = (idSpazio) => {
    // Reindirizza alla pagina con parametro id
    window.location.href = `/html/ricerca_spazio/spazio.html?id=${encodeURIComponent(idSpazio)}`;
};

/**
 * Reindirizza l'utente alla pagina di gestione delle prenotazioni di uno spazio specifico.
 * Utilizzata nella modalità di modifica.
 * @param {string} idSpazio - L'ID dello spazio da selezionare.
 */
window.Seleziona = (idSpazio) => {
    // Reindirizza alla pagina di prenotazione con parametro id
    window.location.href = `/html/prenotazione/gestione_prenotazioni.html?id=${encodeURIComponent(idSpazio)}`;
};