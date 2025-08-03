// CONFIGURAZIONE SUPABASE
import { supabase } from './collegamentoDb.js';
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
            <button class="btn-edit" onclick="apriPopupResetPassword()">Reset Password</button>
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

// === APRI POPUP ===
export function apriPopup() {
  document.getElementById('avatar-popup').style.display = 'flex';
  caricaAvatarDaDB();
}
window.apriPopup = apriPopup;

// === CHIUDI POPUP ===
export function chiudiPopup() {
  document.getElementById('avatar-popup').style.display = 'none';
}
window.chiudiPopup = chiudiPopup;

// === CARICA AVATAR DA BUCKET ===
export async function caricaAvatarDaDB() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.id) {
    console.warn('⚠️ Nessun utente loggato, esco dalla funzione.');
    return;
  }

  console.log('🔄 Caricamento avatar da tabella DB...');

  const { data, error } = await supabase
    .from('avatar_profilo')
    .select('*');

  if (error) {
    console.error('❌ Errore caricamento avatar dal DB:', error);
    return;
  }

  console.log('✅ Avatar caricati dal DB:', data);

  const grid = document.getElementById('avatar-grid');
  if (!grid) {
    console.warn('⚠️ Elemento #avatar-grid non trovato nel DOM.');
    return;
  }

  grid.innerHTML = '';

  if (!data || data.length === 0) {
    grid.innerHTML = '<p>Nessuna immagine disponibile.</p>';
    return;
  }

  data.forEach(avatar => {
    const img = document.createElement('img');
    img.src = avatar.url;  // URL preso dal DB
    img.alt = avatar.descrizione || avatar.nome_file;
    img.onclick = () => selezionaAvatar(avatar.url);
    grid.appendChild(img);
  });

  console.log('✅ Avatar mostrati nel popup');
}

// === SELEZIONA AVATAR ===
async function selezionaAvatar(urlAvatar) {
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user.id;

  if (!userId) {
    console.error('⚠️ ID utente non trovato nel localStorage.');
    return;
  }

  const { error } = await supabase
    .from('registrazione')
    .update({ immagine_profilo: urlAvatar })
    .eq('id', userId);

  if (error) {
    console.error('❌ Errore nel salvataggio immagine profilo nel DB:', error);
    return;
  }

  // Aggiorna immagine nel DOM
  document.getElementById('avatar').src = urlAvatar;

  // Aggiorna localStorage
  user.immagine_profilo = urlAvatar;
  localStorage.setItem('user', JSON.stringify(user));

  console.log('✅ Avatar selezionato e salvato:', urlAvatar);
  chiudiPopup();
}

// === CARICA AVATAR UTENTE ALL'AVVIO ===
export function caricaAvatarUtente() {

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.id) {
    console.warn('⚠️ Nessun utente loggato, esco dalla funzione.');
    return;
  }

  const avatarImg = document.getElementById('avatar');
  const placeholder = 'https://sbxrdptjegjxqaklfpxq.supabase.co/storage/v1/object/public/immaginiprofilo//user1.png';

  try {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.immagine_profilo || user.immagine_profilo.trim() === '') {
      console.warn('🙈 Nessun utente o immagine trovata, uso placeholder.');
      avatarImg.src = placeholder;
      return;
    }

    console.log('📸 Immagine profilo trovata:', user.immagine_profilo);
    avatarImg.src = user.immagine_profilo;
  } catch (err) {
    console.error('❌ Errore nel recupero utente:', err);
    avatarImg.src = placeholder;
  }
}
window.caricaAvatarUtente = caricaAvatarUtente;


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
  alert("Password aggiornata con successo!");

  // 🔐 Disconnessione + redirect
  await supabase.auth.signOut();
  localStorage.removeItem('user');
  window.location.href = 'login.html';

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

// === GESTIONE POPUP RESET PASSWORD ===
document.addEventListener("DOMContentLoaded", () => {
  const confirmBtn = document.getElementById("confirmResetPassword");
  const cancelBtn = document.getElementById("cancelResetPassword");
  const popup = document.getElementById("popup-reset-password");

  if (confirmBtn && cancelBtn && popup) {
    confirmBtn.addEventListener("click", async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.email) {
        alert("Email utente non disponibile.");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: "http://localhost:3000/reset_password.html"
      });
      if (error) {
        alert("Errore durante l'invio: " + error.message);
      } else {
        alert("Email inviata con successo!");

        // 🔐 Disconnessione + redirect anche dopo richiesta reset
        await supabase.auth.signOut();
        localStorage.removeItem("user");
        window.location.href = "login.html";
      }

    });

    cancelBtn.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }
});

export function apriPopupResetPassword() {
  document.getElementById("popup-reset-password").style.display = "flex";
}
window.apriPopupResetPassword = apriPopupResetPassword;

