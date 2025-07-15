const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Si l'erreur n'est pas une instance de notre ApiError, on la convertit
  // pour la standardiser. Cela peut arriver pour des erreurs imprévues.
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(error.name, statusCode, false, message);
  }

  // Log de l'erreur
  // On ne logue que les erreurs serveur (500) ou les erreurs non opérationnelles
  // pour éviter de polluer les logs avec des erreurs client (4xx) attendues.
  if (error.statusCode >= 500 || !error.isOperational) {
    logger.error(`[${req.method}] ${req.path} -> StatusCode: ${error.statusCode}, Message: ${error.message}`, {
      stack: error.stack,
      requestBody: req.body,
      requestQuery: req.query,
      requestParams: req.params
    });
  }

  // Préparation de la réponse
  const response = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;