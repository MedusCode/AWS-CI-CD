/***********************************************************************
 * @file authService.js
 * @desc This file contains functions to fulfill route requests related
 *        to creating and authenticating user accounts. 
 *        Uses Mongoose models for CRUD operations.
 * @module authService
 *************************************************************************/
import User from '../models/User.js';
import RoundSchema from '../models/Round.js';
import { UserAlreadyVerifiedError, UserNotFoundError, 
         InvalidRefreshTokenError, UserPasswordInvalidError, 
         UserPasswordResetCodeInvalidError, MfaSessionError} 
         from '../utils/errors.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import mongoose from 'mongoose';

const MAX_MFA_TIME = 60 * 1000 * 10 //10 minutes
const MAX_MFA_ATTEMPTS = 5;

/***********************************************************************
 * encryptMfaSecret
 * @descr Encrypt the MFA secret.
 * @param {string} mfaSecret - The MFA secret to encrypt.
 * @returns {string} The encrypted MFA secret.
 *************************************************************************/
const encryptMfaSecret = (mfaSecret) => {
  const iv = crypto.randomBytes(16); // Generate a random initialization vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(mfaSecret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const encryptedWithIv = iv.toString('hex') + ':' + encrypted;
  return encryptedWithIv;
}

/***********************************************************************
 * decryptMfaSecret
 * @descr Decrypt the MFA secret.
 * @param {string} encryptedMfaSecret - The encrypted MFA secret to decrypt.
 * @returns {string} The decrypted MFA secret.
 *************************************************************************/
const decryptMfaSecret = (encryptedWithIv) => {
  const [ivHex, encryptedData] = encryptedWithIv.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/***********************************************************************
 * generateQrCodeDataUrl
 * @descr Generate a data URL for the QR code.
 * @param {imageUrl} secret - The image Url to generate the QR code for.
 * @returns <string> The data URL for the QR code.
 *************************************************************************/
const generateQrCodeDataUrl = async (imageUrl) => {
    try {
      const url = await QRCode.toDataURL(imageUrl);
      return url;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

export default {
   /***********************************************************************
   * loginUser
   * @descr Log in an existing user.
   * @param {string} email, the email address of the user to log in.
   * @param {string} password, the password of the user to log in.
   * @returns {Promise<Object>} An object consisting of the logged in 
   *          user's data object
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  loginUser: async (email, password) => {
    const Round = mongoose.model('Round', RoundSchema);
    const user = await User.findOne({ 'accountInfo.email': email }).lean({ virtuals: true });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    } 
    if (!user.accountInfo.emailVerified) {
      throw new UserNotFoundError('User has an account but has not yet verified their email. Please check your email for a verification link.');
    }
    if (user.accountInfo.oauthProvider !== 'none') {
      throw new UserNotFoundError('User has an account with a third-party provider. Please log in with ' + user.accountInfo.oauthProvider);
    }
    const validPassword = await bcrypt.compare(password, user.accountInfo.password);
    if (!validPassword) {
      throw new UserPasswordInvalidError('Invalid password');
    }
    //We need to add the virtual round fields to the rounds subdocument array
    user.rounds = user.rounds.map(round => {
      const tempRoundDoc = new Round(round);
      const virtuals = tempRoundDoc.toObject(); // Virtuals are included by default
      delete virtuals.id;
      // Merge virtual fields into the original round object, preserving original values
      return { ...virtuals, ...round };
    });
    
    delete user.accountInfo.password;
    delete user.accountInfo.emailVerified;
    delete user.accountInfo.verificationDueBy;
    delete user.accountInfo.passResetToken;
    delete user.accountInfo.passResetVerifiedToken;
    delete user.accountInfo.mfaSecret;
    delete user.accountInfo.mfaVerified;
    delete user.accountInfo.mfaAttempts;
    delete user.accountInfo.mfaStartTime;
    delete user.__v;
    return user;
  },

  /***********************************************************************
   * registerUser
   * @descr Add a new user to the database, but mark them as unverified
   *       and send a verification email. 
   * @param {Object} userObject - The user object to be added.
   * @returns {Promise<Object>} The added user object.
   *************************************************************************/
  registerUser: async (newUser) => {
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);
    const verificationToken = jwt.sign({email: newUser.email}, process.env.JWT_SECRET, { expiresIn: '1d' });
    sendVerificationEmail(newUser.email, verificationToken);
    const user = new User({accountInfo: {email: newUser.email, password: newUser.password}});
    await user.save();
    const userObject = user.toObject();
    delete userObject.accountInfo.password;
    delete userObject.accountInfo.emailVerified;
    delete userObject.accountInfo.verificationDueBy;
    delete userObject.accountInfo.passResetToken;
    delete userObject.accountInfo.passResetVerifiedToken;
    delete userObject.accountInfo.mfaSecret;
    delete userObject.accountInfo.mfaVerified;
    delete userObject.accountInfo.mfaAttempts;
    delete userObject.accountInfo.mfaStartTime;
    delete userObject.__v;
    return userObject;
  },

  /***********************************************************************
   * refreshToken 
   * @descr Refresh the access token using the refresh token.
   * @param {string} userId - The id of the user to refresh the token for.
   * @param {string} refreshToken - The refresh token to use to refresh the
   *       access token.
   * @returns {Promise<Object>} An object containing the new access token
   *         and its expiry date.
   *************************************************************************/
  refreshToken: async (userId, refreshToken ) => {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.userId !== userId) {
      throw new InvalidRefreshTokenError('Invalid refresh token');
    }
    const antiCsrfToken = crypto.randomBytes(32).toString('hex');
    const accessToken = jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: '1h' });
    const accessTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    return {accessToken, accessTokenExpiry, antiCsrfToken};
  },

  /***********************************************************************
   * verifyUserEmail
   * @descr Verify a user's email address using a token.
   * @param {string} token - The token to verify the user.
   * @returns {Promise<boolean>} True if the user's email is verified.
   *************************************************************************/
  verifyUserEmail: async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({"accountInfo.email": decoded.email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + decoded.email + ' not found');
    }
    user.accountInfo.emailVerified = true;
    user.accountInfo.verificationDueBy = null;
    await user.save();
    return true;
  },

  /***********************************************************************
   * resendVerificationEmail
   * @descr Resend a verification email to the user.
   * @param {string} email - The email address to send the verification email to.
   * @returns {Promise<void>}
   *************************************************************************/
  resendVerificationEmail: async (email) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    if (user.accountInfo.emailVerified) {
      throw new UserAlreadyVerifiedError("User's email already verified");
    }
    const verificationToken = jwt.sign({email: email}, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.accountInfo.verificationDueBy = new Date(Date.now() + 1000*60*60*24); //24 hours from now
    await user.save();
    sendVerificationEmail(email, verificationToken);
  },

  /***********************************************************************
   * requestPasswordReset
   * @descr Initiate a password reset for the user.
   * @param {string} email - The email address to send the password reset email to.
   * @returns {Promise<void>}
   *************************************************************************/
  requestPasswordReset: async (email) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    const resetCode = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const resetToken = jwt.sign({resetCode}, process.env.JWT_SECRET, { expiresIn: 15 * 60 });
    user.accountInfo.passResetToken = resetToken;
    await user.save();
    sendPasswordResetEmail(email, resetCode);
  },

  /***********************************************************************
   * verifyPasswordReset
   * @descr Verify a password reset for the user.
   * @param {string} email - The email address to verify the password reset for.
   * @param {string} resetCode - The code to verify the password reset.
   * @returns {Promise<void>}
   *************************************************************************/
  verifyPasswordReset: async (email, resetCode) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    const decoded = jwt.verify(user.accountInfo.passResetToken, process.env.JWT_SECRET);
    if (decoded.resetCode !== resetCode) {
      throw new UserPasswordResetCodeInvalidError('Invalid reset code');
    }
    const verifyToken = jwt.sign({email, resetCode}, process.env.JWT_SECRET, { expiresIn: 15 * 60 });
    user.accountInfo.passResetVerifiedToken = verifyToken;
    await user.save();
  },

  /***********************************************************************
   * completePasswordReset
   * @descr Complete a password reset for the user.
   * @param {string} email - The email address to complete the password reset for.
   * @param {string} password - The new password to set for the user.
   * @returns {Promise<void>}
   *************************************************************************/
  completePasswordReset: async (email, password) => {
    const user = await User.findOne({"accountInfo.email": email });
    if (!user) {
      throw new UserNotFoundError('User with email ' + email + ' not found');
    }
    jwt.verify(user.accountInfo.passResetVerifiedToken, process.env.JWT_SECRET); 
    const salt = await bcrypt.genSalt(10);
    user.accountInfo.password = await bcrypt.hash(password, salt);
    user.accountInfo.passResetToken = null;
    user.accountInfo.passResetVerifiedToken = null;
    await user.save();
  },

  /***********************************************************************
   * enableMfa
   * @descr Enable MFA for the user.
   * @param {string} userId - The id of the user to enable MFA for.
   * @returns {Promise<Object>} An object containing the MFA secret and 
   *          QR code data URL.
   *************************************************************************/

  enableMfa: async (userId) => {
    const user  = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + userId + ' not found');
    }
    if (user.accountInfo.mfaVerified) {
      throw new UserAlreadyVerifiedError('MFA already enabled');
    }
    const secret = authenticator.generateSecret();
    const qrCodeImageUrl = authenticator.keyuri(user.accountInfo.email, 'SpeedScore',secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrCodeImageUrl);
    user.accountInfo.mfaSecret = encryptMfaSecret(secret);
    user.accountInfo.mfaVerified = false;
    await user.save();
    return {secret, qrCodeDataUrl};
  },

  /***********************************************************************
   * startVerifyMfa
   * @descr Start the MFA verification process for the user.
   * @param {string} userId - The id of the user to start MFA verification
   *         for.
   * @returns {Promise<string>} A message indicating that the MFA 
   *         verification process has started.
   *************************************************************************/
  startVerifyMfa: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + userId + ' not found');
    }
    if (!user.accountInfo.mfaSecret) {
      throw new Error('MFA not enabled for this user');
    }
    // Initialize MFA verification process
    user.accountInfo.mfaAttempts = 0;
    user.accountInfo.mfaStartTime = new Date();
    await user.save();
    return 'MFA verification started';
  },

  /***********************************************************************
   * verifyMfa
   * @descr Verify the MFA token for the user.
   * @param {string} userId - The id of the user to verify MFA for.
   * @param {string} token - The MFA token to verify.
   * @returns {Promise<boolean>} True if the MFA token is verified.
   *************************************************************************/
  verifyMfa: async (userId, token) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new UserNotFoundError('User with id ' + userId + ' not found');
    }
    if (!user.accountInfo.mfaSecret) {
      throw new Error('MFA not enabled for this user');
    }
    const currentTime = new Date();
    const timeElapsed = (currentTime - user.accountInfo.mfaStartTime); // Time elapsed in milliseconds
    if (timeElapsed > MAX_MFA_TIME) {
      throw new MfaSessionError('MFA session has expired or you have not started an MFA session');
    }
    if (user.accountInfo.mfaAttempts >= MAX_MFA_ATTEMPTS) {
      throw new MfaSessionError('Maximum number of MFA attempts exceeded');
    }
    const secret = decryptMfaSecret(user.accountInfo.mfaSecret);
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      user.accountInfo.mfaAttempts++; // Increment mfaAttempts on failure
      await user.save();
      throw new MfaSessionError('Invalid MFA token');
  }
  // On successful verification, reset the counter and start time
  user.accountInfo.mfaVerified = true;
  user.accountInfo.mfaAttempts = 0;
  user.accountInfo.mfaStartTime = null;
  await user.save();
  return true;
  }
};
