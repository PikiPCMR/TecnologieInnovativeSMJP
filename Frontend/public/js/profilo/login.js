/**
 * @file Gestisce la logica di login, il recupero password e la gestione dei ruoli utente.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from '/js/collegamentoDb.js';

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        await login();
    });

    // --- GESTIONE RESET PASSWORD ---
    /** @type {HTMLElement} openBtn - Pulsante per aprire il popup di reset password. */
    const openBtn = document.getElementById("openResetPopup");
    /** @type {HTMLElement} modal - Il modal per il reset password. */
    const modal = document.getElementById("resetPasswordModal");
    /** @type {HTMLElement} closeBtn - Pulsante per chiudere il modal di reset password. */
    const closeBtn = document.getElementById("closeResetModal");
    /** @type {HTMLElement} sendBtn - Pulsante per inviare il link di reset password. */
    const sendBtn = document.getElementById("sendResetLink");
    /** @type {HTMLInputElement} emailInput - Campo di input per l'email di reset. */
    const emailInput = document.getElementById("resetEmail");
    /** @type {HTMLElement} errorBox - Elemento per mostrare i messaggi di errore. */
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
                redirectTo: 'https://tecnologieinnovativesmjp.onrender.com/html/profilo/reset_password.html'
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

/**
 * Gestisce la logica di login dell'utente.
 * Invia le credenziali al database per la verifica e reindirizza l'utente in base al suo ruolo.
 * @async
 */
async function login() {
    /** @type {string} id - L'ID utente inserito nel campo di input. */
    const id = document.getElementById('id').value.trim();
    /** @type {string} password - La password inserita nel campo di input. */
    const password = document.getElementById('password').value.trim();

    // Chiamiamo la funzione di database 'check_password'
    const { data: is_correct, error } = await supabase.rpc('check_password', {
        p_id: id,
        p_password: password
    });

    if (error) {
        alert('Errore nel login: ' + error.message);
        console.error(error);
        return;
    }

    // Se la password è corretta (is_correct === true), procedi con il login
    if (is_correct) {
        // Aggiungi qui la logica per recuperare i dati dell'utente e reindirizzare
        const { data: userData, error: userError } = await supabase
            .from('registrazione')
            .select('*')
            .eq('id', id);

        if (userError || userData.length === 0) {
            alert('Errore nel recupero dei dati utente.');
            console.error(userError);
            return;
        }

        const user = userData[0];
        console.log("Utente loggato:", user);
        console.log("Tipo utente:", user.tipo_utente);
        // ... il resto della tua logica di reindirizzamento rimane invariata
        localStorage.setItem('user', JSON.stringify(user));
        if (user.tipo_utente === "gestore") {
            window.location.href = "/html/dashboard_gestore.html";
        } else if (user.tipo_utente === "cliente") {
            window.location.href = "/html/index.html";
        } else {
            alert("Tipo utente non riconosciuto: " + user.tipo_utente);
            window.location.href = "/html/index.html";
        }
    } else {
        // Se la funzione restituisce false, le credenziali sono errate
        alert('Credenziali errate');
    }
}

/** @type {HTMLElement} togglePassword - Pulsante per mostrare/nascondere la password. */
const togglePassword = document.getElementById("togglePassword");
/** @type {HTMLInputElement} passwordInput - Campo di input per la password. */
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        const isVisible = passwordInput.type === "text";
        passwordInput.type = isVisible ? "password" : "text";
        togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
    });
}

/**
 * Funzione per reindirizzare l'utente in base al suo ruolo, impedendo l'accesso a pagine non autorizzate.
 */
export function requireUserRole() {
    const user = JSON.parse(localStorage.getItem('user'));
    const path = window.location.pathname;

    // Pagine consentite per gestore
    const gestorePages = [
        "/html/dashboard_gestore.html",
        "/html/contenuti_gestore/modifica_spazio.html",
        "/html/contenuti_gestore/crea_nuovo_spazio.html",
        "/html/contenuti_gestore/internal_dashboard.html"
    ];

    // Pagine consentite per cliente
    const clientePages = [
        "/html/prenota_spazio.html",
        "/html/prenotazione/prenotazione.html",
        "/html/ricerca_spazio/spazio.html",
        "/html/ricerca_spazio/cerca_spazi.html",
        "/html/index.html",
        "html/prenotazione/pagamento.html",
        "html/prenotazione/pagamento_riuscito.html",
        "html/prenotazione/gestione_prenotazioni.html"
    ];

    if (user.tipo_utente === "gestore" && !gestorePages.includes(path)) {
        window.location.href = "/html/dashboard_gestore.html";
        return;
    }

    if (user.tipo_utente === "cliente" && !clientePages.includes(path)) {
        window.location.href = "/html/index.html";
        return;
    }
}

window.requireUserRole = requireUserRole;