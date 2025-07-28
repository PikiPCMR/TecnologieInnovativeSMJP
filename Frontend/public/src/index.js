// Stato dell'applicazione
let isLoggedIn = false;
let user = null;

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Toggle Profile Menu
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
}

// Chiudi dropdown quando si clicca fuori
document.addEventListener('click', function (event) {
    const profileSection = document.querySelector('.profile-section');
    const dropdown = document.getElementById('profileDropdown');

    if (!profileSection.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// tenere a mente toggle profilemenu molto utile per il login e logout
function handleLogin() {
    if (!isLoggedIn) {
        // Simula il login
        isLoggedIn = true;
        user = { name: 'Mario Rossi', email: 'mario.rossi@email.com' };
        updateProfileMenu();
        alert('Login effettuato con successo!');
    }
    toggleProfileMenu();
}

function accedi() {
    window.location.href = 'login.html';
}

function registrati() {
    window.location.href = 'register.html';
}

function handleProfile() {
    alert('Apertura gestione profilo per: ' + user.name);
    toggleProfileMenu();
}

function handleLogout() {
    isLoggedIn = false;
    user = null;
    updateProfileMenu();
    alert('Logout effettuato con successo!');
    toggleProfileMenu();
}

function updateProfileMenu() {
    const loginText = document.getElementById('loginText');
    const profileItem = document.getElementById('profileItem');
    const logoutItem = document.getElementById('logoutItem');

    if (isLoggedIn) {
        loginText.textContent = 'Registrati';
        profileItem.style.display = 'flex';
        logoutItem.style.display = 'flex';
    } else {
        loginText.textContent = 'Accedi';
        profileItem.style.display = 'none';
        logoutItem.style.display = 'none';
    }
}

// Navigazione Sidebar
function navigateTo(page) {
    alert('Navigazione verso: ' + page);
    closeSidebar();
}

// Azioni delle card
function searchSpaces() {
    alert('Apertura pagina ricerca spazi di coworking...');
}

function quickBooking() {
    if (!isLoggedIn) {
        alert('Effettua il login per prenotare uno spazio');
        return;
    }
    alert('Apertura prenotazione rapida...');
}

function viewBookings() {
    if (!isLoggedIn) {
        alert('Effettua il login per visualizzare le tue prenotazioni');
        return;
    }
    alert('Apertura gestione prenotazioni...');
}

//Aspetta che la pagina sia completamente caricata
document.addEventListener('DOMContentLoaded', function () {
    // Il tuo codice JavaScript qui
    updateProfileMenu();
});//Aspetta che la pagina sia completamente caricata
/*function checkLogin() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.getElementById('welcome').textContent =
      'Benvenuto, ' + user.id;
  }
}
  */
function checkLogin() {
    const user = JSON.parse(localStorage.getItem('user'));

    const loginItem = document.querySelector('.dropdown-item[onclick="accedi()"]');
    const registerItem = document.querySelector('.dropdown-item[onclick="registrati()"]');
    const profileItem = document.getElementById('profileItem');
    const logoutItem = document.getElementById('logoutItem');

    if (user) {
        loginItem.style.display = 'none';
        registerItem.style.display = 'none';
        logoutItem.style.display = 'block';

        // Mostra il profilo solo se esiste ed è gestore/cliente
        if (user.tipo_utente === "gestore" || user.tipo_utente === "cliente") {
            profileItem.style.display = 'block';
        } else {
            profileItem.style.display = 'none';
        }
    } else {
        loginItem.style.display = 'block';
        registerItem.style.display = 'block';
        profileItem.style.display = 'none';
        logoutItem.style.display = 'none';
    }
}

function handleProfile() {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.tipo_utente) {
        alert("Errore: utente non identificato.");
        return;
    }

    if (user.tipo_utente === "cliente") {
        window.location.href = 'profilo-cliente.html';
    } else if (user.tipo_utente === "gestore") {
        window.location.href = 'profilo-gestore.html';
    } else {
        alert("Tipo utente non valido.");
    }
}


function handleLogout() {
    localStorage.removeItem('user');
    checkLogin(); // ripristina visibilità dei bottoni
    window.location.href = 'index.html'; // reindirizza alla home
}