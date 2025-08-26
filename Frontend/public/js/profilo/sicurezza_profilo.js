import { supabase } from '/js/collegamentoDb.js';

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
  window.location.href = '../html/profilo/login.html';

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
      window.location.href = "/html/dashboard_gestore.html";
    } else {
      window.location.href = "/html/index.html";
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
        redirectTo: "/html/reset_password.html"
      });
      if (error) {
        alert("Errore durante l'invio: " + error.message);
      } else {
        alert("Email inviata con successo!");

        // 🔐 Disconnessione + redirect anche dopo richiesta reset
        await supabase.auth.signOut();
        localStorage.removeItem("user");
        window.location.href = "/html/profilo/login.html";
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