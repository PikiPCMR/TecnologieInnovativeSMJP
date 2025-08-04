import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import homeRoutes from './routes/homeRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Calcolo __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione MIME types per evitare blocchi
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.type('text/css');
  } else if (req.path.endsWith('.html')) {
    res.type('text/html');
  }
  next();
});

// Middleware integrati
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servire file statici
app.use(
  express.static(path.join(__dirname, '..', 'Frontend', 'public'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    },
  })
);

// Routes principali
app.use('/', homeRoutes);

// Middleware errori
app.use(errorHandler);

// Esporta app
export default app;
