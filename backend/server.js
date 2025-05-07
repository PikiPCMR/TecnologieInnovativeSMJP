const app = require('./app');
const { PORT } = require('./config/serverConfig');
require('../database/config'); // Importa config.js per stabilire la connessione al database

// Avvia il server
app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
