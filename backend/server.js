import app from './app.js';
import { PORT } from './config/serverConfig.js';
import '../database/config.js'; // importa il file per eseguire la connessione



import adminRoutes from './routes/adminRoutes.js';
app.use('/admin', adminRoutes);

import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
app.use(cors())
dotenv.config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Per tutte le route JSON
app.use(express.json());

// 1) Endpoint per creare PaymentIntent e restituire il client_secret
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { prezzo } = req.body;
    if (!prezzo) {
      return res.status(400).json({ error: 'prezzo mancante' });
    }

    // Qui decidi importo e valuta in modo sicuro (mai fidarti di valori dal client!)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: prezzo,
      currency: 'eur',
      automatic_payment_methods: { enabled: true }, // abilita carte + altri metodi supportati
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error('Errore creazione PaymentIntent:', err);
    res.status(500).json({ error: 'Errore creazione PaymentIntent' });
  }
});

// 2) Endpoint webhook per ricevere conferma del pagamento
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Pagamento riuscito per', paymentIntent.id);
      
      break;
    default:
      console.log(`Evento non gestito: ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(PORT, () => console.log(`Server in ascolto su http://localhost:${PORT}`));

// 3) Endpoint per emettere un rimborso
app.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId mancante' });
    }

    // Recupera il PaymentIntent per ottenere il charge associato
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.charges?.data[0]) {
      return res.status(400).json({ error: 'Nessun charge trovato per questo PaymentIntent' });
    }

    const chargeId = paymentIntent.charges.data[0].id;

    // Crea il rimborso (se amount non è passato, rimborsa tutto)
    const refund = await stripe.refunds.create({
      charge: chargeId,
      ...(amount && { amount }), // opzionale: importo in centesimi
    });

    res.json({ refund });
  } catch (err) {
    console.error('Errore creazione rimborso:', err);
    res.status(500).json({ error: 'Errore creazione rimborso' });
  }
});

app.post("/charge-extra", async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    // Recupera il PaymentIntent originale
    const originalPI = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!originalPI.payment_method) {
      return res.status(400).json({ error: "Nessun metodo di pagamento associato" });
    }

    // Crea un nuovo PaymentIntent per l'importo aggiuntivo
    const extraPI = await stripe.paymentIntents.create({
      amount: amount, // in centesimi (es. 1000 = €10.00)
      currency: originalPI.currency,
      customer: originalPI.customer, // riusa il customer originale se esiste
      payment_method: originalPI.payment_method, // riusa la carta
      off_session: true, // perché non serve che il cliente sia presente
      confirm: true      // conferma subito l’addebito
    });

    res.json({ newPaymentIntent: extraPI });
  } catch (err) {
    console.error("Errore addebito extra:", err);
    res.status(500).json({ error: err.message });
  }
});


// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});