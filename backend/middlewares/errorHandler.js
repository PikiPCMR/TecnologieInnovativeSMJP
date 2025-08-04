const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Errore interno del server' });
};

export default errorHandler;
