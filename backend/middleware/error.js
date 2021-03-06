const fs = require('fs');
const ErrorHandler = require('../utils/errorHandler');

module.exports = (err, req, res, next) => {
  err.code = err.code || 500;

  if (process.env.NODE_ENV === 'DEVELOPMENT') {
    console.log(err);

    res.status(err.code).json({
      success: false,
      error: err,
      errMessage: err.message,
      stack: err.stack,
    });
  }

  if (process.env.NODE_ENV === 'PRODUCTION') {
    let error = { ...err };

    error.message = err.message;

    if (req.file) {
      fs.unlink(req.file.path, (errors) => {
        console.log(errors);
      });
    }

    // Wrong Mongoose Object ID Error
    if (err.name === 'CastError') {
      const message = `Resource not found. Invalid: ${err.path}`;
      error = new ErrorHandler(message, 400);
    }

    // Handling Mongoose Validation Error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((value) => value.message);
      error = new ErrorHandler(message, 400);
    }

    // Handling Mongoose duplicate key errors
    if (err.code === 11000) {
      const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
      const message = `Duplicate field value: ${value}. Please use another value!`;
      error = new ErrorHandler(message, 400);
    }

    // Handling wrong JWT error
    if (err.name === 'JsonWebTokenError') {
      const message = 'JSON Web Token is invalid. Try Again!!!';
      error = new ErrorHandler(message, 400);
    }

    // Handling Expired JWT errorgit branch -vv
    if (err.name === 'TokenExpiredError') {
      const message = 'JSON Web Token is expired. Try Again!!!';
      error = new ErrorHandler(message, 400);
    }
    res.status(error.code || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};
