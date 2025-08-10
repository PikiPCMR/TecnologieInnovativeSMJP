import app from './app.js';
import { PORT } from './config/serverConfig.js';
import '../database/config.js'; // importa il file per eseguire la connessione

import cors from 'cors';

// Permetti richieste da qualsiasi origine (per sviluppo)
app.use(cors());

import { geocodificaSpazi } from './controllers/geocodificaController.js';

app.get('/api/geocode', geocodificaSpazi);


import adminRoutes from './routes/adminRoutes.js';
app.use('/admin', adminRoutes);

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
