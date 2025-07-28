// CONFIGURAZIONE SUPABASE
const supabaseUrl = 'https://sbxrdptjegjxqaklfpxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHJkcHRqZWdqeHFha2xmcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjcxMTcsImV4cCI6MjA2MjIwMzExN30.-eNAPw6hGKrSLtYmFSxxneOtEKrAyH6OUi_pKZmg-zs';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DEBUG: Mostra user salvato
console.log("USER:", JSON.parse(localStorage.getItem('user')));

// CARICA DATI PROFILO GESTORE
function caricaDatiCliente() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.tipo_utente !== 'cliente') {
    alert('Accesso non autorizzato.');
    location = 'index.html';
    return;
  }

  const avatarSrc = user.avatarUrl || 'img/avatar-default.jpg';
  const avatarEl = document.getElementById('avatar');
  avatarEl.src = avatarSrc;
  avatarEl.addEventListener('click', () => apriPopup(avatarSrc));
  document.getElementById('nomeCognome').textContent = user.nome + ' ' + user.cognome;
  document.getElementById('azienda').textContent = user.azienda || '';
  document.getElementById('rating').textContent = user.rating || '0';
  document.getElementById('reviews').textContent = (user.reviewsCount || 0) + ' recensioni';
  navigate('ordini');
}
// FUNZIONE: Apre popup avatar
function apriPopup(src) {
  const popup = document.getElementById('avatar-popup');
  const preview = document.getElementById('preview-avatar');
  const fileInput = document.getElementById('upload-avatar');

  popup.style.display = 'flex';
  preview.src = src;

  // Reset file input per forzare onChange anche se si seleziona lo stesso file
  fileInput.value = "";

  // Listener dinamico per anteprima
  fileInput.onchange = function () {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
}


// FUNZIONE: Chiude popup avatar
function chiudiPopup() {
  document.getElementById('avatar-popup').style.display = 'none';
}

// FUNZIONE: Salva nuovo avatar
function salvaAvatar() {
  const fileInput = document.getElementById('upload-avatar');
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;

      let user = JSON.parse(localStorage.getItem('user'));
      user.avatarUrl = base64;
      localStorage.setItem('user', JSON.stringify(user));

      document.getElementById('avatar').src = base64;
      chiudiPopup();
    };
    reader.readAsDataURL(file);
  } else {
    chiudiPopup();
  }
}
// NAVIGAZIONE SEZIONI
async function navigate(sezione) {
  const cont = document.getElementById('section-content');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || !user.id) {
    console.error("⚠ user.id mancante o non valido", user);
    return;
  }

  if (sezione === 'ordini') {
    cont.innerHTML = `
      <h2>Storico Affitti</h2>
      <p>Qui troverai tutte le prenotazioni passate dei tuoi spazi coworking.</p>
      <table style="width:100%; margin-top:20px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: rgba(255,255,255,0.1);">
            <th style="padding: 10px;">Data</th>
            <th>Cliente</th>
            <th>Spazio</th>
            <th>Durata</th>
            <th>Prezzo</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody id="ordini-table">
          <tr><td colspan="6" style="text-align: center; padding: 20px;">Caricamento in corso...</td></tr>
        </tbody>
      </table>
    `;

    // Preleva ID spazi gestiti
    const { data: spaziData, error: spaziError } = await supabase
      .from('spazi_lavoro')
      .select('id_spazio')
      .eq('id_gestore', user.id);

    if (spaziError || !spaziData || spaziData.length === 0) {
      document.getElementById('ordini-table').innerHTML = <tr><td colspan="6" style="text-align:center;">Nessuna prenotazione trovata.</td></tr>;
      return;
    }

    const idSpazi = spaziData.map(s => s.id_spazio);

    const { data: prenotazioni, error: prenError } = await supabase
      .from('prenotazione')
      .select(`
        id_prenotazione, giorno, fascia_oraria,
        spazi_lavoro(indirizzo_spazio),
        registrazione(nome, cognome)
      `)
      .in('id_spazio', idSpazi);

    const table = document.getElementById('ordini-table');
    table.innerHTML = '';

    if (prenError || !prenotazioni || prenotazioni.length === 0) {
      table.innerHTML = <tr><td colspan="6" style="text-align:center;">Nessuna prenotazione trovata.</td></tr>;
      return;
    }

    prenotazioni.forEach(row => {
      table.innerHTML += `
        <tr>
          <td>${row.giorno}</td>
          <td>${row.registrazione?.nome || ''} ${row.registrazione?.cognome || ''}</td>
          <td>${row.spazi_lavoro?.indirizzo_spazio || '-'}</td>
          <td>${row.fascia_oraria}h</td>
          <td>–</td>
          <td>Confermata</td>
        </tr>
      `;
    });

  } else if (sezione === 'sicurezza') {
    cont.innerHTML = `
      <h2>Accesso & Sicurezza</h2>
      <p>Modifica le tue credenziali di accesso in sicurezza.</p>
      <ul style="margin-top:15px; line-height: 1.8;">
        <li>Email attuale: <strong>${user.email}</strong></li>
        <li><button class="btn-edit" style="margin-top:10px;">Cambia password</button></li>
        <li><button class="btn-edit" style="margin-top:10px;">Attiva autenticazione a due fattori</button></li>
      </ul>
    `;

  } else if (sezione === 'pagamenti') {
    cont.innerHTML = `
      <h2>Pagamenti</h2>
      <p>Gestisci i metodi di pagamento e verifica gli incassi ricevuti.</p>
      <table style="width:100%; margin-top:20px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: rgba(255,255,255,0.1);">
            <th>ID Prenotazione</th>
            <th>Importo</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody id="pagamenti-table">
          <tr><td colspan="3" style="text-align: center; padding: 20px;">Caricamento...</td></tr>
        </tbody>
      </table>
    `;

    const { data: pagamenti, error } = await supabase
      .from('pagamenti')
      .select('*')
      .eq('id_gestore', user.id);

    const table = document.getElementById('pagamenti-table');
    table.innerHTML = '';

    if (error || !pagamenti || pagamenti.length === 0) {
      table.innerHTML = <tr><td colspan="3" style="text-align:center;">Nessun pagamento registrato.</td></tr>;
      return;
    }

    pagamenti.forEach(p => {
      table.innerHTML += `
        <tr>
          <td>${p.id_prenotazione}</td>
          <td>€${p.importo.toFixed(2)}</td>
          <td>${new Date(p.timestamp).toLocaleDateString()}</td>
        </tr>
      `;
    });

  } else if (sezione === 'indirizzi') {
    cont.innerHTML = `
      <h2>Indirizzi</h2>
      <p>Elenco delle sedi coworking gestite dal tuo profilo.</p>
      <table style="width:100%; margin-top:20px; border-collapse: collapse;">
        <thead>
          <tr style="background-color: rgba(255,255,255,0.1);">
            <th>Nome Spazio</th>
            <th>Categoria</th>
            <th>Indirizzo</th>
            <th>Città</th>
            <th>Provincia</th>
            <th>Nazione</th>
          </tr>
        </thead>
        <tbody id="lista-spazi">
          <tr><td colspan="6" style="text-align:center; padding: 20px;">Caricamento in corso...</td></tr>
        </tbody>
      </table>
    `;

    const { data: spazi, error } = await supabase
      .from('spazi_lavoro')
      .select('*')
      .eq('id_gestore', user.id);

    const lista = document.getElementById('lista-spazi');
    lista.innerHTML = '';

    if (error || !spazi || spazi.length === 0) {
      lista.innerHTML = <tr><td colspan="6" style="text-align:center;">Nessuno spazio registrato.</td></tr>;
      return;
    }

    spazi.forEach(spazio => {
      //const indirizzoCompleto = ${spazio.indirizzo_spazio}, ${spazio.Numero_Civico};
      lista.innerHTML += `
        <tr>
          <td>${spazio.id_spazio}</td>
          <td>${spazio.categoria || '-'}</td>
          <td>${indirizzoCompleto}</td>
          <td>${spazio.Città}</td>
          <td>${spazio.Provincia}</td>
          <td>${spazio.Nazione}</td>
        </tr>
      `;
    });
  }
}

// MODIFICA PROFILO
function modificaProfilo() {
  const user = JSON.parse(localStorage.getItem('user'));
  const cont = document.getElementById('section-content');

  cont.innerHTML = `
    <h2>Modifica Profilo</h2>
    <form id="form-profilo" class="form-modifica">
      ${createInput('nome', 'Nome', user.nome)}
      ${createInput('cognome', 'Cognome', user.cognome)}
      ${createInput('username', 'Username', user.username)}
      ${createInput('email', 'Email', user.email, 'email')}
      ${createInput('password', 'Nuova Password (lascia vuoto se invariata)', '', 'password')}
      ${createInput('indirizzo', 'Indirizzo', user.indirizzo || '')}
      ${createInput('pagamento', 'Metodo di Pagamento', user.metodo_pagamento || '')}
      ${createInput('telefono', 'Numero di Telefono', user.telefono || '')}
      <button type="submit" class="btn-edit">Salva Modifiche</button>
    </form>
  `;

  document.getElementById('form-profilo').addEventListener('submit', function (e) {
    e.preventDefault();

    // 🔁 Simula salvataggio e torna alla schermata iniziale
    const cont = document.getElementById('section-content');
    cont.innerHTML = '';

    // Ritorna alla visualizzazione profilo
    caricaDatiGestore();
  });
}

function createInput(name, label, value = '', type = 'text') {
  return `
    <div class="form-group">
      <label for="${name}">${label}</label>
      <input type="${type}" id="${name}" name="${name}" value="${value}" placeholder="${label}">
    </div>
  `;
}


function createInput(name, label, value = '', type = 'text') {
  return `
    <div class="form-group">
      <label for="${name}">${label}</label>
      <input type="${type}" id="${name}" name="${name}" value="${value}" placeholder="${label}">
    </div>
  `;
}

function apriPopup(src) {
  document.getElementById('avatar-popup').style.display = 'flex';
  document.getElementById('preview-avatar').src = src;
  document.getElementById('upload-avatar').value = '';
}

function chiudiPopup() {
  document.getElementById('avatar-popup').style.display = 'none';
}

function salvaAvatar() {
  const fileInput = document.getElementById('upload-avatar');
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;

      let user = JSON.parse(localStorage.getItem('user'));
      user.avatarUrl = base64;
      localStorage.setItem('user', JSON.stringify(user));

      document.getElementById('avatar').src = base64;
      chiudiPopup();
    };
    reader.readAsDataURL(file);
  } else {
    chiudiPopup();
  }
}