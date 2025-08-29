/**
 * @file Gestisce la visualizzazione del riepilogo della prenotazione
 * e la preparazione al pagamento, raccogliendo i dati dell'utente.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from '../collegamentoDb.js';

const queryString = window.location.search;
const params = new URLSearchParams(queryString);

/** @type {string} spazioId - L'ID dello spazio di lavoro, recuperato dalla URL. */
const spazioId = params.get('id');
/** @type {string} giorno - Il giorno della prenotazione, recuperato dalla URL. */
const giorno = params.get('giorno');
/** @type {string} selectedSlots - Gli ID delle fasce orarie selezionate, recuperate dalla URL come stringa CSV. */
const selectedSlots = params.get('selectedSlots');
/** @type {string} id_gestore - L'ID del gestore dello spazio, recuperato dalla URL. */
const id_gestore = params.get('id_gestore');
/** @type {number} prezzo - Il prezzo totale calcolato per la prenotazione. */
let prezzo=0;
/** @type {string} orario - La fascia oraria della prenotazione formattata come stringa. */
let orario="";

document.addEventListener('DOMContentLoaded', async() => {
    try{
        const{data, error: fetchError} = await supabase
        .from('spazi_lavoro')
        .select('prezzo_ora')
        .eq('id_spazio', spazioId)
        .single();
        if (fetchError) throw new Error(fetchError.message);

        prezzo = data.prezzo_ora * selectedSlots.length;
        document.getElementById('spazio-id').textContent = spazioId;
        document.getElementById('giorno').textContent = giorno;
        orario = fasciaOrariaToString(selectedSlots);
        document.getElementById('fascia').textContent = orario;
        document.getElementById('prezzo').textContent = `€ ${prezzo}`;
    } catch (error) {
        console.error('Errore nel recupero dei dati dello spazio:', error);
    }
});

/**
 * Converte una stringa CSV di ID di fasce orarie in una stringa di orari leggibile.
 * Le fasce consecutive vengono raggruppate in intervalli (es. "08:00-10:00 e 15:00-16:00").
 * @param {string|Array<number>} fascia - Una stringa CSV (es. "1,2,5,6") o un array di numeri.
 * @returns {string} La stringa formattata delle fasce orarie.
 */
function fasciaOrariaToString(fascia) {
    // Mappa delle fasce: id → [inizio, fine]
    const fasceOrarie = {
        1: ['08:00', '09:00'],
        2: ['09:00', '10:00'],
        3: ['10:00', '11:00'],
        4: ['11:00', '12:00'],
        5: ['14:00', '15:00'],
        6: ['15:00', '16:00'],
        7: ['16:00', '17:00'],
        8: ['17:00', '18:00']
    };

    if (typeof fascia === "string") {
        fascia = fascia.split(",").map(Number);
    }
    // Ordina le fasce selezionate
    fascia = fascia.filter(f => fasceOrarie[f]).sort((a, b) => a - b);

    let intervalli = [];
    let start = null;
    let end = null;

    for (let i = 0; i < fascia.length; i++) {
        const curr = fascia[i];
        if (start === null) {
            start = curr;
            end = curr;
        } else if (curr === end + 1) {
            // Fascia consecutiva
            end = curr;
        } else {
            // Fine intervallo precedente
            intervalli.push([start, end]);
            start = curr;
            end = curr;
        }
    }
    if (start !== null) {
        intervalli.push([start, end]);
    }

    // Costruisci stringa intervalli
    let ris = intervalli.map(([inizio, fine]) => {
        return `${fasceOrarie[inizio][0]}-${fasceOrarie[fine][1]}`;
    }).join(' e ');

    return ris;
}

document.getElementById('button-sub').addEventListener('click', async () => {
    const nome= document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();

    
    window.location.href = `/html/prenotazione/pagamento.html?nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&prezzo=${prezzo}&id=${spazioId}&giorno=${encodeURIComponent(giorno)}&orario=${encodeURIComponent(orario)}&id_gestore=${encodeURIComponent(id_gestore)}`;
});

document.getElementById('annulla').addEventListener('click', () => {
    window.location.href = `/html/ricerca_spazio/cerca_spazi.html`;
});