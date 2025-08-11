const queryString = window.location.search;

const params = new URLSearchParams(queryString);

const spazioId = params.get('id');
const giorno = params.get('giorno');
const fascia = params.get('fascia');

console.log('Spazio ID:', spazioId);
console.log('Giorno:', giorno);
console.log('Fascia:', fascia);

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('spazio-id').textContent = spazioId;
  document.getElementById('giorno').textContent = giorno;
  document.getElementById('fascia').textContent = fascia;
});