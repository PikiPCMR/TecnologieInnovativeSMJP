import { supabase } from './collegamentoDb.js';
let user = null;
let prenotList = [];
const $ = (s)=>document.querySelector(s);
const params = new URLSearchParams(location.search);
const spazioId = params.get("id");
let spazioIdAttuale=null;
let prezzoAttuale=0;
let date=null;
document.addEventListener('DOMContentLoaded', async function() {
    user = JSON.parse(localStorage.getItem('user'));
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        height: 600,
        events: [
            // eventi caricati dopo
        ],
        eventClick: function(info) {
            // Mostra popup personalizzato
            showEventPopup(info.event);
            date = info.event.start.toLocaleDateString('fr-CA'); // formato YYYY-MM-DD
        }
    });
    calendar.render();

    const { data: prenotazioni, error } = await supabase
        .from('prenotazione')
        .select('*')
        .eq('id_utente', user.id);

    if (error) {
        console.error("Errore caricamento prenotazioni:", error);
    }

    
    (prenotazioni ?? []).forEach(prenotazione => {
        prenotList.push({
            id: prenotazione.id_prenotazione,
            prezzo: prenotazione.prezzo,
            giorno: prenotazione.giorno,
            fascia_oraria: prenotazione.fascia_oraria
        });
        // Aggiungi evento al calendario
        calendar.addEvent({
                title: `${prenotazione.id_spazio}: ${prenotazione.fascia_oraria}`,
                start: prenotazione.giorno,
                extendedProps: {
                id_spazio: prenotazione.id_spazio,
                id_prenotazione: prenotazione.id_prenotazione
            }
        });
    });

    // Dopo aver caricato le prenotazioni e il calendario:
    const statoPopup = localStorage.getItem('editPopupState');
    if (statoPopup) {
      const dati = JSON.parse(statoPopup);
      // Trova l'evento corrispondente (puoi usare id_prenotazione)
      const event = calendar.getEvents().find(ev => 
        ev.extendedProps.id_prenotazione === dati.id_prenotazione
      );
      if (event) {
        showEditPopup(event, dati); // Passa i dati salvati
      }
      localStorage.removeItem('editPopupState'); // Pulisci lo stato dopo il ripristino
    }
});

async function showEventPopup(event) {
    // Overlay (sfondo scuro trasparente)
    let overlay = document.getElementById('popup-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'popup-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.4)';
        overlay.style.zIndex = 9998;
        document.body.appendChild(overlay);
    } else {
        overlay.style.display = 'block';
    }

    // Popup
    let popup = document.getElementById('event-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'event-popup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%) scale(0.9)';
        popup.style.background = 'rgba(255,255,255,0.95)';
        popup.style.padding = '24px';
        popup.style.borderRadius = '16px';
        popup.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)';
        popup.style.zIndex = 9999;
        popup.style.width = '320px';
        popup.style.textAlign = 'center';
        popup.style.fontFamily = 'sans-serif';
        popup.style.transition = 'all 0.2s ease';
        popup.innerHTML = `
            <h3 style="margin-top:0; color:#4b2e83;">Gestisci prenotazione</h3>
            <p style="margin:12px 0; font-size:1rem; color:#333;"><b>${event.title}</b></p>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
                <button id="btn-cancella" style="background:#e74c3c; color:#fff; border:none; padding:8px 14px; border-radius:8px; cursor:pointer;">Cancella</button>
                <button id="btn-modifica" style="background:#6c5ce7; color:#fff; border:none; padding:8px 14px; border-radius:8px; cursor:pointer;">Modifica</button>
                <button id="btn-indietro" style="background:#aaa; color:#fff; border:none; padding:8px 14px; border-radius:8px; cursor:pointer;">Indietro</button>
            </div>
        `;

        document.body.appendChild(popup);
        spazioIdAttuale= event.extendedProps.id_spazio;
        const {data}= await supabase
            .from('spazi_lavoro')
            .select('prezzo_ora')
            .eq('id_spazio', spazioIdAttuale)
        prezzoAttuale= data[0].prezzo_ora* calcolaOreTotali(event.title.split(": ")[1]);
        // animazione "pop"
        requestAnimationFrame(() => {
            popup.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    } else {
        popup.style.display = 'block';
        popup.querySelector('p').innerHTML = `<b>${event.title}</b>`;
    }

    // Chiudi popup con overlay
    overlay.onclick = () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    };



    // Gestione pulsanti
    document.getElementById('btn-cancella').onclick = async () => {
        if (confirm("Sei sicuro di voler cancellare questa prenotazione?")) {

            
            const resp = await fetch('https://tecnologieinnovativesmjp.onrender.com/refund', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_pagamento: event.extendedProps.id_pagamento,
                        importo: prezzoAttuale
                    })
                });
            await supabase.from('prenotazione').delete().eq('id_prenotazione', event.extendedProps.id_prenotazione);
            alert("La prenotazione è stata cancellata. Verrai rimborsato dell'importo pagato.");
            event.remove();
            popup.style.display = 'none';
            overlay.style.display = 'none';
            if (popup) popup.remove();
            if (overlay) overlay.style.display = 'none';
            spazioIdAttuale=null;
            prezzoAttuale=0;

        }
    };
    document.getElementById('btn-modifica').onclick = () => {
        showEditPopup(event);
        popup.style.display = 'none';
        if (popup) popup.remove();
    };
    document.getElementById('btn-indietro').onclick = () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
        if (popup) popup.remove();
        if (overlay) overlay.style.display = 'none';
        spazioIdAttuale=null;
        prezzoAttuale=0;
    };
}

const FASCE = [
  { id: 1, label: "08:00–09:00" },
  { id: 2, label: "09:00–10:00" },
  { id: 3, label: "10:00–11:00" },
  { id: 4, label: "11:00–12:00" },
  { id: 5, label: "14:00–15:00" },
  { id: 6, label: "15:00–16:00" },
  { id: 7, label: "16:00–17:00" },
  { id: 8, label: "17:00–18:00" },
];

function showEditPopup(event, datiSalvati = null) {
    // Overlay (sfondo scuro trasparente)
    let overlay = document.getElementById('popup-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'popup-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.4)';
        overlay.style.zIndex = 9998;
        document.body.appendChild(overlay);
    } else {
        overlay.style.display = 'block';
    }
  let popup = document.getElementById('edit-popup');

  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'edit-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%) scale(0.9)';
    popup.style.zIndex = 9999;
    popup.style.background = 'rgba(255,255,255,0.95)';
    popup.style.padding = '32px';
    popup.style.borderRadius = '16px';
    popup.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)';
    popup.style.width = '480px';
    popup.style.textAlign = 'center';
    popup.style.fontFamily = 'sans-serif';
    popup.style.transition = 'all 0.2s ease';
    const nuovoSpazioId=spazioId==null? spazioIdAttuale: spazioId;
    popup.innerHTML = `
      <h3>Modifica Prenotazione</h3>
      <form id="edit-form">
          <div class="form-group">
              <label for="edit-giorno">Giorno</label>
              <input type="date" id="edit-giorno" name="giorno" required>
          </div>

          <div class="form-group">
              <div class="availability">
                  <div class="slots" id="slots"></div>
                  <small class="hint">Seleziona una fascia oraria disponibile.</small>
              </div>
          </div>

          <div class="form-group">
              <label for="edit-spazio">Spazio di lavoro: ${nuovoSpazioId}</label>
              <button type="button" id="edit-spazio" name="spazio" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ccc; background: #f7f7fa; color: #333;">Vai a Cerca Spazi</button>
          </div>

          <input type="hidden" id="edit-fascia" name="fascia">

          <div class="buttons">
              <button type="submit">Salva</button>
              <button type="button" id="btn-annulla">Annulla</button>
          </div>
      </form>
    `;

    const inputGiorno = popup.querySelector("#edit-giorno");
    inputGiorno.value = date;

    document.body.appendChild(popup);

    // === Gestione fasce orarie ===
    const slotsDiv = popup.querySelector('#slots');
    let selectedSlots = [];

    // aggiorna il campo hidden per il submit
    function syncHidden() {
      document.getElementById('edit-fascia').value = selectedSlots.join(",");
    }

    async function refreshAvailability() {
      const giorno = document.getElementById("edit-giorno").value;

      const { data: prenotazioni } = await supabase
        .from("prenotazione")
        .select("fascia_oraria")
        .eq("id_spazio", event.extendedProps.id_spazio)
        .eq("giorno", giorno);

      // mappa id -> orario
      const fasceOrarie = {
        1: ['08:00', '09:00'],
        2: ['09:00', '10:00'],
        3: ['10:00', '11:00'],
        4: ['11:00', '12:00'],
        5: ['14:00', '15:00'],
        6: ['15:00', '16:00'],
        7: ['16:00', '17:00'],
        8: ['17:00', '18:00'],
      };
      console.log(prenotazioni);
      const occupate = new Set();
      (prenotazioni || []).forEach(p => {
        if (!p.fascia_oraria) return;
        const intervalli = String(p.fascia_oraria).split(" e ");
        intervalli.forEach(intv => {
          const [inizio, fine] = intv.split("-").map(s => s.trim());
          if (!inizio || !fine) return;
          Object.entries(fasceOrarie).forEach(([id, [start, end]]) => {
            if (start >= inizio && end <= fine) {
              occupate.add(id);
            }
          });
        });
      });

      // ricostruisci i pulsanti
      slotsDiv.innerHTML = "";
      selectedSlots = [];
      FASCE.forEach(f => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = f.label;
        btn.className = "slot-btn";
        btn.style.padding = '6px 12px';
        btn.style.margin = '2px';
        btn.style.borderRadius = '6px';
        btn.style.border = '1px solid #ccc';
        btn.style.cursor = 'pointer';

        const busy = occupate.has(String(f.id));
        if (busy) {
          btn.style.background = '#ddd';
          btn.disabled = true;
        } else {
          btn.onclick = () => {
            if (selectedSlots.includes(f.id)) {
              selectedSlots = selectedSlots.filter(id => id !== f.id);
              btn.style.background = '#f7f7fa';
              btn.style.color = '#333';
            } else {
              selectedSlots.push(f.id);
              btn.style.background = '#764ba2';
              btn.style.color = '#fff';
            }
            syncHidden();
          };
        }

        // Se ci sono fasce pre-selezionate, imposta lo stato corretto per i pulsanti
        if (window.fascePreselezionate && window.fascePreselezionate.includes(f.id)) {
          selectedSlots.push(f.id);
          btn.style.background = '#764ba2';
          btn.style.color = '#fff';
        }

        slotsDiv.appendChild(btn);
      });

      syncHidden();
    }

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

    // init date field
    //const today = new Date().toISOString().slice(0,10);
    const dateInput = document.getElementById("edit-giorno");
    //dateInput.value = today;
    dateInput.addEventListener("change", refreshAvailability);

    refreshAvailability();


    // reindirizzamento alla pagina di ricerca spazi
    document.getElementById('edit-spazio').addEventListener('click', () => {
      // Salva lo stato attuale del popup
      const statoPopup = {
        giorno: document.getElementById('edit-giorno').value,
        fascia: document.getElementById('edit-fascia').value,
        // puoi aggiungere altri campi se necessario
        id_prenotazione: event.extendedProps.id_prenotazione
      };
      localStorage.setItem('editPopupState', JSON.stringify(statoPopup));
      window.location.href = 'ricerca_spazio/cerca_spazi.html?edit=true';
    });
    // === chiusura popup ===
    document.getElementById('btn-annulla').addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
        if (popup) popup.remove();
        if (overlay) overlay.style.display = 'none';
        spazioIdAttuale=null;
        prezzoAttuale=0;
    });

    // === submit form ===
    document.getElementById('edit-form').addEventListener('submit', async (e) => {
        
        e.preventDefault();
        const giorno = document.getElementById('edit-giorno').value;
        const fascia = fasciaOrariaToString(document.getElementById('edit-fascia').value);
        const spazio = nuovoSpazioId;

        console.log("Modifica:", { giorno, fascia, spazio });
        // Aggiorna la prenotazione nel database
        const { error } = await supabase
            .from('prenotazione')
            .update({ giorno, fascia_oraria: fascia, id_spazio: spazio })
            .eq('id_prenotazione', event.extendedProps.id_prenotazione);
        if (error) {
            console.error('Errore aggiornamento prenotazione:', error);
            alert('Errore durante l\'aggiornamento della prenotazione.');
            return;
        }
        console.log(spazio);
        const {data: prezzo_nuovo_spazio} = await supabase
            .from('spazi_lavoro')
            .select('prezzo_ora')
            .eq('id_spazio', spazio);
        
        const nuovo_prezzo=prezzo_nuovo_spazio[0]* document.getElementById('edit-fascia').value.length;
        
        if (prezzoAttuale != nuovo_prezzo) {
            if( prezzoAttuale > nuovo_prezzo) {
                alert("Il prezzo della prenotazione è stato ridotto da ${prezzoAttuale} a ${nuovo_prezzo}, a breve verrà rimborsata la differenza.");
                
                const resp = await fetch('https://tecnologieinnovativesmjp.onrender.com/refund', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_pagamento: event.extendedProps.id_pagamento,
                        importo: prezzoAttuale - nuovo_prezzo
                    })
                });
            }else{
                alert(`Il prezzo della prenotazione è stato aumentato da ${prezzoAttuale} a ${nuovo_prezzo}, a breve verrà addebitata la differenza.`);
                const resp = await fetch('https://tecnologieinnovativesmjp.onrender.com/charge-extra', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_pagamento: event.extendedProps.id_pagamento,
                        importo: nuovo_prezzo - prezzoAttuale
                    })
                });
            }
            
        }

        alert('Prenotazione aggiornata con successo!');
        popup.style.display = 'none';
        overlay.style.display = 'none';
        location.reload(); // Ricarica la pagina per aggiornare il calendario
    });

  } else {
    popup.style.display = 'block';
  }

  // Dopo aver creato il popup e prima di refreshAvailability:
  if (datiSalvati) {
    document.getElementById("edit-giorno").value = datiSalvati.giorno;
    // Puoi anche preimpostare le fasce selezionate
    // Salva in una variabile globale/di chiusura per usarla in refreshAvailability
    window.fascePreselezionate = datiSalvati.fascia ? datiSalvati.fascia.split(',').map(Number) : [];
  } else {
    window.fascePreselezionate = [];
  }
}

function calcolaOreTotali(fasciaOrariaString) {
    if (!fasciaOrariaString) return 0;
    let ore = 0;
    const intervalli = fasciaOrariaString.split(' e ');
    intervalli.forEach(intv => {
        const [inizio, fine] = intv.split('-').map(s => s.trim());
        if (inizio && fine) {
            // Converte "08:00" in 8, "10:00" in 10, ecc.
            const hStart = parseInt(inizio.split(':')[0], 10);
            const hEnd = parseInt(fine.split(':')[0], 10);
            ore += (hEnd - hStart);
        }
    });
    return ore;
}



document.getElementById('home').addEventListener('click', () => {
    window.location.href = 'index.html';
});
