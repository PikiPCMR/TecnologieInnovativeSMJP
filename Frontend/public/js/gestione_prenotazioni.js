import { supabase } from './collegamentoDb.js';
let user = null;
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
        calendar.addEvent({
                title: `${prenotazione.id_spazio}: ${prenotazione.fascia_oraria}`,
                start: prenotazione.giorno,
                extendedProps: {
                id_spazio: prenotazione.id_spazio,
                id_prenotazione: prenotazione.id_prenotazione
            }
        });
    });


    
});

function showEventPopup(event) {
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
            await supabase.from('prenotazione').delete().eq('id_prenotazione', event.extendedProps.id_prenotazione);
            event.remove();
            popup.style.display = 'none';
        }
    };
    document.getElementById('btn-modifica').onclick = () => {
        alert("Funzionalità di modifica da implementare.");
        // Qui puoi aprire un form di modifica
    };
    document.getElementById('btn-indietro').onclick = () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    };
}

