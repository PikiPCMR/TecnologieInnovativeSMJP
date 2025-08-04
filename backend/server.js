import app from './app.js';
import { PORT } from './config/serverConfig.js';
import '../database/config.js'; // importa il file per eseguire la connessione

import adminRoutes from './routes/adminRoutes.js';
app.use('/admin', adminRoutes);

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
