// CONFIGURAZIONE SUPABASE
import { supabase } from './collegamentoDb.js';

const registrationForm = document.getElementById("registrationForm");

// ✅ Se utente autenticato da magic link: mostra popup decisione
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();

if (session && session.user && session.user.email) {
  const { data: utenti } = await supabase
    .from("registrazione")
    .select("*")
    .eq("email", session.user.email);

  if (utenti && utenti.length > 0) {
    const utente = utenti[0];

    await supabase
      .from("registrazione")
      .update({ email_verified: true })
      .eq("id", utente.id);

    localStorage.setItem("user", JSON.stringify(utente));

    // 👇 Imposto flag per mostrare il popup in profilo
    localStorage.setItem("mostraPopupDecisione", "true");

    // ✅ Redirect automatico
    window.location.href = "profilo.html";
  }
}

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
    updateGestoreFields();
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
    partita_iva: document.getElementById("piva").value.trim(),
    email_verified: false
  };

  await saveUser(user);
});

// ✅ Salvataggio nel database + invio Magic Link
async function saveUser(user) {
  const { data, error } = await supabase
    .from('registrazione')
    .insert([{ ...user }])
    .select();

  if (error) {
    console.error("❌ ERRORE DURANTE L'INSERIMENTO:", error.message, error.details);
    alert("Errore durante la registrazione: " + error.message);
    return;
  }

  localStorage.setItem("user", JSON.stringify({ ...user, id: data[0].id }));

  // 👇 Salva flag per mostrare popup in profilo
  localStorage.setItem("mostraPopupDecisione", "true");

  const redirectUrl = "http://localhost:3000/profilo.html"; // ✅ URL di destinazione

  const { error: magicError } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      emailRedirectTo: redirectUrl
    }
  });

  if (magicError) {
    console.error("Errore invio magic link:", magicError);
    alert("Errore durante l'invio dell'email. Riprova.");
    return;
  }

  mostraPopupVerifica(); // Mostra solo localmente il popup
}

// ✅ Mostra popup: email inviata (modificato)
function mostraPopupVerifica() {
  const popup = document.getElementById('popup-verifica-email');
  popup.innerHTML = `
    <div class="popup-box">
      <h3>Controlla la tua email</h3>
      <p>Ti abbiamo inviato un link per verificare l'indirizzo. Cliccalo per confermare.</p>
    </div>
  `;
  popup.style.display = 'flex';
}

function annullaVerificaEmail() {
  document.getElementById('popup-verifica-email').style.display = 'none';
}
window.annullaVerificaEmail = annullaVerificaEmail;

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
