/***********************************************************************
 * @file userController.js
 * @desc Validates incoming data for the user and round routes using Joi
 *************************************************************************/
import Joi from 'joi';
import {emailRegex, passwordRegEx, userJoiSchema, roundJoiSchema} from '../utils/validationSchemas.js';

/*************************************************************************
 * @func validateUserLogin
 * @desc Validates the user login request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateUserLogin = (req, res, next) => {
  const loginSchema = Joi.object({
    email: Joi.string().trim().required().pattern(emailRegex)
      .message('is not a valid email address'),
    password: Joi.string().required()
  });
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({message: "Error validing email and password used for login",
                                 errors: error.details.map(detail => detail.message) });
  }
  next();
};

/*************************************************************************
 * @func validateUserRegistration
 * @desc Validates the user registration request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateUserRegistration = (req, res, next) => {
  const registrationSchema = Joi.object({
    email: Joi.string().trim().required().pattern(emailRegex)
      .message('is not a valid email address'),
    password: Joi.string().required().min(8)
      .pattern(passwordRegEx)
      .message('must be at least 8 characters long and contain at least one number and one uppercase letter')
  });
  const { error } = registrationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({message: "Error validating email and password used for registration",
                                 errors: error.details.map(detail => detail.message) });
  }
  next();
};

/*************************************************************************
 * @func validateUser
 * @desc Validates user objects in PUT requests.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateUser = (req, res, next) => {
  const { error } = userJoiSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({message: "Error validing user",errors: error.details.map(detail => detail.message) });
  }
  next();
};

/*************************************************************************
 * @func validateRound
 * @desc Validates the round creation request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 ************************************************************************/
export const validateRound = (req, res, next) => {
  //Strip out the virtuals from the request body
  const round = {...req.body};
  delete round.SGS;
  delete round.time;
  delete round.min;
  delete round.sec;
  req.body = round;
  const { error } = roundJoiSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({message: "Error validating round", errors: error.details.map(detail => detail.message) });
  }
  next();
};
