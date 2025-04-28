const app = require('./app');
const { PORT } = require('./config/serverConfig');

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
