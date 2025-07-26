function caricaDatiGestore(){
  const user = JSON.parse(localStorage.getItem('user'));
  if(!user || user.tipo_utente !== 'gestore'){
    alert('Accesso non autorizzato.');
    location = 'index.html';
    return;
  }
  document.getElementById('avatar').src = user.avatarUrl || 'placeholder-avatar.png';
  document.getElementById('nomeCognome').textContent = user.nome + ' ' + user.cognome;
  document.getElementById('azienda').textContent = user.azienda || '';
  document.getElementById('rating').textContent = user.rating || '0';
  document.getElementById('reviews').textContent = user.reviewsCount + ' recensioni';
  navigate('ordini');
}

function navigate(sezione){
  const cont = document.getElementById('section-content');
  if(sezione==='ordini'){
    cont.innerHTML = '<h2>I miei ordini</h2><p>Qui vedrai lo storico degli ordini.</p>';
  }else if(sezione==='sicurezza'){
    cont.innerHTML = '<h2>Accesso & Sicurezza</h2><p>Modifica email, password, telefono.</p>';
  }else if(sezione==='pagamenti'){
    cont.innerHTML = '<h2>Pagamenti</h2><p>Gestisci i metodi di pagamento.</p>';
  }else if(sezione==='indirizzi'){
    cont.innerHTML = '<h2>Indirizzi</h2><p>Indirizzi di consegna e fatturazione.</p>';
  }else if(sezione==='comunicazioni'){
    cont.innerHTML = '<h2>Comunicazioni</h2><p>Messaggi dal supporto o clienti.</p>';
  }
}

function modificaProfilo(){
  alert('Funzione modifica profilo non ancora implementata.');
}
