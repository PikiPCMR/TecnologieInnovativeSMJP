import { supabase } from '../collegamentoDb.js';

const queryString = window.location.search;
const params = new URLSearchParams(queryString);
const spazioId= params.get('spazioId') || '';
const giorno = params.get('giorno') || '';
const fascia = params.get('orario') || '';
const prezzo = params.get('prezzo') || '';
const id_gestore = params.get('id_gestore') || '';
const idPagamento = params.get('id_pagamento') || '';
let user= null;

document.addEventListener('DOMContentLoaded', async () => {
    user = JSON.parse(localStorage.getItem('user'));
    const prenotazioneId = crypto.randomUUID();
    inserisciPrenotazione(prenotazioneId);
    waitForPrenotazione(prenotazioneId)
    insericiPagamento(prenotazioneId);
    

    invioEmailUtente()
});

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

function viewBookings() {
    window.location.href = '/html/prenotazione/gestione_prenotazioni.html';
}
window.viewBookings = viewBookings;

function home() {
    window.location.href = "/html/index.html";
}

window.home = home;