
document.addEventListener('DOMContentLoaded', function() {
var calendarEl = document.getElementById('calendar');
var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'it',
    height: 600,
    events: [
    // Qui puoi caricare le prenotazioni dell'utente come eventi
    // { title: 'Prenotazione', start: '2025-08-19' }
    ]
});
calendar.render();
});
