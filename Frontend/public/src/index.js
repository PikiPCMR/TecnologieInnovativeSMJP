import { supabase } from './collegamentoDb.js';

async function testDbConnection() {
  const { data, error } = await supabase.from('registrazione').select('id, nome, cognome').limit(1);
  if (error) console.error("❌ Errore Supabase:", error);
  else console.log("✅ Connessione OK. Primo utente:", data[0]);
}
window.testDbConnection = testDbConnection;

// Stato app
let isLoggedIn = false;
let user = null;

// === FUNZIONI GLOBALI ===
function toggleProfileMenu() {
  document.getElementById('profileDropdown').classList.toggle('active');
}
window.toggleProfileMenu = toggleProfileMenu;

function accedi() {
  window.location.href = 'login.html';
}
window.accedi = accedi;

function registrati() {
  window.location.href = 'register.html';
}
window.registrati = registrati;

function handleProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.tipo_utente) {
    alert("Errore: utente non identificato.");
    return;
  }
  window.location.href = 'profilo.html';
  toggleProfileMenu();
}
window.handleProfile = handleProfile;

function handleLogout() {
  localStorage.removeItem('user');
  checkLogin();
  window.location.href = 'index.html';
}
window.handleLogout = handleLogout;

function searchSpaces() {
  alert('Apertura pagina ricerca spazi...');
}
window.searchSpaces = searchSpaces;

function quickBooking() {
  if (!isLoggedIn) {
    alert('Effettua il login per prenotare');
    return;
  }
  alert('Prenotazione rapida...');
}
window.quickBooking = quickBooking;

function viewBookings() {
  if (!isLoggedIn) {
    alert('Effettua il login per visualizzare prenotazioni');
    return;
  }
  alert('Gestione prenotazioni...');
}
window.viewBookings = viewBookings;

// === GESTIONE MENU PROFILO ===

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
  } else {
    isLoggedIn = false;
    user = null;
    loginItem.style.display = 'block';
    registerItem.style.display = 'block';
    profileItem.style.display = 'none';
    logoutItem.style.display = 'none';
  }
}
window.checkLogin = checkLogin;

// === AVVIO PAGINA ===
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();          // Prima controlli se l’utente è loggato
  updateProfileMenu();   // Poi aggiorni il menu in base allo stato
  testDbConnection();    // (solo per debug)
});