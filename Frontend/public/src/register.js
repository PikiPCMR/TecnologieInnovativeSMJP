/* CONFIGURAZIONE SUPABASE
const supabaseUrl = 'https://sbxrdptjegjxqaklfpxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHJkcHRqZWdqeHFha2xmcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjcxMTcsImV4cCI6MjA2MjIwMzExN30.-eNAPw6hGKrSLtYmFSxxneOtEKrAyH6OUi_pKZmg-zs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const registrationForm = document.getElementById("registrationForm");
const gestoreForm = document.getElementById("gestoreForm");

document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.getElementById("role");
  const submitBtn = document.getElementById("submitBtn");

  if (roleSelect && submitBtn) {
    roleSelect.addEventListener("change", () => {
      submitBtn.textContent = roleSelect.value === "gestore" ? "Continua" : "Registrati";
    });
  }
});

// PRIMA PAGINA – registrazione base
if (registrationForm) {
  registrationForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const password = document.getElementById("password").value.trim();
    const isValidPassword = /^(?=.*[A-Z]).{6,}$/.test(password);

    if (!isValidPassword) {
      alert("La password deve contenere almeno 6 caratteri e una lettera maiuscola.");
      return;
    }

    const user = {
      username: document.getElementById("username").value,
      password: password,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      phone: document.getElementById("phone").value,
      tipo_utente: document.getElementById("role").value,
    };

    localStorage.setItem("userTemp", JSON.stringify(user));

    if (user.tipo_utente === "gestore") {
      window.location.href = "register-gestore.html";
    } else {
      saveUser(user);
    }
  });
}

// SECONDA PAGINA – completamento gestore
if (gestoreForm) {
  gestoreForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    /*const datiBase = JSON.parse(localStorage.getItem("userTemp"));
    if (!datiBase) {
      alert("Errore: dati di base non trovati.");
      return;
    }

    const user = {
      ...datiBase,
      nome: document.getElementById("nome").value,
      cognome: document.getElementById("cognome").value,
      azienda: document.getElementById("azienda").value,
      piva: document.getElementById("piva").value,
    };

    localStorage.removeItem("userTemp");
    saveUser(user);
    mostraPopupDecisione();
  });
}

 SALVATAGGIO SU SUPABASE + POPUP
async function saveUser(user) {
  try {
    const { error } = await supabase.from("registrazione").insert([user]);
    if (error) {
      alert("Errore nella registrazione: " + error.message);
      return;
    }

    localStorage.setItem("user", JSON.stringify(user)); // Salva profilo utente

    mostraPopupDecisione(); // Mostra popup finale
  } catch (err) {
    console.error(err);
    alert("Errore imprevisto nella registrazione.");
  }
}

// MOSTRA IL POPUP DI SCELTA
function mostraPopupDecisione() {
  const overlay = document.createElement('div');
  overlay.classList.add('overlay-popup');

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
    window.location.href = "profilo-gestore.html";
  });

  document.getElementById("btnEsplora").addEventListener("click", () => {
    overlay.remove();
    window.location.href = "index.html";
  });
}

// MOSTRA/NASCONDI PASSWORD
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
  });
}
*/


/* CONFIGURAZIONE SUPABASE
const supabaseUrl = 'https://sbxrdptjegjxqaklfpxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHJkcHRqZWdqeHFha2xmcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjcxMTcsImV4cCI6MjA2MjIwMzExN30.-eNAPw6hGKrSLtYmFSxxneOtEKrAyH6OUi_pKZmg-zs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);
*/

const registrationForm = document.getElementById("registrationForm");
const gestoreForm = document.getElementById("gestoreForm");

document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.getElementById("role");
  const submitBtn = document.getElementById("submitBtn");

  if (roleSelect && submitBtn) {
    roleSelect.addEventListener("change", () => {
      submitBtn.textContent = roleSelect.value === "gestore" ? "Continua" : "Registrati";
    });
  }
});

// PRIMA PAGINA – registrazione base
if (registrationForm) {
  registrationForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const password = document.getElementById("password").value.trim();
    const isValidPassword = /^(?=.*[A-Z]).{6,}$/.test(password);

    if (!isValidPassword) {
      alert("La password deve contenere almeno 6 caratteri e una lettera maiuscola.");
      return;
    }

    const user = {
      username: document.getElementById("username").value,
      password: password,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      phone: document.getElementById("phone").value,
      tipo_utente: document.getElementById("role").value,
    };

    localStorage.setItem("userTemp", JSON.stringify(user));

    if (user.tipo_utente === "gestore") {
      window.location.href = "register-gestore.html";
    } else {
      saveUser(user); // Funzione simulata
    }
  });
}

// SECONDA PAGINA – completamento gestore
if (gestoreForm) {
  gestoreForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const datiBase = JSON.parse(localStorage.getItem("userTemp"));
    if (!datiBase) {
      alert("Errore: dati di base non trovati.");
      return;
    }

    const user = {
      ...datiBase,
      nome: document.getElementById("nome").value,
      cognome: document.getElementById("cognome").value,
      azienda: document.getElementById("azienda").value,
      piva: document.getElementById("piva").value,
    };

    localStorage.removeItem("userTemp");
    saveUser(user); // Simulazione locale
  });
}

// SIMULAZIONE "SALVATAGGIO" LOCALE (senza DB)
function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user)); // Salva profilo localmente
  mostraPopupDecisione(); // Mostra scelta dopo registrazione
}

// MOSTRA IL POPUP DI SCELTA
function mostraPopupDecisione() {
  const overlay = document.createElement('div');
  overlay.classList.add('overlay-popup');

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
    window.location.href = "profilo-gestore.html";
  });

  document.getElementById("btnEsplora").addEventListener("click", () => {
    overlay.remove();
    window.location.href = "index.html";
  });
}

// MOSTRA/NASCONDI PASSWORD
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
  });
}
