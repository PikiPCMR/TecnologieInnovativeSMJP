/**
 * @file Gestisce la visualizzazione e la modifica del profilo utente (cliente o gestore),
 * inclusa la gestione delle prenotazioni, dei dati personali e delle opzioni di sicurezza.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

// CONFIGURAZIONE SUPABASE
import { supabase } from '/js/collegamentoDb.js';
console.log('Supabase client:', supabase);


console.log("USER:", JSON.parse(localStorage.getItem('user')));

document.addEventListener("DOMContentLoaded", () => {
    caricaDatiCliente();
    navigate('prenotazioni');
    // Mostra popup finale solo se richiesto da localStorage
    const popupFlag = localStorage.getItem("mostraPopupDecisione");
    if (popupFlag === "true") {
        localStorage.removeItem("mostraPopupDecisione"); // usalo solo una volta
        mostraPopupDecisione(JSON.parse(localStorage.getItem("user")));
    }
});

// === CARICA PROFILO ===
/**
 * Carica e visualizza i dati del profilo utente sulla pagina.
 * Recupera le informazioni dall'oggetto 'user' nel localStorage.
 */
export function caricaDatiCliente() {

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) {
        console.warn('⚠️ Nessun utente loggato, esco dalla funzione.');
        return;
    }

    const avatarSrc = user.avatarUrl || 'https://sbxrdptjegjxqaklfpxq.supabase.co/storage/v1/object/public/immaginiprofilo//user1.png';
    document.getElementById('avatar').src = avatarSrc;
    document.getElementById('avatar').addEventListener('click', () => apriPopup(avatarSrc));

    const saluto = document.getElementById("salutoUtente");
    if (user.nome === null || user.nome === '') {
        saluto.textContent = `Ciao, ${user.id}`;
    } else {
        saluto.textContent = `Ciao, ${user.nome}`;
    }

    if (user.tipo_utente === "gestore") {
        const media = user.rating || 'N/A';
        const count = user.reviewsCount || 0;
        document.getElementById("mediaRecensioni").textContent = `⭐ ${media} (${count} recensioni)`;
    } else {
        document.getElementById("mediaRecensioni").style.display = "none";
    }
}
window.caricaDatiCliente = caricaDatiCliente;

// === LOGO WORKSPACE PRO DINAMICO ===
document.addEventListener("DOMContentLoaded", () => {
    const logoLink = document.querySelector('.logo-link');
    const user = JSON.parse(localStorage.getItem('user'));
    logoLink.href = user?.tipo_utente === 'gestore' ? '/html/dashboard_gestore.html' : '/html/index.html';
});

/**
 * Genera e scarica un file CSV con i dati delle prenotazioni.
 * @param {Array<Object>} prenotazioni - L'array di oggetti contenente i dati delle prenotazioni.
 * @param {string} tipoUtente - Il tipo di utente ("gestore" o "cliente") per determinare le intestazioni del CSV.
 */
function scaricaCSV(prenotazioni, tipoUtente) {
    let intestazioni = tipoUtente === "gestore"
        ? ["ID Prenotazione", "Utente", "Spazio", "Giorno", "Orario"]
        : ["ID Prenotazione", "Spazio", "Giorno", "Orario"];

    let righe = prenotazioni.map(p => 
        tipoUtente === "gestore"
            ? [p.id_prenotazione, p.id_utente, p.id_spazio, p.giorno, p.fascia_oraria]
            : [p.id_prenotazione, p.id_spazio, p.giorno, p.fascia_oraria]
    );

    // Unisco intestazioni e righe
    let csvContent = [intestazioni, ...righe]
        .map(r => r.join(","))
        .join("\n");

    // Creazione blob CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Download automatico
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "prenotazioni.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// === NAVIGAZIONE SEZIONI ===
/**
 * Naviga tra le diverse sezioni del profilo utente (prenotazioni, dati generali, sicurezza).
 * Carica i contenuti dinamici in base alla sezione selezionata.
 * @async
 * @param {string} sezione - Il nome della sezione da visualizzare ('prenotazioni', 'generali', 'sicurezza').
 */
export async function navigate(sezione) {
    const cont = document.getElementById('section-content');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) return;

    switch (sezione) {
        case 'prenotazioni':
            cont.innerHTML = `
                <h2>PRENOTAZIONI</h2>
                <button id="downloadCSV" display:none;">📥 Scarica CSV</button>
                <ul id="prenotazioniList">Caricamento...</ul>
            `;

            const list = document.getElementById('prenotazioniList');
            const btnCSV = document.getElementById('downloadCSV');

            // Data di oggi in formato YYYY-MM-DD
            const oggi = new Date().toISOString().split("T")[0];

            let prenotazioni = [];
            let error = null;

            if (user.tipo_utente === 'gestore') {
                // Recupero prenotazioni future per gestore
                ({ data: prenotazioni, error } = await supabase
                    .from('prenotazione')
                    .select(`
                        id_prenotazione,
                        id_utente,
                        id_spazio,
                        giorno,
                        fascia_oraria,
                        spazi_lavoro!inner (
                            id_spazio,
                            id_gestore
                        )
                    `)
                    .eq('spazi_lavoro.id_gestore', user.id)
                    .gte('giorno', oggi)  // <-- filtro prenotazioni future
                );

                list.innerHTML = (error || !prenotazioni?.length)
                    ? '<li>Nessuna prenotazione trovata.</li>'
                    : prenotazioni.map(p => `
                        <li>
                            <strong>Utente:</strong> ${p.id_utente} <br>
                            <strong>Spazio:</strong> ${p.id_spazio} <br>
                            <strong>Giorno:</strong> ${p.giorno} <br>
                            <strong>Orario:</strong> ${p.fascia_oraria}
                        </li>
                    `).join('');

            } else {
                // Caso utente normale → mostra solo le sue prenotazioni future
                ({ data: prenotazioni, error } = await supabase
                    .from('prenotazione')
                    .select('*')
                    .eq('id_utente', user.id)
                    .gte('giorno', oggi)  // <-- filtro prenotazioni future
                );

                list.innerHTML = (error || !prenotazioni?.length)
                    ? '<li>Nessuna prenotazione trovata.</li>'
                    : prenotazioni.map(p => `
                        <li>
                            <strong>Spazio:</strong> ${p.id_spazio} <br>
                            <strong>Giorno:</strong> ${p.giorno} <br>
                            <strong>Orario:</strong> ${p.fascia_oraria}
                        </li>
                    `).join('');
            }

            // Se ci sono prenotazioni, mostro il pulsante CSV
            if (prenotazioni?.length) {
                btnCSV.style.display = "inline-block";
                btnCSV.addEventListener("click", () => scaricaCSV(prenotazioni, user.tipo_utente));
            }

            break;


        case 'generali':
            cont.innerHTML = `
                <h2>DATI GENERALI</h2>
                <div class="dati-box">
                    <div class="dato"><strong>Username:</strong> ${user.id}</div>
                    <div class="dato"><strong>Nome:</strong> ${user.nome}</div>
                    <div class="dato"><strong>Cognome:</strong> ${user.cognome}</div>
                    <div class="dato"><strong>Indirizzo:</strong> ${user.indirizzo}</div>
                    <div class="dato"><strong>Telefono:</strong> ${user.numero_telefono || 'Non fornito'}</div>
                </div>
                <button class="btn-edit" style="margin-top: 20px;" onclick="modificaDatiGenerali()">Modifica Dati</button>
            `;
            break;

        case 'sicurezza':
            cont.innerHTML = `
                <h2>ACCESSO & SICUREZZA</h2>
                <div class="dati-box">
                    <div class="dato"><strong>Email:</strong> ${user.email}
                        <button class="btn-edit" style="margin-left: 10px;" onclick="apriPopupEmail()">Modifica</button>
                    </div>
                    <div class="dato">
                        <button class="btn-edit" onclick="apriPopupPassword()">Cambia password</button>
                    </div>
                    <div class="dato">
                        <button class="btn-edit" onclick="apriPopupResetPassword()">Reset Password</button>
                    </div>
                </div>
            `;
            break;

        default:
            cont.innerHTML = `<p>Sezione "${sezione}" non trovata.</p>`;
    }
}
window.navigate = navigate;

// va in modifica_dati.js
/**
 * Crea un elemento di input HTML per un modulo di modifica dati.
 * @param {string} name - L'attributo 'name' e 'id' dell'input.
 * @param {string} label - L'etichetta visualizzata per l'input.
 * @param {string} [value=''] - Il valore predefinito dell'input.
 * @param {string} [type='text'] - Il tipo di input (es. 'text', 'password').
 * @returns {string} La stringa HTML dell'elemento di input.
 */
function createInput(name, label, value = '', type = 'text') {
    return `
        <div class="form-group">
            <label for="${name}">${label}</label>
            <input type="${type}" id="${name}" name="${name}" value="${value}" />
        </div>
    `;
}
// === MODIFICA DATI GENERALI ===
/**
 * Reindirizza l'interfaccia utente al modulo di modifica dei dati generali.
 * Prepopola i campi del modulo con i dati dell'utente dal localStorage.
 * Gestisce l'invio del modulo, aggiornando il database e il localStorage.
 * @async
 */
export function modificaDatiGenerali() {
    const user = JSON.parse(localStorage.getItem('user'));
    const cont = document.getElementById('section-content');

    cont.innerHTML = `
        <h2>Modifica Dati Generali</h2>
        <form id="form-modifica-dati" class="form-modifica">
            ${createInput('username', 'Username', user.id)}
            ${createInput('nome', 'Nome', user.nome)}
            ${createInput('cognome', 'Cognome', user.cognome)}
            ${createInput('indirizzo', 'Indirizzo', user.indirizzo || '')}
            ${createInput('telefono', 'Telefono', user.numero_telefono || '')}
            <button type="submit" class="btn-edit">Salva Modifiche</button>
        </form>
    `;

    document.getElementById('form-modifica-dati').addEventListener('submit', async function (e) {
        e.preventDefault();
        const form = e.target;
        const nuovoUsername = form.username.value.trim();
        const updatedUser = {
            id: nuovoUsername,
            nome: form.nome.value,
            cognome: form.cognome.value,
            indirizzo: form.indirizzo.value,
            numero_telefono: form.telefono.value
        };

        // Controllo username già esistente (escludendo il proprio)
        if (nuovoUsername !== user.id) {
            const { data: utentiStessoUsername, error: usernameError } = await supabase
                .from('registrazione')
                .select('id')
                .eq('id', nuovoUsername)
                .neq('id', user.id);

            if (usernameError) {
                alert("Errore nel controllo username.");
                console.error(usernameError);
                return;
            }

            if (utentiStessoUsername.length > 0) {
                alert("Questo username è già in uso. Scegli un altro username.");
                return;
            }
        }

        const { error } = await supabase
            .from('registrazione')
            .update(updatedUser)
            .eq('id', user.id);

        if (error) {
            alert("Errore durante il salvataggio nel database.");
            console.error(error);
            return;
        }

        // Aggiorna localStorage e saluto
        const nuovoUtente = { ...user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(nuovoUtente));
        document.getElementById('salutoUtente').textContent = `Ciao, ${nuovoUtente.nome}`;
        caricaDatiCliente();
        navigate('generali');
    });
}
window.modificaDatiGenerali = modificaDatiGenerali;