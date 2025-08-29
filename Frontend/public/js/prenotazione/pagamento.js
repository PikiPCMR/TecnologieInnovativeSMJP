/**
 * @file Gestisce il processo di pagamento tramite Stripe, creando un PaymentIntent
 * e confermando il pagamento per una nuova prenotazione.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

/**
 * L'istanza di Stripe creata con la Publishable Key.
 * @type {stripe.Stripe}
 */
const stripe = Stripe("pk_test_51RvLUiJdCSwFSGzc72wVxTayWpUec8aCIDV5WzHbh1UyZ7lmzVT4nOVfaQ90MlHK6zvwwkrvLFZhOqUO5EoMh3HF00khxXbetg");

/** @type {stripe.elements.Elements} */
let elements; // istanza Elements condivisa
const submitBtn = document.getElementById('submit');
const errorBox = document.getElementById('error-message');


const queryString = window.location.search;
const params = new URLSearchParams(queryString);

/** @type {string} name - Il nome dell'utente, recuperato dalla URL. */
const name = params.get('nome') || '';
/** @type {string} email - L'email dell'utente, recuperata dalla URL. */
const email = params.get('email') || '';
/** @type {string} prezzo - Il prezzo totale della prenotazione, recuperato dalla URL. */
const prezzo = params.get('prezzo') || '';
/** @type {string} spazioId - L'ID dello spazio di lavoro, recuperato dalla URL. */
const spazioId = params.get('id') || '';
/** @type {string} giorno - Il giorno della prenotazione, recuperato dalla URL. */
const giorno = params.get('giorno') || '';
/** @type {string} fascia - La fascia oraria della prenotazione, recuperata dalla URL. */
const fascia = params.get('orario') || '';
/** @type {string} id_gestore - L'ID del gestore dello spazio, recuperato dalla URL. */
const id_gestore = params.get('id_gestore') || '';
/** @type {string|null} idPagamento - L'ID del PaymentIntent creato da Stripe. */
let idPagamento = null;
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const importo = parseInt(prezzo) * 100; // in centesimi

        const resp = await fetch('https://tecnologieinnovativesmjp.onrender.com/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prezzo: importo,
                email: email
            })
        });
        const data = await resp.json();
        const clientSecret = data.clientSecret;
        idPagamento = data.paymentIntentId;
        if (!resp.ok || !clientSecret) throw new Error(error || 'Impossibile inizializzare il pagamento');

        const appearance = { theme: 'stripe' };
        elements = stripe.elements({ clientSecret, appearance });

        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
    } catch (err) {
        showError(err.message);
        submitBtn.disabled = true;
    }
});

document.getElementById('submit').addEventListener('click', async () => {
    clearError();
    setLoading(true);

    try {
        
        

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
            // Inserisci la tua pagina di successo pubblica
            return_url: `https://tecnologieinnovativesmjp.onrender.com/html/prenotazione/pagamento_riuscito.html?spazioId=${encodeURIComponent(spazioId)}&giorno=${encodeURIComponent(giorno)}&orario=${encodeURIComponent(fascia)}&prezzo=${encodeURIComponent(prezzo)}&id_gestore=${encodeURIComponent(id_gestore)}&id_pagamento=${encodeURIComponent(idPagamento)}`,

            payment_method_data: {
                billing_details: {
                name: name || undefined,
                email: email || undefined,
                }
            }
            }
            // Opzionale: redirect: 'if_required' per rimanere in-page quando 3DS non serve
        });

        if (error) {
            // Errori di validazione o di rete
            showError(error.message || 'Pagamento non riuscito.');
            setLoading(false);
        }
        // Se non c'è errore, Stripe farà redirect alla return_url (se 3DS richiesto) o tornerà qui con stato già confermato.
    } catch (err) {
        showError('Si è verificato un problema. Riprova.');
        console.error('Errore durante il pagamento:', err);
        setLoading(false);
    }
    
});

/**
 * Gestisce lo stato di caricamento dell'interfaccia utente.
 * Disabilita il pulsante di pagamento e aggiorna il testo.
 * @param {boolean} isLoading - `true` per mostrare lo stato di caricamento, `false` per nasconderlo.
 */
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    document.getElementById('button-text').textContent = isLoading ? 'Elaborazione…' : 'Paga ora';
}
/**
 * Mostra un messaggio di errore all'utente.
 * @param {string} message - Il messaggio di errore da visualizzare.
 */
function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
}
/**
 * Nasconde il messaggio di errore.
 */
function clearError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
}