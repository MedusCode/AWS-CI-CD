/***********************************************************************
 * @file errorHandler.js
 * @desc Middleware function that handles errors and sends appropriate
 * error response to client.
 *************************************************************************/
import mongoose from "mongoose";

export default function errorHandler(err, req, res, next) {
  // Handle SyntaxError for invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ error: 'Invalid JSON in message body' });
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).send({ error: err.message });
  }

  // Handle Mongoose cast errors for invalid ObjectId
  if (err instanceof mongoose.Error.CastError && err.kind === 'ObjectId') {
    return res.status(400).send({ error: 'Invalid ID format' });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000 || err.code === 11001) {
    return res.status(400).send({ error: 'A user with that email already exists' });
  }

  // Handle custom errors with statusCode property
  if (err.statusCode) {
    return res.status(err.statusCode).send({ error: err.message });
  }

  // Default to 500 Internal Server Error for unhandled errors
  return res.status(500).send({ error: err.message });
}