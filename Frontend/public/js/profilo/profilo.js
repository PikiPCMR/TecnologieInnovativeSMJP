// CONFIGURAZIONE SUPABASE
import { supabase } from '../collegamentoDb.js';
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

// va in modifica_dati.js
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