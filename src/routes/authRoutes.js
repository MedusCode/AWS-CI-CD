/***********************************************************************
 * @file authRoutes.js
 * @desc Contains the routes for authenticating auth via GitHub OAuth.
 *************************************************************************/
import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateUserLogin, validateUserRegistration } from '../middleware/dataValidator.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { csrfProtection } from '../middleware/csrfProtection.js';
import { configureSession } from '../middleware/configureSession.js';

const authRouter = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user using their email and password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password1
 *     responses:
 *       200:
 *         description: User logged in successfully
*         headers:
 *           Set-Cookie:
 *             description: HTTP-only cookies containing the access and refresh tokens.
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 examples:
 *                   accessToken:
 *                     summary: Access token
 *                     value: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=None
 *                   refreshToken:
 *                     summary: Refresh token
 *                     value: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=None
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *        $ref: '#/components/responses/NotFoundError'
 *       429:
 *         $ref: '#/components/responses/TooManyRequestsError'
 *       500:
 *         $ref: '#/components/responses/GeneralError'
 */
authRouter.post('/auth/login', validateUserLogin, authController.loginUser, configureSession);

/**
 * @swagger
 * /auth/logout/{userId}:
 *   delete:
 *     summary: Logout a user
 *     description: Logs out the user by invalidating their session and clearing authentication cookies.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to log out
 *     security:
 *       - cookieAuthAccessToken: []
 *       - antiCsrfToken: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         headers:
 *           Set-Cookie:
 *             description: Clears the authentication cookies.
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 examples:
 *                   accessToken:
 *                     summary: Access token
 *                     value: accessToken=; HttpOnly; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *                   refreshToken:
 *                     summary: Refresh token
 *                     value: refreshToken=; HttpOnly; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
authRouter.delete('/auth/logout/:userId', authorize, authController.logoutUser);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new, unverified user account and email the user a verification link they must click to activate their account.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *        $ref: '#/components/responses/DuplicateKeyError'
 *       429:
 *        $ref: '#/components/responses/TooManyRequestsError'
 *       500:
 *         $ref: '#/components/responses/GeneralError'
 */
authRouter.post('/auth/register', validateUserRegistration, authController.registerUser);

/***********************************************************************
 * @route GET /users/verify-email/:token
 * @desc If the token is valid and unexpired, activate the user's 
 *       account.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/verify-email/:token', authController.verifyUserEmail);

/***********************************************************************
 * @route POST /auth/resend-verification-email
 * @desc Resend a verification email to the user.
* @access Public
 * *********************************************************************/
authRouter.post('/auth/resend-verification-email', authController.resendVerificationEmail);

/***********************************************************************
 * @route POST /auth/reset-password/request
 * @desc Send the user a password reset email with a code.
 * @access Public
 * *********************************************************************/
authRouter.post('/auth/reset-password/request', authController.requestPasswordReset);

/***********************************************************************
 * @route POST /auth/reset-password/verify
 * @desc Verify a password reset code.
 * @access Public
 * *********************************************************************/
authRouter.post('/auth/reset-password/verify', authController.verifyPasswordReset);

/***********************************************************************
 * @route POST /auth/reset-password/complete
 * @desc Complete the password reset process by setting a new password.
 * @access Public
  * *********************************************************************/
authRouter.post('/auth/reset-password/complete', authController.completePasswordReset);

/***********************************************************************
 * @route POST /auth/:userId/mfa/enable
 * @desc Begin the process of enabling multi-factor authentication.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/mfa/enable/:userId', authenticate, csrfProtection, authorize, authController.enableMfa);

/***********************************************************************
 * @route POST /auth/mfa/start-verify/:userId
 * @desc Begin the process of verifying multi-factor authentication.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/mfa/start-verify/:userId', authenticate, csrfProtection, authorize, authController.startVerifyMfa);

/***********************************************************************
 * @route POST /auth/:userId/mfa/verify
 * @desc Verify a multi-factor authentication code to enable MFA.
 * @access Private
 * *********************************************************************/
authRouter.post('/auth/mfa/verify/:userId', authenticate, csrfProtection, authorize, authController.verifyMfa);

/***********************************************************************
 * @route GET /auth/anti-csrf-token
 * @desc Get the anti-CSRF token associated with the user's session.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/anti-csrf-token/:userId', authenticate, authorize, authController.getAntiCsrfToken);

/***********************************************************************
 * @route GET /auth/github
 * @desc Authenticate the user using the GitHub strategy by redirecting
 *      them to the GitHub login page. Scope is set to 'user:email' and
 *      'read:user' to request access to the user's email and profile.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/github', authController.githubAuth);

/***********************************************************************
 * @route GET /auth/github/callback
 * @desc Callback function after the user has authenticated with GitHub.
 * @access Public
 * *********************************************************************/
authRouter.get('/auth/github/callback', authController.githubCallback, configureSession);

export default authRouter;