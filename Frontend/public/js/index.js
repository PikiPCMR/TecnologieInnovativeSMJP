/**
 * @file Gestisce le funzionalità globali dell'applicazione, inclusa la gestione dello stato di
 * autenticazione dell'utente, la navigazione, il menu del profilo e i reindirizzamenti automatici
 * in base al tipo di utente (gestore o cliente).
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from './collegamentoDb.js';

/**
 * Funzione di test per verificare la connessione al database Supabase.
 * Seleziona il primo utente dalla tabella 'registrazione' e registra un messaggio di stato.
 * @async
 */
async function testDbConnection() {
    const { data, error } = await supabase.from('registrazione').select('id, nome, cognome').limit(1);
    if (error) {
        console.error("❌ Errore Supabase:", error);
    } else {
        console.log("✅ Connessione OK. Primo utente:", data[0]);
    }
}
window.testDbConnection = testDbConnection;

// Stato globale dell'applicazione
/** @type {boolean} isLoggedIn - Indica se l'utente è autenticato. */
let isLoggedIn = false;
/** @type {object|null} user - L'oggetto utente loggato, contenente i dati del profilo. */
let user = null;

// === FUNZIONI GLOBALI ===

/**
 * Alterna la visibilità del menu a tendina del profilo utente.
 */
function toggleProfileMenu() {
    document.getElementById('profileDropdown').classList.toggle('active');
}
window.toggleProfileMenu = toggleProfileMenu;

/**
 * Reindirizza l'utente alla pagina di login.
 */
function accedi() {
    window.location.href = '/html/profilo/login.html';
}
window.accedi = accedi;

/**
 * Reindirizza l'utente alla pagina di registrazione.
 */
function registrati() {
    window.location.href = '/html/profilo/register.html';
}
window.registrati = registrati;

/**
 * Gestisce la navigazione alla pagina del profilo in base al tipo di utente.
 * Mostra un alert se l'utente non è identificato correttamente.
 */
function handleProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.tipo_utente) {
        alert("Errore: utente non identificato.");
        return;
    }
    window.location.href = '/html/profilo/profilo.html';
    toggleProfileMenu();
}
window.handleProfile = handleProfile;

/**
 * Gestisce il logout dell'utente.
 * Rimuove i dati utente dal localStorage, aggiorna lo stato di login e reindirizza alla homepage.
 */
function handleLogout() {
    localStorage.removeItem('user');
    checkLogin();
    window.location.href = '/';
}
window.handleLogout = handleLogout;

/**
 * Reindirizza l'utente alla pagina di ricerca degli spazi.
 */
function searchSpaces() {
    window.location.href = '/html/ricerca_spazio/cerca_spazi.html';
}
window.searchSpaces = searchSpaces;

/**
 * Reindirizza l'utente alla pagina di visualizzazione delle prenotazioni.
 * Se l'utente non è loggato, mostra un alert.
 */
function viewBookings() {
    if (!isLoggedIn) {
        alert('Effettua il login per visualizzare prenotazioni');
        return;
    }
    window.location.href = '/html/prenotazione/gestione_prenotazioni.html';
}
window.viewBookings = viewBookings;

// === GESTIONE MENU PROFILO ===

/**
 * Aggiorna gli elementi del menu del profilo (Accedi, Registrati, Profilo, Logout)
 * in base allo stato di autenticazione dell'utente.
 */
function updateProfileMenu() {
    const loginText = document.getElementById('loginText');
    const profileItem = document.getElementById('profileItem');
    const logoutItem = document.getElementById('logoutItem');

    const userData = JSON.parse(localStorage.getItem('user'));
    isLoggedIn = !!userData; // forza lo stato booleano

    if (isLoggedIn) {
        user = userData;
        loginText.textContent = 'Registrati';
        profileItem.style.display = 'flex';
        logoutItem.style.display = 'flex';
    } else {
        user = null;
        loginText.textContent = '🔑 Accedi';
        profileItem.style.display = 'none';
        logoutItem.style.display = 'none';
    }
}
window.updateProfileMenu = updateProfileMenu;

/**
 * Controlla lo stato di login dell'utente all'avvio della pagina.
 * Gestisce la visibilità dei link del menu e i reindirizzamenti automatici.
 */
function checkLogin() {
    const userData = JSON.parse(localStorage.getItem('user'));
    const loginItem = document.querySelector('.dropdown-item[onclick="accedi()"]');
    const registerItem = document.querySelector('.dropdown-item[onclick="registrati()"]');
    const profileItem = document.getElementById('profileItem');
    const logoutItem = document.getElementById('logoutItem');

    if (userData) {
        isLoggedIn = true;
        user = userData;
        loginItem.style.display = 'none';
        registerItem.style.display = 'none';
        logoutItem.style.display = 'block';

        if (user.tipo_utente === "gestore" || user.tipo_utente === "cliente") {
            profileItem.style.display = 'block';
        }

        // 🔄 Redirect automatico solo alla PRIMA visita di questa sessione
        if (!sessionStorage.getItem('redirectEffettuato')) {
            const currentPage = window.location.pathname;

            if (user.tipo_utente === "gestore" && !currentPage.includes("dashboard_gestore.html")) {
                sessionStorage.setItem('redirectEffettuato', 'true');
                window.location.href = "/html/dashboard_gestore.html";
                return; // stop ulteriore esecuzione
            }

            if (user.tipo_utente === "cliente" && currentPage.includes("dashboard_gestore.html")) {
                session.setItem('redirectEffettuato', 'true');
                window.location.href = "/html/index.html";
                return;
            }
        }

    } else {
        isLoggedIn = false;
        user = null;
        loginItem.style.display = 'block';
        registerItem.style.display = 'block';
        profileItem.style.display = 'none';
        logoutItem.style.display = 'none';

        // Puliamo il flag se non loggato
        sessionStorage.removeItem('redirectEffettuato');
    }
}
window.checkLogin = checkLogin;

// === AVVIO PAGINA ===
document.addEventListener("DOMContentLoaded", () => {
    checkLogin(); // Prima controlli se l’utente è loggato
    updateProfileMenu(); // Poi aggiorni il menu in base allo stato
    testDbConnection(); // (solo per debug)
});

/**
 * Esportazione delle funzioni per renderle disponibili in altri moduli.
 */
export {
    checkLogin,
    toggleProfileMenu,
    accedi,
    registrati,
    handleProfile,
    handleLogout
}