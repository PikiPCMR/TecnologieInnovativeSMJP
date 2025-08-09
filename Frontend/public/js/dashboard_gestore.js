import { supabase } from './collegamentoDb.js';

const userId = localStorage.getItem('user');
const currentYear = new Date().getFullYear();
const startOfYear = `${currentYear}-01-01`;
const user = JSON.parse(localStorage.getItem('user'))?.id;

async function fetchDashboardData() {
    if (!userId) return;

    // 1. Ottieni tutti gli spazi del gestore loggato
    const { data: spazi, error: spaziError } = await supabase
        .from('spazi_lavoro')
        .select('id_spazio, categoria')
        .eq('id_gestore', user);

    if (spaziError) return console.error('Errore spazi:', spaziError);

    const spazioIds = spazi.map(s => s.id_spazio);
    console.log(spazioIds);

    // 2. Ottieni prenotazioni e relativi pagamenti YTD
    const { data: prenotazioni, error: prenotazioniError } = await supabase
        .from('prenotazione')
        .select('id_prenotazione, id_spazio')
        .in('id_spazio', spazioIds)
        .gte('giorno', startOfYear);

    if (prenotazioniError) return console.error('Errore prenotazioni:', prenotazioniError);

    const prenotazioneIds = prenotazioni.map(p => p.id_prenotazione);
    console.log(prenotazioneIds);

    const { data: pagamenti, error: pagamentiError } = await supabase
        .from('pagamenti')
        .select('id_prenotazione, importo')
        .in('id_prenotazione', prenotazioneIds);

    if (pagamentiError) return console.error('Errore pagamenti:', pagamentiError);

    // === GUADAGNI YTD PER SPAZIO ===
    const guadagniPerSpazio = {};
    prenotazioni.forEach(p => {
        const importo = pagamenti.find(pg => pg.id_prenotazione === p.id_prenotazione)?.importo || 0;
        guadagniPerSpazio[p.id_spazio] = (guadagniPerSpazio[p.id_spazio] || 0) + importo;
    });
    console.log(guadagniPerSpazio);

    // === CATEGORIE PIÙ VENDUTE ===
    const categoriaPerSpazio = Object.fromEntries(spazi.map(s => [s.id_spazio, s.categoria]));
    const categoriaCount = {};
    prenotazioni.forEach(p => {
        const cat = categoriaPerSpazio[p.id_spazio];
        if (cat) categoriaCount[cat] = (categoriaCount[cat] || 0) + 1;
    });
    console.log(categoriaPerSpazio);

    // === TOTALE PRENOTAZIONI ===
    const totalePrenotazioni = prenotazioni.length;
    console.log(totalePrenotazioni);

    // Mostra i grafici
    renderPieChart('chart-guadagni', guadagniPerSpazio, 'Guadagni per spazio');
    renderPieChart('chart-categorie', categoriaCount, 'Prenotazioni per categoria');
    document.getElementById('counter-prenotazioni').innerText = totalePrenotazioni;
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
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
});