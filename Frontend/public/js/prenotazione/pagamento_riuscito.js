/**
 * @file Gestisce la creazione di una nuova prenotazione e del relativo pagamento,
 * reindirizzando l'utente a una pagina di successo.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from '../collegamentoDb.js';

const queryString = window.location.search;
const params = new URLSearchParams(queryString);

/** @type {string} spazioId - L'ID dello spazio di lavoro, recuperato dalla URL. */
const spazioId= params.get('spazioId') || '';
/** @type {string} giorno - Il giorno della prenotazione, recuperato dalla URL. */
const giorno = params.get('giorno') || '';
/** @type {string} fascia - La fascia oraria della prenotazione, recuperata dalla URL. */
const fascia = params.get('orario') || '';
/** @type {string} prezzo - Il prezzo totale della prenotazione, recuperato dalla URL. */
const prezzo = params.get('prezzo') || '';
/** @type {string} id_gestore - L'ID del gestore dello spazio, recuperato dalla URL. */
const id_gestore = params.get('id_gestore') || '';
/** @type {string} idPagamento - L'ID del pagamento, recuperato dalla URL. */
const idPagamento = params.get('id_pagamento') || '';
/** @type {Object|null} user - L'oggetto utente loggato, recuperato dal localStorage. */
let user= null;

document.addEventListener('DOMContentLoaded', async () => {
    user = JSON.parse(localStorage.getItem('user'));
    const prenotazioneId = crypto.randomUUID();
    await inserisciPrenotazione(prenotazioneId);
    await waitForPrenotazione(prenotazioneId);
    await insericiPagamento(prenotazioneId);
    

    invioEmailUtente()
});

/**
 * Inserisce una nuova prenotazione nel database.
 * Controlla se la prenotazione esiste già prima di inserirla.
 * @async
 * @param {string} prenotazioneId - L'ID univoco della prenotazione da inserire.
 */
async function inserisciPrenotazione(prenotazioneId) {
    const payload = {
        id_prenotazione: prenotazioneId,
        id_utente: user.id,
        id_spazio: spazioId,
        giorno,
        fascia_oraria: fascia,
        timestamp: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from("prenotazione")
        .select("*")
        .eq("id_utente", user.id)
        .eq("id_spazio", spazioId)
        .eq("giorno", giorno)
        .eq("fascia_oraria", fascia);

    if (!existing.length) {
        const {data, error}= await supabase.from("prenotazione").insert(payload);
        if (error) {
            console.error("Errore inserimento prenotazione:", error.message, error.details, error.hint);
        } else {
            console.log("Prenotazione inserito:", data);  
        }
    }
}

/**
 * Inserisce un nuovo pagamento nel database.
 * Controlla se il pagamento esiste già prima di inserirlo.
 * @async
 * @param {string} prenotazioneId - L'ID della prenotazione associata al pagamento.
 */
async function insericiPagamento(prenotazioneId) {
    const payload = {
        id_pagamento: crypto.randomUUID(),
        id_utente: user.id,
        id_prenotazione: prenotazioneId,
        importo: prezzo,
        timestamp: new Date().toISOString(),
        id_gestore: id_gestore
    };

    const {data: existing} = await supabase
        .from("pagamenti")
        .select("*")
        .eq("id_utente", user.id)
        .eq("id_prenotazione", prenotazioneId);
    if (!existing.length) {
        const {data, error}= await supabase.from("pagamenti").insert(payload);
        if (error) {
            console.error("Errore inserimento pagamento:", error.message, error.details, error.hint);
        } else {
            console.log("Pagamento inserito:", data);  
        }
    }
}

/**
 * Attende che la prenotazione venga inserita nel database prima di procedere.
 * Implementa un meccanismo di polling con un timeout.
 * @async
 * @param {string} prenotazioneId - L'ID della prenotazione da cercare.
 * @param {number} [timeoutMs=15000] - Il tempo massimo di attesa in millisecondi.
 * @returns {Promise<Object>} La prenotazione trovata.
 * @throws {Error} Se la prenotazione non viene trovata entro il tempo limite.
 */
async function waitForPrenotazione(prenotazioneId, timeoutMs = 15000) {
    const start = Date.now();
    while (true) {
        const { data, error } = await supabase
            .from("prenotazione")
            .select("*")
            .eq("id_prenotazione", prenotazioneId);

        if (error) {
            console.error("Errore durante la ricerca della prenotazione:", error);
            throw error;
        }

        if (data && data.length > 0) {
            return data[0]; // Trovata!
        }

        if (Date.now() - start > timeoutMs) {
            throw new Error("Timeout: prenotazione non trovata entro il tempo limite.");
        }

        await new Promise(res => setTimeout(res, 1000)); // Attendi 1 secondo
    }
}

/**
 * Reindirizza l'utente alla pagina di gestione delle prenotazioni.
 */
function viewBookings() {
    window.location.href = '/html/prenotazione/gestione_prenotazioni.html';
}
window.viewBookings = viewBookings;

/**
 * Reindirizza l'utente alla pagina principale.
 */
function home() {
    window.location.href = "/html/index.html";
}

window.home = home;