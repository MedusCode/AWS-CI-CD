/***********************************************************************
 * @file errors.js
 * @desc Defines custom error classes for the application.
 *************************************************************************/

/***********************************************************************
 * @file errors.js
 * @desc Defines custom error classes for the application.
 *************************************************************************/

export class UserNotFoundError extends Error {
  constructor(message = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
    this.statusCode = 404; // Not Found
  }
}

export class UserPasswordInvalidError extends Error {
  constructor(message = 'Invalid password') {
    super(message);
    this.name = 'UserPasswordInvalidError';
    this.statusCode = 400; // Bad Request
  }
}

export class UserAlreadyVerifiedError extends Error {
  constructor(message = 'User already verified') {
    super(message);
    this.name = 'UserAlreadyVerifiedError';
    this.statusCode = 400; // Bad Request
  }
}

export class UserPasswordResetCodeInvalidError extends Error {
  constructor(message = 'Invalid password reset code') {
    super(message);
    this.name = 'UserPasswordResetCodeInvalidError';
    this.statusCode = 400; // Bad Request
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor(message = 'Invalid refresh token') {
    super(message);
    this.name = 'InvalidRefreshTokenError';
    this.statusCode = 401; // Unauthorized
  }
}

export class MfaSessionError extends Error {
  constructor(message = 'MFA session error') {
    super(message);
    this.name = 'MfaSessionError';
    this.statusCode = 401; // Unauthorized
  }
}

export class InvalidAccessTokenError extends Error {
  constructor(message = 'Invalid access token') {
    super(message);
    this.name = 'InvalidAccessTokenError';
    this.statusCode = 401; // Unauthorized
  }
}

export class InvalidAntiCsrfTokenError extends Error {
  constructor(message = 'Invalid anti-CSRF token') {
    super(message);
    this.name = 'InvalidAntiCsrfTokenError';
    this.statusCode = 403; // Forbidden
  }
}

export class InvalidOauthTokenError extends Error {
  constructor(message = 'Invalid OAuth state token') {
    super(message);
    this.name = 'InvalidOAuthTokenError';
    this.statusCode = 403; // Forbidden
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401; // Unauthorized
  }
}

export class TooManyRequestsError extends Error {
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'TooManyRequestsError';
    this.statusCode = 429; // Too Many Requests
  }
}

// Round object errors
export class RoundNotFoundError extends Error {
  constructor(message = 'Round not found') {
    super(message);
    this.name = 'RoundNotFoundError';
    this.statusCode = 404; // Not Found
  }
}

export class RoundObjectInvalidError extends Error {
  constructor(message = 'Round object is invalid') {
    super(message);
    this.name = 'RoundObjectInvalidError';
    this.statusCode = 400; // Bad Request
  }
}

export class ObjectIdInvalidError extends Error {
  constructor(message = 'Invalid ID format') {
    super(message);
    this.name = 'ObjectIdInvalidError';
    this.statusCode = 400; // Bad Request
  }
}