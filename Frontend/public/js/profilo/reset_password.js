/**
 * @file Script per la gestione del reset della password tramite link di Supabase.
 * Permette all'utente di impostare una nuova password dopo aver cliccato sul link di reset inviato via email.
 * Aggiorna la password sia nel sistema di autenticazione di Supabase che nella tabella 'registrazione'.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from '/js/collegamentoDb.js';

(async () => {
    /** @type {HTMLInputElement} newPassword - Campo di input per la nuova password. */
    const newPassword = document.getElementById("newPassword");
    /** @type {HTMLInputElement} confirmPassword - Campo di input per la conferma della password. */
    const confirmPassword = document.getElementById("confirmPassword");
    /** @type {HTMLElement} errorBox - Elemento per visualizzare i messaggi di errore. */
    const errorBox = document.getElementById("errorMessage");
    /** @type {HTMLFormElement} resetForm - Il form per il reset della password. */
    const resetForm = document.getElementById("resetForm");
    /** @type {HTMLElement} waitMessage - Messaggio di attesa per il caricamento della sessione. */
    const waitMessage = document.getElementById("waitMessage");

    /** @type {object|null} session - L'oggetto sessione utente di Supabase. */
    let session = null;

    // Ottiene la sessione utente corrente.
    const { data, error: sessionError } = await supabase.auth.getSession();
    session = data.session;

    if (session && session.user) {
        waitMessage.style.display = "none";
        resetForm.style.display = "block";
    } else {
        waitMessage.innerHTML = "<p>Link non valido o già usato.</p><a href='/html/profilo/login.html'>Torna al login</a>";
    }

    /**
     * Gestisce l'evento di click sul pulsante "Annulla".
     * Reindirizza l'utente alla pagina principale.
     */
    document.getElementById("cancelBtn").addEventListener("click", () => {
        window.location.href = "/";
    });

    /**
     * Gestisce l'evento di click sul pulsante "Salva".
     * Esegue la validazione delle password e l'aggiornamento.
     */
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

        // Aggiorna la password nel sistema di autenticazione di Supabase.
        const { error } = await supabase.auth.updateUser({
            password: newPass
        });

        if (error) {
            errorBox.textContent = "Errore nel reset: " + error.message;
            return;
        }

        // Aggiorna anche la password nella tabella "registrazione" del database.
        const email = session.user.email;
        const { error: updateDbError } = await supabase
            .from('registrazione')
            .update({ password: newPass })
            .eq('email', email);

        if (updateDbError) {
            console.error("Errore aggiornamento tabella registrazione:", updateDbError.message);
        }

        alert("Password aggiornata con successo!");
        window.location.href = "/html/profilo/login.html";
    });

    /**
     * Listener per i cambiamenti di stato dell'autenticazione.
     * Utile per il debug.
     */
    supabase.auth.onAuthStateChange((event, session) => {
        console.log("Cambio stato auth:", event);
    });
})();

/**
 * Funzione per mostrare o nascondere la password in un campo di input.
 * @param {string} inputId - L'ID del campo di input.
 * @param {HTMLButtonElement} button - Il pulsante "Mostra/Nascondi" che ha attivato la funzione.
 */
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Nascondi" : "Mostra";
}

window.togglePasswordVisibility = togglePasswordVisibility;