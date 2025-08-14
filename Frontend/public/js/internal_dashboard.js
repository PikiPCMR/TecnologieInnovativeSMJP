import { supabase } from './collegamentoDb.js';

const userId = localStorage.getItem('user');
const user = JSON.parse(localStorage.getItem('user'))?.id;

export function openDashboardGestore() {
    window.location.href = "../html/internal_dashboard.html";
}
window.openDashboardGestore = openDashboardGestore;

async function fetchInternalDashboardData() {
    if (!userId) return;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

    // === Ordine mesi ===
    const ordineMesi = ["Gen", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function sortByMonth(obj) {
        return Object.fromEntries(
            Object.entries(obj).sort((a, b) => ordineMesi.indexOf(a[0]) - ordineMesi.indexOf(b[0]))
        );
    }

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
        const pagamento = pagamenti.find(pg => pg.id_prenotazione === p.id_prenotazione) || {};
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${p.id_prenotazione}</td>
        <td>${p.id_spazio}</td>
        <td>${p.giorno}</td>
        <td>${p.fascia_oraria}</td>
        <td>${pagamento.id_stripe || ''}</td>
        <td>${pagamento.importo ? pagamento.importo.toFixed(2) + ' €' : ''}</td>
    `;
        tbody.appendChild(row);
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
    const prenotazioniMensili = sortByMonth(groupByMonth(prenotazioni, null, false));
    renderBarChart('chart-grafico-prenotazioni-barre', prenotazioniMensili, 'Prenotazioni per mese');
    console.log('Prenotazioni mensili:', prenotazioniMensili);

    // === 7. Grafico guadagni mensili ===
    const pagamentiConData = pagamenti.map(pg => {
        const pren = prenotazioni.find(p => p.id_prenotazione === pg.id_prenotazione);
        return { ...pg, giorno: pren?.giorno };
    });
    const guadagniMensili = sortByMonth(groupByMonth(pagamentiConData, 'importo', true));
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
    renderLineChart('chart-fasce-prenotate', sortByMonth(fasceOrarieMensili), 'Prenotazioni per fascia oraria');
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
    renderLineChart('chart-tipi-spazi-prenotati', sortByMonth(categorieMensili), 'Prenotazioni per categoria');
    console.log('Prenotazioni per categoria:', categorieMensili);

    // === 10. Line chart: Andamento economico cumulato ===
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

// === Funzioni grafici ===
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

function renderLineChart(canvasId, groupedData, title) {
    const labels = Object.keys(groupedData);
    const datasets = [];
    const categories = Array.from(new Set(labels.flatMap(m => Object.keys(groupedData[m]))));

    categories.forEach((cat, i) => {
        datasets.push({
            label: cat,
            data: labels.map(m => groupedData[m][cat] || 0),
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

async function fetchAllTimeData() {
    if (!userId) return;

    // === 1. Prendo gli spazi del gestore ===
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
        console.log('Nessuno spazio trovato per il gestore');
        document.getElementById('counter-guadagni-alltime').textContent = '0 €';
        document.getElementById('counter-prenotazioni-alltime').textContent = '0';
        return;
    }

    // === 2. Prendo tutte le prenotazioni per quegli spazi (all time) ===
    const { data: prenotazioni, error: prenotazioniError } = await supabase
        .from('prenotazione')
        .select('id_prenotazione')
        .in('id_spazio', spazioIds);

    if (prenotazioniError) {
        console.error('Errore prenotazioni:', prenotazioniError);
        return;
    }

    // Aggiorno contatore prenotazioni
    document.getElementById('counter-prenotazioni-alltime').textContent = prenotazioni.length;

    if (prenotazioni.length === 0) {
        document.getElementById('counter-guadagni-alltime').textContent = '0 €';
        return;
    }

    const prenotazioneIds = prenotazioni.map(p => p.id_prenotazione);

    // === 3. Prendo tutti i pagamenti relativi alle prenotazioni ===
    const { data: pagamenti, error: pagamentiError } = await supabase
        .from('pagamenti')
        .select('importo')
        .in('id_prenotazione', prenotazioneIds);

    if (pagamentiError) {
        console.error('Errore pagamenti:', pagamentiError);
        return;
    }

    // Sommo tutti gli importi pagati
    const totaleGuadagni = pagamenti.reduce((acc, pg) => acc + (pg.importo || 0), 0);

    // Aggiorno contatore guadagni (formattato con 2 decimali e €)
    document.getElementById('counter-guadagni-alltime').textContent = totaleGuadagni.toFixed(2) + ' €';
}


window.addEventListener('DOMContentLoaded', fetchInternalDashboardData);
window.addEventListener('DOMContentLoaded', fetchAllTimeData);