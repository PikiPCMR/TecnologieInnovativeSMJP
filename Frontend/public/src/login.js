import { supabase } from './collegamentoDb.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    await login(); // chiama la funzione normalmente
  });
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
  console.log("Tipo utente:", user.tipo_utente); // verifica che esista

  if (!user.tipo_utente) {
    alert("Errore: campo tipo_utente mancante.");
    return;
  }

  localStorage.setItem('user', JSON.stringify(user));

  // Redirezione basata sul ruolo
  if (user.tipo_utente === "gestore") {
    window.location.href = "dashboard_gestore.html";
  } else if (user.tipo_utente === "cliente") {
    window.location.href = "index.html";
  } else {
    alert("Tipo utente non riconosciuto: " + user.tipo_utente);
    window.location.href = "index.html";
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

// auth.js (autorizzazione ad entrare nelle pagine)
function requireUserRole(role) {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    alert("Devi effettuare il login per accedere.");
    window.location.href = "index.html"; // oppure login.html
    return;
  }

  if (user.tipo_utente !== role) {
    alert("Accesso non autorizzato.");
    window.location.href = "index.html";
  }
}
window.requireUserRole = requireUserRole;

export { requireUserRole };



