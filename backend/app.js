const express = require('express');
const path = require('path');
const homeRoutes = require('./routes/homeRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware integrati
app.use(express.json()); // Body parser per JSON
app.use(express.urlencoded({ extended: true })); // Body parser per form data

// Servire file statici
app.use(express.static(path.join(__dirname, '..', 'Frontend', 'public')));

// Routes principali
app.use('/', homeRoutes);

// Middleware di gestione errori
app.use(errorHandler);

module.exports = app;
