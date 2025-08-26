 import { supabase } from '/js/collegamentoDb.js';

  (async () => {
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const errorBox = document.getElementById("errorMessage");
    const resetForm = document.getElementById("resetForm");
    const waitMessage = document.getElementById("waitMessage");

    let session = null;

    const { data, error: sessionError } = await supabase.auth.getSession();
    session = data.session;

    if (session && session.user) {
      waitMessage.style.display = "none";
      resetForm.style.display = "block";
    } else {
      waitMessage.innerHTML = "<p>Link non valido o già usato.</p><a href='/html/profilo/login.html'>Torna al login</a>";
    }

    document.getElementById("cancelBtn").addEventListener("click", () => {
      window.location.href = "/";
    });

    document.getElementById("saveBtn").addEventListener("click", async () => {
      errorBox.textContent = "";
      const newPass = newPassword.value.trim();
      const confirmPass = confirmPassword.value.trim();

      if (!newPass || !confirmPass) {
        errorBox.textContent = "Entrambi i campi sono obbligatori.";
        return;
      }

      if (newPass !== confirmPass) {
        errorBox.textContent = "Le password non corrispondono.";
        return;
      }

      const isValid = /^(?=.*[A-Z]).{6,}$/.test(newPass);
      if (!isValid) {
        errorBox.textContent = "La password deve contenere almeno 6 caratteri e una lettera maiuscola.";
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPass
      });

      if (error) {
        errorBox.textContent = "Errore nel reset: " + error.message;
        return;
      }

      // Aggiorna anche la tabella "registrazione"
      const email = session.user.email;

      const { error: updateDbError } = await supabase
        .from('registrazione')
        .update({ password: newPass })
        .eq('email', email);

      if (updateDbError) {
        console.error("Errore aggiornamento tabella registrazione:", updateDbError.message);
      }

      alert("Password aggiornata con successo!");
      window.location.href = "html/profilo/login.html";
    });

    supabase.auth.onAuthStateChange((event, session) => {
      console.log("Cambio stato auth:", event);
    });
  })();

  function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  button.textContent = isHidden ? "Nascondi" : "Mostra";
}

window.togglePasswordVisibility = togglePasswordVisibility;