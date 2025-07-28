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


registrationForm?.addEventListener("submit", function (e) {
  e.preventDefault();

  const tipoUtente = document.getElementById("role").value;
  const password = document.getElementById("password").value.trim();

  // Validazione password
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

  const user = {
    username: document.getElementById("username").value.trim(),
    password: password,
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    tipo_utente: tipoUtente,
    nome: document.getElementById("nome").value.trim(),
    cognome: document.getElementById("cognome").value.trim(),
    azienda: document.getElementById("azienda").value.trim(),
    piva: document.getElementById("piva").value.trim()
  };

  saveUser(user);
});

// Simula il salvataggio e mostra popup
function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
  mostraPopupDecisione();
}

// Mostra popup di conferma
function mostraPopupDecisione() {
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
    window.location.href = "profilo-gestore.html";
  });

  document.getElementById("btnEsplora").addEventListener("click", () => {
    overlay.remove();
    window.location.href = "index.html";
  });
}

// Mostra/Nascondi password
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
  });
}
