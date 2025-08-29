/**
 * @file Gestisce la visualizzazione e la gestione delle prenotazioni dell'utente.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from '/js/collegamentoDb.js';

// Ottiene l'ID utente dal localStorage. Se non è presente, il codice non procede.
const userId = localStorage.getItem('user');
const user = JSON.parse(localStorage.getItem('user'))?.id;

/**
 * Reindirizza l'utente alla dashboard del gestore.
 * Viene esportata per essere accessibile globalmente.
 */
export function openDashboardGestore() {
    window.location.href = "/html/contenuti_gestore/internal_dashboard.html";
}
window.openDashboardGestore = openDashboardGestore;

/**
 * Funzione principale per recuperare e visualizzare i dati della dashboard interna.
 * Recupera i dati Anno-to-Date (YTD) su spazi, prenotazioni e pagamenti.
 */
async function fetchInternalDashboardData() {
    if (!userId) return; // Esci se l'utente non è autenticato.

    // Calcola l'inizio dell'anno corrente per filtrare i dati YTD.
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

    // === Ordine dei mesi per i grafici ===
    const ordineMesi = ["Gen", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    /**
     * Ordina un oggetto in base all'ordine dei mesi predefinito.
     * @param {object} obj - L'oggetto da ordinare.
     * @returns {object} L'oggetto ordinato.
     */
    function sortByMonth(obj) {
        return Object.fromEntries(
            Object.entries(obj).sort((a, b) => ordineMesi.indexOf(a[0]) - ordineMesi.indexOf(b[0]))
        );
    }

    // === 1. Recupero degli spazi del gestore loggato ===
    const { data: spazi, error: spaziError } = await supabase
        .from('spazi_lavoro')
        .select('id_spazio, categoria, id_gestore')
        .eq('id_gestore', user);

    if (spaziError) return console.error('Errore spazi:', spaziError);
    
    const spazioIds = spazi.map(s => s.id_spazio);
    if (spazioIds.length === 0) return console.log('Nessuno spazio trovato per il gestore');

    // === 2. Recupero delle prenotazioni YTD per gli spazi del gestore ===
    const { data: prenotazioni, error: prenotazioniError } = await supabase
        .from('prenotazione')
        .select('*')
        .in('id_spazio', spazioIds)
        .gte('giorno', startOfYear);

    if (prenotazioniError) return console.error('Errore prenotazioni:', prenotazioniError);
    
    const prenotazioneIds = prenotazioni.map(p => p.id_prenotazione);
    console.log('Prenotazioni trovate:', prenotazioni.length);

    // === 3. Recupero dei pagamenti YTD relativi alle prenotazioni trovate ===
    const { data: pagamenti, error: pagamentiError } = await supabase
        .from('pagamenti')
        .select('*')
        .in('id_prenotazione', prenotazioneIds);

    if (pagamentiError) return console.error('Errore pagamenti:', pagamentiError);
    console.log('Pagamenti trovati:', pagamenti.length);

    // === 4. Creazione dinamica della tabella delle prenotazioni e pagamenti ===
    const tabella = document.getElementById('tabella-prenotazioni');
    tabella.innerHTML = `
    <thead>
        <tr>
            <th>ID Prenotazione</th>
            <th>Spazio</th>
            <th>Giorno</th>
            <th>Fascia Oraria</th>
            <th>ID Stripe</th>
            <th>Importo</th>
        </tr>
    </thead>
    <tbody></tbody>
`;
    const tbody = tabella.querySelector('tbody');
    prenotazioni.forEach(p => {
        // Trova il pagamento corrispondente alla prenotazione
        const pagamento = pagamenti.find(pg => pg.id_prenotazione === p.id_prenotazione) || {};
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${p.id_prenotazione}</td>
        <td>${p.id_spazio}</td>
        <td>${p.giorno}</td>
        <td>${p.fascia_oraria}</td>
        <td>${pagamento.id_pagamento || ''}</td>
        <td>${pagamento.importo ? pagamento.importo.toFixed(2) + ' €' : ''}</td>
    `;
        tbody.appendChild(row);
    });

    // === 5. Funzione helper per raggruppare i dati per mese ===
    /**
     * Raggruppa i dati in base al mese.
     * @param {Array} data - L'array di dati (es. prenotazioni, pagamenti).
     * @param {string} key - La chiave per sommare i valori (se `sum` è true).
     * @param {boolean} sum - Se sommare i valori (`true`) o contare gli elementi (`false`).
     * @returns {object} Un oggetto con i mesi come chiavi e i valori aggregati.
     */
    function groupByMonth(data, key, sum = false) {
        const result = {};
        data.forEach(item => {
            const month = new Date(item.giorno).toLocaleString('default', { month: 'short' });
            if (!result[month]) result[month] = 0;
            result[month] += sum ? (item[key] || 0) : 1;
        });
        return result;
    }

    // === 6. Grafico a barre delle prenotazioni mensili ===
    const prenotazioniMensili = sortByMonth(groupByMonth(prenotazioni, null, false));
    renderBarChart('chart-grafico-prenotazioni-barre', prenotazioniMensili, 'Prenotazioni per mese');
    console.log('Prenotazioni mensili:', prenotazioniMensili);

    // === 7. Grafico a barre dei guadagni mensili ===
    // Associa i dati di pagamento alle loro date di prenotazione.
    const pagamentiConData = pagamenti.map(pg => {
        const pren = prenotazioni.find(p => p.id_prenotazione === pg.id_prenotazione);
        return { ...pg, giorno: pren?.giorno };
    });
    const guadagniMensili = sortByMonth(groupByMonth(pagamentiConData, 'importo', true));
    renderBarChart('chart-grafico-economico-barre', guadagniMensili, 'Guadagni per mese');
    console.log('Guadagni mensili:', guadagniMensili);

    // === 8. Grafico a linee: Prenotazioni per fascia oraria raggruppate per mese ===
    const fasceOrarieMensili = {};
    prenotazioni.forEach(p => {
        const month = new Date(p.giorno).toLocaleString('default', { month: 'short' });
        if (!fasceOrarieMensili[month]) fasceOrarieMensili[month] = {};
        if (!fasceOrarieMensili[month][p.fascia_oraria]) fasceOrarieMensili[month][p.fascia_oraria] = 0;
        fasceOrarieMensili[month][p.fascia_oraria]++;
    });
    renderLineChart('chart-fasce-prenotate', sortByMonth(fasceOrarieMensili), 'Prenotazioni per fascia oraria');
    console.log('Prenotazioni per fascia oraria:', fasceOrarieMensili);

    // === 9. Grafico a linee: Prenotazioni per categoria raggruppate per mese ===
    const categoriaPerSpazio = Object.fromEntries(spazi.map(s => [s.id_spazio, s.categoria]));
    const categorieMensili = {};
    prenotazioni.forEach(p => {
        const month = new Date(p.giorno).toLocaleString('default', { month: 'short' });
        const cat = categoriaPerSpazio[p.id_spazio];
        if (!categorieMensili[month]) categorieMensili[month] = {};
        if (!categorieMensili[month][cat]) categorieMensili[month][cat] = 0;
        categorieMensili[month][cat]++;
    });
    renderLineChart('chart-tipi-spazi-prenotati', sortByMonth(categorieMensili), 'Prenotazioni per categoria');
    console.log('Prenotazioni per categoria:', categorieMensili);

    // === 10. Grafico a linee: Andamento economico cumulato YTD ===
    const mesiOrdine = Object.keys(guadagniMensili);
    let cumulato = 0;
    const guadagniCumulati = {};
    mesiOrdine.forEach(m => {
        cumulato += guadagniMensili[m];
        guadagniCumulati[m] = cumulato;
    });
    renderLineChartSimple('chart-andamento-economico', sortByMonth(guadagniCumulati), 'Andamento Economico YTD');
    console.log('Andamento economico cumulato:', guadagniCumulati);
}

// === Funzioni per il rendering dei grafici (separate per chiarezza) ===
const colorPalette = [
    '#FF6384', // rosso-rosa
    '#36A2EB', // blu
    '#FFCE56', // giallo
    '#4BC0C0', // turchese
    '#9966FF', // viola
    '#FF9F40', // arancione
    '#E7E9ED', // grigio chiaro
    '#8AFF33'  // verde lime
];

/**
 * Renderizza un grafico a barre.
 * @param {string} canvasId - ID del canvas.
 * @param {object} data - Dati in formato chiave-valore.
 * @param {string} title - Titolo del grafico.
 */
function renderBarChart(canvasId, data, title) {
    new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: title,
                data: Object.values(data),
                backgroundColor: colorPalette[1] // usa il blu fisso
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

/**
 * Renderizza un grafico a linee con più dataset (per categorie).
 * @param {string} canvasId - ID del canvas.
 * @param {object} groupedData - Dati raggruppati {mese: {categoria: valore}}.
 * @param {string} title - Titolo del grafico.
 */
function renderLineChart(canvasId, groupedData, title) {
    const labels = Object.keys(groupedData);
    const datasets = [];
    // Crea un set unico di tutte le categorie presenti nei dati.
    const categories = Array.from(new Set(labels.flatMap(m => Object.keys(groupedData[m]))));

    categories.forEach((cat, i) => {
        datasets.push({
            label: cat,
            data: labels.map(m => groupedData[m][cat] || 0), // Associa i dati a ogni mese
            borderColor: colorPalette[i % colorPalette.length],
            backgroundColor: colorPalette[i % colorPalette.length],
            fill: false,
            tension: 0.3
        });
    });

    new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: title },
                legend: { position: 'top' }
            }
        }
    });
}

/**
 * Renderizza un semplice grafico a linee con un solo dataset.
 * @param {string} canvasId - ID del canvas.
 * @param {object} data - Dati in formato chiave-valore.
 * @param {string} title - Titolo del grafico.
 */
function renderLineChartSimple(canvasId, data, title) {
    new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: title,
                data: Object.values(data),
                borderColor: colorPalette[0], // rosso
                backgroundColor: colorPalette[0],
                fill: false,
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });
}

/**
 * Funzione per recuperare e visualizzare i dati totali ("All Time").
 */
async function fetchAllTimeData() {
    if (!userId) return; // Esci se l'utente non è autenticato.

    // === 1. Prende tutti gli spazi del gestore ===
    const { data: spazi, error: spaziError } = await supabase
        .from('spazi_lavoro')
        .select('id_spazio')
        .eq('id_gestore', user);

    if (spaziError) {
        console.error('Errore spazi:', spaziError);
        return;
    }

    const spazioIds = spazi.map(s => s.id_spazio);
    if (spazioIds.length === 0) {
        // Imposta i contatori a zero se non ci sono spazi
        console.log('Nessuno spazio trovato per il gestore');
        document.getElementById('counter-guadagni-alltime').textContent = '0 €';
        document.getElementById('counter-prenotazioni-alltime').textContent = '0';
        return;
    }

    // === 2. Prende tutte le prenotazioni relative agli spazi (All Time) ===
    const { data: prenotazioni, error: prenotazioniError } = await supabase
        .from('prenotazione')
        .select('id_prenotazione')
        .in('id_spazio', spazioIds);

    if (prenotazioniError) {
        console.error('Errore prenotazioni:', prenotazioniError);
        return;
    }

    // Aggiorna il contatore delle prenotazioni totali
    document.getElementById('counter-prenotazioni-alltime').textContent = prenotazioni.length;

    if (prenotazioni.length === 0) {
        // Imposta il contatore dei guadagni a zero se non ci sono prenotazioni
        document.getElementById('counter-guadagni-alltime').textContent = '0 €';
        return;
    }

    const prenotazioneIds = prenotazioni.map(p => p.id_prenotazione);

    // === 3. Prende tutti i pagamenti relativi alle prenotazioni (All Time) ===
    const { data: pagamenti, error: pagamentiError } = await supabase
        .from('pagamenti')
        .select('importo')
        .in('id_prenotazione', prenotazioneIds);

    if (pagamentiError) {
        console.error('Errore pagamenti:', pagamentiError);
        return;
    }

    // Somma tutti gli importi pagati per ottenere il guadagno totale
    const totaleGuadagni = pagamenti.reduce((acc, pg) => acc + (pg.importo || 0), 0);

    // Aggiorna il contatore dei guadagni (formattato con 2 decimali e €)
    document.getElementById('counter-guadagni-alltime').textContent = totaleGuadagni.toFixed(2) + ' €';
}

// Avvia il recupero dei dati quando il DOM è completamente caricato
window.addEventListener('DOMContentLoaded', fetchInternalDashboardData);
window.addEventListener('DOMContentLoaded', fetchAllTimeData);