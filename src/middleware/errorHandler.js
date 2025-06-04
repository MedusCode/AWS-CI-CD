/***********************************************************************
 * @file errorHandler.js
 * @desc Middleware function that handles errors and sends appropriate
 * error response to client.
 *************************************************************************/
import mongoose from "mongoose";

export default function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let errorResponse = {
    status: statusCode,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred.'
  };

  // Handle SyntaxError for invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorResponse = {
      status: statusCode,
      error: 'Invalid JSON',
      message: 'Invalid JSON in message body'
    };
  }

  // Handle Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errorResponse = {
      status: statusCode,
      error: 'Validation Error',
      message: err.message,
      details: Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }))
    };
  }

  // Handle Mongoose cast errors for invalid ObjectId
  else if (err instanceof mongoose.Error.CastError && err.kind === 'ObjectId') {
    statusCode = 400;
    errorResponse = {
      status: statusCode,
      error: 'Invalid ID Format',
      message: 'Invalid ID format'
    };
  }

  // Handle MongoDB duplicate key errors
  else if (err.code === 11000 || err.code === 11001) {
    statusCode = 400;
    errorResponse = {
      status: statusCode,
      error: 'Duplicate Key Error',
      message: 'A user with that email already exists'
    };
  }

  // Handle custom errors with statusCode property
  else if (err.statusCode) {
    statusCode = err.statusCode;
    errorResponse = {
      status: statusCode,
      error: err.message,
      message: err.message
    };
  }

  // Default to 500 Internal Server Error for unhandled errors
  else {
    errorResponse.message = err.message || errorResponse.message;
  }

  res.status(statusCode).json(errorResponse);
}