import { supabase } from './collegamentoDb.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    await login();
  });

  // --- GESTIONE RESET PASSWORD ---
  const openBtn = document.getElementById("openResetPopup");
  const modal = document.getElementById("resetPasswordModal");
  const closeBtn = document.getElementById("closeResetModal");
  const sendBtn = document.getElementById("sendResetLink");
  const emailInput = document.getElementById("resetEmail");
  const errorBox = document.getElementById("emailError");

  if (openBtn && modal && closeBtn && sendBtn && emailInput && errorBox) {
    openBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });

    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      emailInput.value = '';
      errorBox.textContent = '';
    });

    sendBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      errorBox.textContent = '';

      if (!email) {
        errorBox.textContent = "Inserisci un indirizzo email valido.";
        return;
      }

      // 🔍 Verifica se la mail esiste nella tabella "registrazione"
      const { data, error } = await supabase
        .from("registrazione")
        .select("*")
        .eq("email", email);

      if (error) {
        console.error("Errore verifica email:", error.message);
        errorBox.textContent = "Errore durante la verifica.";
        return;
      }

      if (!data || data.length === 0) {
        errorBox.textContent = "Email senza account registrato.";
        return;
      }

      // ✅ Procedi con invio reset se esiste
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/html/reset_password.html'
      });

      if (resetError) {
        errorBox.textContent = "Errore durante l'invio: " + resetError.message;
      } else {
        alert("Email di reset inviata con successo!");
        modal.style.display = "none";
        emailInput.value = '';
      }
    });
  }
});

async function login() {
  const id = document.getElementById('id').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase
    .from('registrazione')
    .select('*')
    .eq('id', id)
    .eq('password', password);

  if (error) {
    alert('Errore nel login: ' + error.message);
    console.error(error);
    return;
  }

  if (data.length === 0) {
    alert('Credenziali errate');
    return;
  }

  const user = data[0];
  console.log("Utente loggato:", user);
  console.log("Tipo utente:", user.tipo_utente);

  if (!user.tipo_utente) {
    alert("Errore: campo tipo_utente mancante.");
    return;
  }

  localStorage.setItem('user', JSON.stringify(user));

  if (user.tipo_utente === "gestore") {
    window.location.href = "dashboard_gestore.html";
  } else if (user.tipo_utente === "cliente") {
    window.location.href = "../html/index.html";
  } else {
    alert("Tipo utente non riconosciuto: " + user.tipo_utente);
    window.location.href = "../html/index.html";
  }
}

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
  });
}

export function requireUserRole() {
  const user = JSON.parse(localStorage.getItem('user'));
  const path = window.location.pathname;

  if (!user || !user.tipo_utente) {
    if (path !== "/html/index.html") {
      window.location.href = "../html/index.html";
      alert("Devi effettuare il login per poter accedere alle funzioni!");
    }
    return;
  }

  // Pagine consentite per gestore
  const gestorePages = [
    "/html/dashboard_gestore.html",
    "/html/contenuti_gestore/modifica_spazio.html",
    "/html/contenuti_gestore/crea_nuovo_spazio.html",
    "/html/internal_dashboard.html"
  ];

  // Pagine consentite per cliente
  const clientePages = [
    "/html/prenota_spazio.html",
    "/html/prenotazione.html",
    "/html/spazio.html",
    "html/cerca_spazi.html"
  ];

  if (user.tipo_utente === "gestore" && !gestorePages.includes(path)) {
    window.location.href = "../html/dashboard_gestore.html";
    return;
  }

  if (user.tipo_utente === "cliente" && !clientePages.includes(path)) {
    window.location.href = "../html/index.html";
    return;
  }
}
window.requireUserRole = requireUserRole;