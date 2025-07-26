const supabaseUrl = 'https://sbxrdptjegjxqaklfpxq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHJkcHRqZWdqeHFha2xmcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjcxMTcsImV4cCI6MjA2MjIwMzExN30.-eNAPw6hGKrSLtYmFSxxneOtEKrAyH6OUi_pKZmg-zs';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    async function login() {
      const id = document.getElementById('id').value.trim();
      const password = document.getElementById('password').value.trim();

      const { data, error } = await supabase
        .from('registrazione')
        .select('*')
        .eq('id', id)
        .eq('password', password);

      if (error) {
        alert('Errore nel login: ' + error.message);
        console.error(error);
        return;
      }

      if (data.length === 0) {
        alert('Credenziali errate');
      } else {
        alert('Accesso effettuato con successo!');
        localStorage.setItem('user', JSON.stringify(data[0]));
        window.location.href = 'index.html';
      }
    }

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    togglePassword.textContent = isVisible ? "Mostra" : "Nascondi";
  });
}


