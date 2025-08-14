// 1) Inserisci la tua Publishable Key di Stripe (TEST o LIVE a seconda dell'ambiente)
const stripe = Stripe("pk_test_51RvLUiJdCSwFSGzc72wVxTayWpUec8aCIDV5WzHbh1UyZ7lmzVT4nOVfaQ90MlHK6zvwwkrvLFZhOqUO5EoMh3HF00khxXbetg");

let elements; // istanza Elements condivisa
const submitBtn = document.getElementById('submit');
const errorBox = document.getElementById('error-message');

// 2) All'avvio, chiedi al backend di creare un PaymentIntent e restituisci il clientSecret
document.addEventListener('DOMContentLoaded', async () => {
    try {
    // Qui puoi inviare dati dell’ordine: es. amount, currency, items, customerId, ecc.
    const resp = await fetch('http://localhost:3000/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        // esempio: amount e currency sono decisi sul server, non fidarti del client!
        // amount: 2000, currency: 'eur'
        })
    });
    const { clientSecret, error } = await resp.json();
    if (!resp.ok || !clientSecret) throw new Error(error || 'Impossibile inizializzare il pagamento');

    // 3) Inizializza Elements con il clientSecret del PaymentIntent
    const appearance = { theme: 'stripe' }; // aspetto base; personalizzabile
    elements = stripe.elements({ clientSecret, appearance });

    // 4) Crea e monta il Payment Element (gestisce carta, 3DS ecc.)
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
        const queryString = window.location.search;

        const params = new URLSearchParams(queryString);
        const name = params.get('nome') || '';
        const email = params.get('email') || '';

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
            // Inserisci la tua pagina di successo pubblica
            return_url: `${window.location.origin}/Frontend/public/html/pagamento_riuscito.html`,

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