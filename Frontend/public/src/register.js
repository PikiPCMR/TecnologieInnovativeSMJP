document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registrationForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const passwordInput = document.getElementById("password");
    const password = passwordInput.value.trim();

    const isValidPassword = /^(?=.*[A-Z]).{6,}$/.test(password);

    if (!isValidPassword) {
      alert("La password deve contenere almeno 6 caratteri e una lettera maiuscola.");
      passwordInput.focus();
      return; // blocca l’invio
    }

    const user = {
      username: document.getElementById("username").value,
      password: password,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      phone: document.getElementById("phone").value,
      role: document.getElementById("role").value,
    };

    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "profilo.html";
  });
});
