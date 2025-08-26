import { supabase } from '../collegamentoDb.js';
const queryString = window.location.search;

const params = new URLSearchParams(queryString);

const spazioId = params.get('id');
const giorno = params.get('giorno');
const selectedSlots = params.get('selectedSlots').replaceAll(",","");
const id_gestore = params.get('id_gestore');
let prezzo=0;
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
  }catch (error) {
    console.error('Errore nel recupero dei dati dello spazio:', error);
  }
  
});

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