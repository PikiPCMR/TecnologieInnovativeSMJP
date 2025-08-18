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

    res.json({ clientSecret: paymentIntent.client_secret });
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
      // Qui puoi segnare l’ordine come pagato nel tuo DB
      break;
    default:
      console.log(`Evento non gestito: ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(PORT, () => console.log(`Server in ascolto su http://localhost:${PORT}`));



// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});