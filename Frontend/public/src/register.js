// CONFIGURAZIONE SUPABASE
import { supabase } from './collegamentoDb.js';

const registrationForm = document.getElementById("registrationForm");

document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.getElementById("role");
  const submitBtn = document.getElementById("submitBtn");

  const requiredFields = [
    { id: "nome", labelSpan: "nome" },
    { id: "cognome", labelSpan: "cognome" },
    { id: "piva", labelSpan: "piva" }
  ];

  function updateGestoreFields() {
    const isGestore = roleSelect.value === "gestore";

    requiredFields.forEach(({ id }) => {
      const input = document.getElementById(id);
      const marker = document.querySelector(`label[for="${id}"] .required-marker`);
      if (input && marker) {
        input.required = isGestore;
        marker.textContent = isGestore ? "*" : "";
      }
    });
  }

  if (roleSelect && submitBtn) {
    updateGestoreFields(); // iniziale
    roleSelect.addEventListener("change", updateGestoreFields);
  }
});


registrationForm?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const tipoUtente = document.getElementById("role").value;
  const password = document.getElementById("password").value.trim();
  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("username").value.trim();

  const isValidPassword = /^(?=.*[A-Z]).{6,}$/.test(password);
  if (!isValidPassword) {
    alert("La password deve contenere almeno 6 caratteri e una lettera maiuscola.");
    return;
  }

  if (tipoUtente === "gestore") {
    const nome = document.getElementById("nome").value.trim();
    const cognome = document.getElementById("cognome").value.trim();
    const piva = document.getElementById("piva").value.trim();

    if (!nome || !cognome || !piva) {
      alert("Compila tutti i campi obbligatori per i gestori (nome, cognome, P.IVA).");
      return;
    }
  }

  const { data: existingUsers, error: checkError } = await supabase
    .from('registrazione')
    .select('id')
    .eq('email', email);

  if (checkError) {
    console.error("Errore nel controllo email:", checkError);
    alert("Errore durante il controllo email. Riprova.");
    return;
  }

  if (existingUsers.length > 0) {
    alert("Questa email è già registrata. Usa un'altra email.");
    return;
  }

  const { data: existingUsernames, error: usernameError } = await supabase
    .from('registrazione')
    .select('id')
    .eq('id', username);

  if (usernameError) {
    console.error("Errore nel controllo username:", usernameError);
    alert("Errore durante il controllo username. Riprova.");
    return;
  }

  if (existingUsernames.length > 0) {
    alert("Questo username è già in uso. Scegli un altro username.");
    return;
  }

  const user = {
    id: username,
    password,
    email,
    indirizzo: document.getElementById("address").value.trim(),
    numero_telefono: document.getElementById("phone").value.trim(),
    tipo_utente: tipoUtente,
    nome: document.getElementById("nome").value.trim(),
    cognome: document.getElementById("cognome").value.trim(),
    nome_azienda: document.getElementById("azienda").value.trim(),
    partita_iva: document.getElementById("piva").value.trim()
  };

  await saveUser(user);
});


// ✅ Salvataggio nel database e localStorage
async function saveUser(user) {
  const codice = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem("codice_verifica", codice); // solo in localStorage

  const { data, error } = await supabase
    .from('registrazione')
    .insert([{ ...user, email_verified: false }])
    .select();

  if (error) {
    console.error("❌ ERRORE DURANTE L'INSERIMENTO:", error.message, error.details);
    alert("Errore durante la registrazione: " + error.message);
    return;
  }

  localStorage.setItem("user", JSON.stringify({ ...user, id: data[0].id }));
  mostraPopupVerifica();
}

function mostraPopupVerifica() {
  const popup = document.getElementById('popup-verifica-email');
  popup.style.display = 'flex';

  const codice = localStorage.getItem('codice_verifica');
  console.log("Codice verifica (simulato):", codice);
}


document.getElementById('verificaCodiceBtn').addEventListener('click', async () => {
  const codiceInserito = document.getElementById('codiceVerifica').value.trim();
  const utente = JSON.parse(localStorage.getItem('user'));
  const codiceSalvato = localStorage.getItem('codice_verifica');

  if (codiceInserito !== codiceSalvato) {
    alert("Codice errato. Riprova.");
    return;
  }

  const { error } = await supabase
    .from('registrazione')
    .update({ email_verified: true })
    .eq('id', utente.id);

  if (error) {
    console.error("Errore durante aggiornamento verifica:", error);
    alert("Errore interno. Riprova.");
    return;
  }

  utente.email_verified = true;
  localStorage.setItem("user", JSON.stringify(utente));
  localStorage.removeItem("codice_verifica");

  document.getElementById('popup-verifica-email').style.display = 'none';
  mostraPopupDecisione(utente);
});


function annullaVerificaEmail() {
  document.getElementById('popup-verifica-email').style.display = 'none';
}
window.annullaVerificaEmail = annullaVerificaEmail;


// ✅ Mostra popup di conferma
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
    window.location.href = "profilo.html";
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


// ✅ Mostra/Nascondi password
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
  });
}
