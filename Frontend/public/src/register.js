/*document.addEventListener("DOMContentLoaded", function () {
  const supabaseUrl = 'https://sbxrdptjegjxqaklfpxq.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHJkcHRqZWdqeHFha2xmcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjcxMTcsImV4cCI6MjA2MjIwMzExN30.-eNAPw6hGKrSLtYmFSxxneOtEKrAyH6OUi_pKZmg-zs'; // Usa la tua anon key
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);*/

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
        role: document.getElementById("role").value,
      };

      localStorage.setItem("userTemp", JSON.stringify(user));

      if (user.role === "gestore") {
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
      saveUser(user);
    });
  }

  // INSERIMENTO IN SUPABASE
  async function saveUser(user) {
    /*const { error } = await supabase.from("registrazione").insert([user]);
    if (error) {
      alert("Errore nella registrazione: " + error.message);
      return;
    }*/

    alert("Registrazione completata con successo!");
    window.location.href = "login.html";
  }

// MOSTRA/NASCONDI PASSWORD AL CLIC
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

if (passwordInput && togglePassword) {
  togglePassword.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
  });
}



//});
