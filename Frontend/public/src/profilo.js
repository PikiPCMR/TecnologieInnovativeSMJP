// CONFIGURAZIONE SUPABASE
import { supabase } from './collegamentoDb.js';

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
export function caricaDatiCliente() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.tipo_utente) {
    alert('Accesso non autorizzato.');
    location = 'index.html';
    return;
  }

  const avatarSrc = user.avatarUrl || 'img/avatar-default.jpg';
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

// === LOGO DINAMICO ===
document.addEventListener("DOMContentLoaded", () => {
  const logoLink = document.querySelector('.logo-link');
  const user = JSON.parse(localStorage.getItem('user'));
  logoLink.href = user?.tipo_utente === 'gestore' ? 'dashboard_gestore.html' : 'index.html';
});

// === NAVIGAZIONE SEZIONI ===
export async function navigate(sezione) {
  const cont = document.getElementById('section-content');
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user?.id) return;

  switch (sezione) {
    case 'prenotazioni':
      cont.innerHTML = `
        <h2>PRENOTAZIONI</h2>
        <ul id="prenotazioniList">Caricamento...</ul>
      `;
      const { data: prenotazioni, error } = await supabase
        .from('prenotazione')
        .select('*')
        .eq('id_utente', user.id);
      const list = document.getElementById('prenotazioniList');
      list.innerHTML = (error || !prenotazioni.length)
        ? '<li>Nessuna prenotazione trovata.</li>'
        : prenotazioni.map(p => `<li>${p.giorno} - ${p.fascia_oraria}h</li>`).join('');
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
            <button class="btn-edit" onclick="attivaAutenticazione2FA()">Attiva autenticazione a due fattori</button>
          </div>
        </div>
      `;
      break;

    case 'pagamenti':
      cont.innerHTML = `
        <h2>PAGAMENTI</h2>
        <p>Metodo: <strong>${user.metodo_pagamento || 'Non impostato'}</strong></p>
      `;
      break;

    case 'comunicazioni':
      cont.innerHTML = `
        <h2>COMUNICAZIONI</h2>
        <p>Preferenze email, notifiche e messaggi.</p>
        <p>In arrivo...</p>
      `;
      break;

    default:
      cont.innerHTML = `<p>Sezione "${sezione}" non trovata.</p>`;
  }
}
window.navigate = navigate;

// === MODIFICA PROFILO ===
export function modificaProfilo() {
  const user = JSON.parse(localStorage.getItem('user'));
  const cont = document.getElementById('section-content');

  cont.innerHTML = `
    <h2>Modifica Profilo</h2>
    <form id="form-profilo" class="form-modifica">
      ${createInput('nome', 'Nome', user.nome)}
      ${createInput('cognome', 'Cognome', user.cognome)}
      ${createInput('email', 'Email', user.email, 'email')}
      ${createInput('telefono', 'Telefono', user.numero_telefono || '')}
      ${createInput('metodo_pagamento', 'Metodo di pagamento', user.metodo_pagamento || '')}
      <button type="submit" class="btn-edit">Salva modifiche</button>
    </form>
  `;

  document.getElementById('form-profilo').addEventListener('submit', function (e) {
    e.preventDefault();
    const form = e.target;
    const dati = {
      nome: form.nome.value,
      cognome: form.cognome.value,
      email: form.email.value,
      numero_telefono: form.telefono.value,
      metodo_pagamento: form.metodo_pagamento.value
    };

    const user = JSON.parse(localStorage.getItem('user'));
    Object.assign(user, dati);
    localStorage.setItem('user', JSON.stringify(user));
    caricaDatiCliente();
    alert('Dati aggiornati con successo.');
  });
}
window.modificaProfilo = modificaProfilo;

function createInput(name, label, value = '', type = 'text') {
  return `
    <div class="form-group">
      <label for="${name}">${label}</label>
      <input type="${type}" id="${name}" name="${name}" value="${value}" />
    </div>
  `;
}

// === MODIFICA DATI GENERALI ===
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

// === GESTIONE AVATAR ===
export function apriPopup(src) {
  document.getElementById('avatar-popup').style.display = 'flex';
  document.getElementById('preview-avatar').src = src;
  document.getElementById('upload-avatar').value = '';
}
window.apriPopup = apriPopup;

export function chiudiPopup() {
  document.getElementById('avatar-popup').style.display = 'none';
}
window.chiudiPopup = chiudiPopup;

export function salvaAvatar() {
  const fileInput = document.getElementById('upload-avatar');
  const file = fileInput.files[0];
  if (!file) return chiudiPopup();

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
}
window.salvaAvatar = salvaAvatar;

// === POPUP MODIFICA EMAIL ===
export function apriPopupEmail() {
  document.getElementById('popup-email').style.display = 'flex';
}
window.apriPopupEmail = apriPopupEmail;

document.getElementById('form-modifica-email')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const nuovaEmail = document.getElementById('nuovaEmail').value.trim();
  const confermaEmail = document.getElementById('confermaEmail').value.trim();
  const user = JSON.parse(localStorage.getItem('user'));

  if (!nuovaEmail || !confermaEmail) {
    alert("Entrambi i campi devono essere compilati.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(nuovaEmail)) {
    alert("Inserisci un indirizzo email valido.");
    return;
  }

  if (nuovaEmail !== confermaEmail) {
    alert("Le email non coincidono.");
    return;
  }

  const { data: utentiEsistenti, error: checkError } = await supabase
    .from('registrazione')
    .select('id')
    .eq('email', nuovaEmail)
    .neq('id', user.id); // esclude il proprio profilo

  if (checkError) {
    alert("Errore nel controllo email.");
    console.error(checkError);
    return;
  }

  if (utentiEsistenti.length > 0) {
    alert("Questa email è già utilizzata da un altro utente.");
    return;
  }

  const { error } = await supabase
    .from('registrazione')
    .update({ email: nuovaEmail })
    .eq('id', user.id);

  if (error) {
    alert("Errore durante l'aggiornamento email.");
    console.error(error);
    return;
  }

  user.email = nuovaEmail;
  localStorage.setItem('user', JSON.stringify(user));

  document.getElementById('nuovaEmail').value = '';
  document.getElementById('confermaEmail').value = '';
  chiudiPopupEmail();
  caricaDatiCliente();
  navigate('sicurezza');
});

function chiudiPopupEmail() {
  document.getElementById('popup-email').style.display = 'none';
}
window.chiudiPopupEmail = chiudiPopupEmail;

// === POPUP MODIFICA PASSWORD ===
export function apriPopupPassword() {
    const popup = document.getElementById('popup-password');
  popup.style.display = 'flex';

  // Svuota i campi password ogni volta che si apre il popup
  document.getElementById('vecchiaPassword').value = '';
  document.getElementById('nuovaPassword').value = '';

  // Reimposta il tipo a "password" e il testo del bottone
  document.getElementById('vecchiaPassword').type = 'password';
  document.getElementById('nuovaPassword').type = 'password';

  const buttons = popup.querySelectorAll('.toggle-btn');
  buttons.forEach(btn => btn.textContent = 'Mostra');
}
window.apriPopupPassword = apriPopupPassword;

document.getElementById('form-modifica-password')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const user = JSON.parse(localStorage.getItem('user'));
  const vecchia = document.getElementById('vecchiaPassword').value;
  const nuova = document.getElementById('nuovaPassword').value;

  if (!vecchia || !nuova) {
    return alert("Compila entrambi i campi.");
    }

    if (vecchia === nuova) {
        return alert("La nuova password deve essere diversa dalla vecchia.");   
    }

    const isValidPassword = /^(?=.*[A-Z]).{6,}$/.test(nuova);
    if (!isValidPassword) {
        alert("La password deve contenere almeno 6 caratteri e una lettera maiuscola.");
        return;
    }
    if (vecchia !== user.password) {
        alert("La vecchia password non è corretta.");
        return;
    }

    const { error } = await supabase
        .from('registrazione')
        .update({ password: nuova })
        .eq('id', user.id);

    if (error) return alert("Errore durante l'aggiornamento password.");

    user.password = nuova;
    localStorage.setItem('user', JSON.stringify(user));
    chiudiPopupPassword();
    alert("Password aggiornata con successo.");
    });

// Listener per il tasto "Annulla" nel popup password
document.getElementById('btnAnnullaPassword')?.addEventListener('click', function () {
  chiudiPopupPassword();
});

function chiudiPopupPassword() {
   const popup = document.getElementById('popup-password');
  popup.style.display = 'none';

  // Pulizia aggiuntiva
  popup.querySelector('#vecchiaPassword').value = '';
  popup.querySelector('#nuovaPassword').value = '';
}
window.chiudiPopupPassword = chiudiPopupPassword;

export function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? 'Nascondi' : 'Mostra';
}
window.togglePassword = togglePassword;

function mostraPopupDecisione(user) {
  const overlay = document.createElement("div");
  overlay.classList.add("overlay-popup");

  overlay.innerHTML = `
    <div class="popup-box">
      <h3>Registrazione completata!</h3>
      <p>Vuoi completare il tuo profilo con più dettagli o iniziare subito a esplorare il sito?</p>
      <div class="popup-buttons">
        <button class="popup-btn" id="btnCompleta">Completa Profilo</button>
        <button class="popup-btn-secondary" id="btnEsplora">Esplora il Sito</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("btnCompleta").addEventListener("click", () => {
    overlay.remove();
    navigate("generali");
  });

  document.getElementById("btnEsplora").addEventListener("click", () => {
    overlay.remove();
    if (user.tipo_utente === "gestore") {
      window.location.href = "dashboard_gestore.html";
    } else {
      window.location.href = "index.html";
    }
  });
}
