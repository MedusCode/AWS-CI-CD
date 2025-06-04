/*************************************************************************
 * @file authenticate.js
 * @desc Middleware to authenticate requests using JWT.
 * @exports authenticate
 *************************************************************************/

import jwt from 'jsonwebtoken';
import { InvalidAccessTokenError } from '../utils/errors.js';

/*************************************************************************
 * @func authenticate
 * @desc Middleware function to authenticate requests using JWT. Auto-
 *       refreshes the access token if it has expired and the refresh
 *       token is still valid.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const authenticate = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return next(new InvalidAccessTokenError("Access token is missing"));
  }
  try {
    // Verify the access token; will throw error if invalid
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    next();
  } catch (err) {
      if (err.name === 'TokenExpiredError') {
        //Try to refresh the token...
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
          return next(new InvalidAccessTokenError("Access token has expired, and refresh token is missing. Please log in again"));
        }
        try {
          const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
          // Generate a new access token
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite:  process.env.NODE_ENV === 'production' ? 'None' : false,
            domain: process.env.COOKIE_DOMAIN,
            maxAge: 3600000
          };
          const newAccessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_DURATION });
          res.cookie('accessToken', newAccessToken, cookieOptions); //refresh the access token
          req.session.antiCsrfToken = crypto.randomBytes(32).toString('hex'); //Refresh anti-csrf token
          req.session.save((err) => {
            if (err) {
              return res.status(500).json({ message: 'Failed to save session' });
            } else {
              next();
            }
          });
          next();
        } catch (err) {
          if (err.name === 'TokenExpiredError') {
            return next(new InvalidAccessTokenError("Refresh token has expired. Please log in again"));
          }
          return next(new InvalidAccessTokenError("Invalid refresh token. Please log in again"));
        }
        return next(new InvalidAccessTokenError("Invalid access token. Please log in again"));
      }
      return next(new InvalidAccessTokenError("Invalid access token. Please log in again"));
    }
}