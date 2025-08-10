import { supabase } from './collegamentoDb.js';

const userId = localStorage.getItem('user');
const currentYear = new Date().getFullYear();
const startOfYear = `${currentYear}-01-01`;
const user = JSON.parse(localStorage.getItem('user'))?.id;

function openDashboardGestore() {
    window.location.href = "../html/internal_dashboard.html";
}
window.openDashboardGestore = openDashboardGestore;

async function fetchInternalDashboardData() {
    if (!userId) return;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

    // === 1. Spazi del gestore loggato ===
    const { data: spazi, error: spaziError } = await supabase
        .from('spazi_lavoro')
        .select('id_spazio, categoria, id_gestore')
        .eq('id_gestore', user);

    if (spaziError) return console.error('Errore spazi:', spaziError);
    const spazioIds = spazi.map(s => s.id_spazio);
    if (spazioIds.length === 0) return console.log('Nessuno spazio trovato per il gestore');

    // === 2. Prenotazioni YTD ===
    const { data: prenotazioni, error: prenotazioniError } = await supabase
        .from('prenotazione')
        .select('*')
        .in('id_spazio', spazioIds)
        .gte('giorno', startOfYear);

    if (prenotazioniError) return console.error('Errore prenotazioni:', prenotazioniError);
    const prenotazioneIds = prenotazioni.map(p => p.id_prenotazione);
    console.log('Prenotazioni trovate:', prenotazioni.length);

    // === 3. Pagamenti YTD ===
    const { data: pagamenti, error: pagamentiError } = await supabase
        .from('pagamenti')
        .select('*')
        .in('id_prenotazione', prenotazioneIds);

    if (pagamentiError) return console.error('Errore pagamenti:', pagamentiError);
    console.log('Pagamenti trovati:', pagamenti.length);

    // === 4. Tabella prenotazioni+pagamenti ===
    const tabella = document.getElementById('tabella-prenotazioni');
    tabella.innerHTML = `
        <tr>
            <th>ID Prenotazione</th>
            <th>Spazio</th>
            <th>Giorno</th>
            <th>Fascia Oraria</th>
            <th>ID Stripe</th>
            <th>Importo</th>
        </tr>
    `;
    prenotazioni.forEach(p => {
        const pagamento = pagamenti.find(pg => pg.id_prenotazione === p.id_prenotazione) || {};
        tabella.innerHTML += `
            <tr>
                <td>${p.id_prenotazione}</td>
                <td>${p.id_spazio}</td>
                <td>${p.giorno}</td>
                <td>${p.fascia_oraria}</td>
                <td>${pagamento.id_stripe || ''}</td>
                <td>${pagamento.importo ? pagamento.importo.toFixed(2) + ' €' : ''}</td>
            </tr>
        `;
    });

    // === 5. Raggruppamento helper ===
    function groupByMonth(data, key, sum = false) {
        const result = {};
        data.forEach(item => {
            const month = new Date(item.giorno).toLocaleString('default', { month: 'short' });
            if (!result[month]) result[month] = 0;
            result[month] += sum ? (item[key] || 0) : 1;
        });
        return result;
    }

    // === 6. Grafico prenotazioni mensili ===
    const prenotazioniMensili = groupByMonth(prenotazioni, null, false);
    renderBarChart('chart-grafico-prenotazioni-barre', prenotazioniMensili, 'Prenotazioni per mese');
    console.log('Prenotazioni mensili:', prenotazioniMensili);

    // === 7. Grafico guadagni mensili ===
    const pagamentiConData = pagamenti.map(pg => {
        const pren = prenotazioni.find(p => p.id_prenotazione === pg.id_prenotazione);
        return { ...pg, giorno: pren?.giorno };
    });
    const guadagniMensili = groupByMonth(pagamentiConData, 'importo', true);
    renderBarChart('chart-grafico-economico-barre', guadagniMensili, 'Guadagni per mese');
    console.log('Guadagni mensili:', guadagniMensili);

    // === 8. Line chart: Prenotazioni per fascia oraria ===
    const fasceOrarieMensili = {};
    prenotazioni.forEach(p => {
        const month = new Date(p.giorno).toLocaleString('default', { month: 'short' });
        if (!fasceOrarieMensili[month]) fasceOrarieMensili[month] = {};
        if (!fasceOrarieMensili[month][p.fascia_oraria]) fasceOrarieMensili[month][p.fascia_oraria] = 0;
        fasceOrarieMensili[month][p.fascia_oraria]++;
    });
    renderLineChart('chart-fasce-prenotate', fasceOrarieMensili, 'Prenotazioni per fascia oraria');
    console.log('Prenotazioni per fascia oraria:', fasceOrarieMensili);

    // === 9. Line chart: Prenotazioni per categoria ===
    const categoriaPerSpazio = Object.fromEntries(spazi.map(s => [s.id_spazio, s.categoria]));
    const categorieMensili = {};
    prenotazioni.forEach(p => {
        const month = new Date(p.giorno).toLocaleString('default', { month: 'short' });
        const cat = categoriaPerSpazio[p.id_spazio];
        if (!categorieMensili[month]) categorieMensili[month] = {};
        if (!categorieMensili[month][cat]) categorieMensili[month][cat] = 0;
        categorieMensili[month][cat]++;
    });
    renderLineChart('chart-tipi-spazi-prenotati', categorieMensili, 'Prenotazioni per categoria');
    console.log('Prenotazioni per categoria:', categorieMensili);

    // === 10. Line chart: Andamento economico cumulato ===
    const mesiOrdine = Object.keys(guadagniMensili);
    let cumulato = 0;
    const guadagniCumulati = {};
    mesiOrdine.forEach(m => {
        cumulato += guadagniMensili[m];
        guadagniCumulati[m] = cumulato;
    });
    renderLineChartSimple('chart-andamento-economico', guadagniCumulati, 'Andamento Economico YTD');
    console.log('Andamento economico cumulato:', guadagniCumulati);
}

// === Funzioni grafici ===
function renderBarChart(canvasId, data, title) {
    new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: title,
                data: Object.values(data),
                backgroundColor: '#36A2EB'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function renderLineChart(canvasId, groupedData, title) {
    const labels = Object.keys(groupedData);
    const datasets = [];
    const categories = new Set();
    labels.forEach(m => Object.keys(groupedData[m]).forEach(c => categories.add(c)));
    categories.forEach(cat => {
        datasets.push({
            label: cat,
            data: labels.map(m => groupedData[m][cat] || 0),
            borderColor: getRandomColor(),
            fill: false
        });
    });
    new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: { labels, datasets },
        options: { responsive: true, plugins: { title: { display: true, text: title } } }
    });
}

function renderLineChartSimple(canvasId, data, title) {
    new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: title,
                data: Object.values(data),
                borderColor: '#FF6384',
                fill: false
            }]
        },
        options: { responsive: true }
    });
}

function getRandomColor() {
    return `hsl(${Math.floor(Math.random()*360)}, 70%, 50%)`;
}

window.addEventListener('DOMContentLoaded', fetchInternalDashboardData);

