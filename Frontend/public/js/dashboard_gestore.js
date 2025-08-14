import { supabase } from './collegamentoDb.js';

const userId = localStorage.getItem('user');
const user = JSON.parse(localStorage.getItem('user'))?.id;

async function fetchDashboardData() {
    if (!userId) return;

    // Calcolo inizio mese corrente (per filtrare prenotazioni)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    // 1. Ottieni tutti gli spazi del gestore loggato, con nome
    const { data: spazi, error: spaziError } = await supabase
        .from('spazi_lavoro')
        .select('id_spazio, categoria, id_gestore, categoria, indirizzo_spazio, numero_civico, città, prezzo_ora')
        .eq('id_gestore', user);

    if (spaziError) return console.error('Errore spazi:', spaziError);

    // --- Rendering dinamico degli spazi ---
    const container = document.getElementById('spazi-cards-container');
    container.innerHTML = '';
    spazi.forEach(spazio => {
        const card = document.createElement('div');
        card.className = 'action-card spazio-card';
        card.onclick = () => {
            window.location.href = `../html/contenuti_gestore/modifica_spazio.html?id_spazio=${spazio.id_spazio}`;
        };

        let emoji = '​💼​';
        if (spazio.categoria === 'sala riunioni') emoji = '📞​';
        else if (spazio.categoria === 'postazione coworking') emoji = '💻';

        card.innerHTML = `
            <div class="card-icon">${emoji}</div>
            <h3 class="card-title">${spazio.id_spazio}</h3>
            <p class="card-description">
                <strong>${spazio.categoria}</strong> in ${spazio.indirizzo_spazio} ${spazio.numero_civico}, ${spazio.città}, costo ${spazio.prezzo_ora}€ <br>
            </p>
        `;
        container.appendChild(card);
    });

    // Card per aggiunta spazio
    const aggiungiCard = document.createElement('div');
    aggiungiCard.className = 'action-card';
    aggiungiCard.id = 'aggiungi-spazio-card';
    aggiungiCard.innerHTML = `
        <div class="card-icon">➕</div>
        <h3 class="card-title">Aggiungi Spazio</h3>
        <p class="card-description">Crea un nuovo spazio di coworking e inseriscilo nella rete.</p>
    `;
    aggiungiCard.onclick = () => {
        window.location.href = '../html/contenuti_gestore/crea_nuovo_spazio.html';
    };
    container.appendChild(aggiungiCard);

    const spazioIds = spazi.map(s => s.id_spazio);
    if (spazioIds.length === 0) return console.log('Nessuno spazio trovato per il gestore');

    // 2. Ottieni prenotazioni del mese in corso
    const { data: prenotazioni, error: prenotazioniError } = await supabase
        .from('prenotazione')
        .select('id_prenotazione, id_spazio, fascia_oraria, giorno')
        .in('id_spazio', spazioIds)
        .gte('giorno', startOfMonth);

    if (prenotazioniError) return console.error('Errore prenotazioni:', prenotazioniError);

    if (prenotazioni.length === 0) {
        console.log('Nessuna prenotazione nel mese corrente');
        // Potresti pulire i grafici/contatori o mostrare messaggi qui
        return;
    }

    const prenotazioneIds = prenotazioni.map(p => p.id_prenotazione);

    // 3. Ottieni pagamenti relativi alle prenotazioni del mese
    const { data: pagamenti, error: pagamentiError } = await supabase
        .from('pagamenti')
        .select('id_prenotazione, importo')
        .in('id_prenotazione', prenotazioneIds);

    if (pagamentiError) return console.error('Errore pagamenti:', pagamentiError);

    // === GUADAGNI PER SPAZIO ===
    const guadagniPerSpazio = {};
    prenotazioni.forEach(p => {
        const importo = pagamenti.find(pg => pg.id_prenotazione === p.id_prenotazione)?.importo || 0;
        guadagniPerSpazio[p.id_spazio] = (guadagniPerSpazio[p.id_spazio] || 0) + importo;
    });

    // === TOTALE GUADAGNI ===
    const totaleGuadagni = pagamenti.reduce((acc, pg) => acc + (pg.importo || 0), 0);
    console.log('Totale guadagni:', totaleGuadagni);

    // === CONTO PRENOTAZIONI PER CATEGORIA ===
    const categoriaPerSpazio = Object.fromEntries(spazi.map(s => [s.id_spazio, s.categoria]));
    const categoriaCount = {};
    prenotazioni.forEach(p => {
        const cat = categoriaPerSpazio[p.id_spazio];
        if (cat) categoriaCount[cat] = (categoriaCount[cat] || 0) + 1;
    });

    // === FASCE ORARIE PIÙ PRENOTATE ===
    const fasciaOrariaCount = {};
    prenotazioni.forEach(p => {
        const fascia = p.fascia_oraria;
        if (fascia) fasciaOrariaCount[fascia] = (fasciaOrariaCount[fascia] || 0) + 1;
    });

    // === SPAZIO PIÙ PRENOTATO ===
    const prenotazioniPerSpazio = {};
    prenotazioni.forEach(p => {
        prenotazioniPerSpazio[p.id_spazio] = (prenotazioniPerSpazio[p.id_spazio] || 0) + 1;
    });

    // Trova id_spazio con più prenotazioni
    let maxPrenotazioni = 0;
    let idSpazioPiuPrenotato = null;
    for (const [id, count] of Object.entries(prenotazioniPerSpazio)) {
        if (count > maxPrenotazioni) {
            maxPrenotazioni = count;
            idSpazioPiuPrenotato = id;
        }
    }

    // Trova nome dello spazio più prenotato
    const spazioPiuPrenotatoNome = spazi.find(s => s.id_spazio === idSpazioPiuPrenotato)?.id_spazio || 'N/A';
    console.log('Spazio più prenotato:', spazioPiuPrenotatoNome);

    // === TOTALE PRENOTAZIONI ===
    const totalePrenotazioni = prenotazioni.length;
    console.log('Totale prenotazioni:', totalePrenotazioni);

    // --- Rendering grafici e contatori ---
    renderPieChart('chart-guadagni', guadagniPerSpazio, 'Guadagni per spazio');
    renderPieChart('chart-categorie', categoriaCount, 'Prenotazioni per categoria');
    renderPieChart('chart-fasce-orarie', fasciaOrariaCount, 'Prenotazioni per fascia oraria');

    document.getElementById('counter-prenotazioni').innerText = totalePrenotazioni;
    document.getElementById('counter-guadagni').innerText = totaleGuadagni.toFixed(2) + ' €';
    document.getElementById('counter-spazio-piu-prenotato').innerText = spazioPiuPrenotatoNome;
}

// Funzione per creare i grafici a torta
function renderPieChart(canvasId, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ],
                borderWidth: "0.5"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: 'white'
                },
                legend: {
                    labels: {
                        color: 'white'
                    },
                    position: 'bottom',
                }
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});