const express = require('express');
const path = require('path');
const homeRoutes = require('./routes/homeRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Configurazione MIME types per evitare blocchi
app.use((req, res, next) => {
    // Imposta MIME types corretti per file JavaScript
    if (req.path.endsWith('.js')) {
        res.type('application/javascript');
    }
    // Imposta MIME types corretti per file CSS
    else if (req.path.endsWith('.css')) {
        res.type('text/css');
    }
    // Imposta MIME types corretti per file HTML
    else if (req.path.endsWith('.html')) {
        res.type('text/html');
    }
    next();
});

// Middleware integrati
app.use(express.json()); // Body parser per JSON
app.use(express.urlencoded({ extended: true })); // Body parser per form data

// Servire file statici con configurazione MIME type
app.use(express.static(path.join(__dirname, '..', 'Frontend', 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// Routes principali
app.use('/', homeRoutes);

// Middleware di gestione errori
app.use(errorHandler);

module.exports = app;
