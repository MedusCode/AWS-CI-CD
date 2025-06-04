import { InvalidAntiCsrfTokenError } from '../utils/errors.js';

export const csrfProtection = (req, res, next) => {
  const antiCsrfToken = req.headers['x-anti-csrf-token'];

  if (!antiCsrfToken) {
    console.log("Anti-CSRF token is missing");
    return next(new InvalidAntiCsrfTokenError("Anti-CSRF token is missing"));
  }

  if (antiCsrfToken !== req.session.antiCsrfToken) {
    console.log("anti-CSRF token is a mismatch");
    return next(new InvalidAntiCsrfTokenError("Invalid anti-CSRF token"));
  }

  next();
};