class BaseError extends Error {
  constructor(name, statusCode, isOperational, description) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }
}

class ApiError extends BaseError {
  constructor(name, statusCode = 500, isOperational = true, description = 'Internal Server Error') {
    super(name, statusCode, isOperational, description);
  }
}

module.exports = ApiError;