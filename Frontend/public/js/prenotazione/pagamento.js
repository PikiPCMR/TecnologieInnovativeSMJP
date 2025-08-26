// 1) Inserisci la tua Publishable Key di Stripe (TEST o LIVE a seconda dell'ambiente)
const stripe = Stripe("pk_test_51RvLUiJdCSwFSGzc72wVxTayWpUec8aCIDV5WzHbh1UyZ7lmzVT4nOVfaQ90MlHK6zvwwkrvLFZhOqUO5EoMh3HF00khxXbetg");

let elements; // istanza Elements condivisa
const submitBtn = document.getElementById('submit');
const errorBox = document.getElementById('error-message');


const queryString = window.location.search;
const params = new URLSearchParams(queryString);

const name = params.get('nome') || '';
const email = params.get('email') || '';
const prezzo = params.get('prezzo') || '';
const spazioId = params.get('id') || '';
const giorno = params.get('giorno') || '';
const fascia = params.get('orario') || '';
const id_gestore = params.get('id_gestore') || '';
let idPagamento = null;
// 2) All'avvio, chiedi al backend di creare un PaymentIntent e restituisci il clientSecret
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const importo = parseInt(prezzo) * 100; // in centesimi

        const resp = await fetch('https://tecnologieinnovativesmjp.onrender.com/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prezzo: importo
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

// 5) Gestione submit: conferma pagamento (attiva 3DS se necessario) e reindirizza alla pagina di successo
document.getElementById('submit').addEventListener('click', async () => {
    clearError();
    setLoading(true);

    try {
        
        

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
            // Inserisci la tua pagina di successo pubblica
            return_url: `https://tecnologieinnovativesmjp.onrender.com/html/pagamento_riuscito.html?spazioId=${encodeURIComponent(spazioId)}&giorno=${encodeURIComponent(giorno)}&orario=${encodeURIComponent(fascia)}&prezzo=${encodeURIComponent(prezzo)}&id_gestore=${encodeURIComponent(id_gestore)}&id_pagamento=${encodeURIComponent(idPagamento)}`,

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

// Utils UI
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    document.getElementById('button-text').textContent = isLoading ? 'Elaborazione…' : 'Paga ora';
}
function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
}
function clearError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
}