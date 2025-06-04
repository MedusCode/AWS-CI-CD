/***********************************************************************
 * @file validationSchemas.js
 * @desc Defines the Joi validation schemas for user and round data.
 *************************************************************************/

import Joi from 'joi';

export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const passwordRegEx = /(?=.*[0-9])(?=.*[A-Z])/;

export const roundJoiSchema = Joi.object({
  _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  date: Joi.date().required(),
  course: Joi.string().required(),
  holes: Joi.number().integer().valid(9,18).required(),
  type: Joi.string().valid('practice', 'tournament').required(),
  strokes: Joi.number().integer().min(1).max(300).required(),
  seconds: Joi.number().integer().min(0).max(21600).required(),
  notes: Joi.string().allow('')
});

export const userJoiSchema = Joi.object({
  accountInfo: Joi.object({
    email: Joi.string().trim().required().pattern(emailRegex).message('is not a valid email address'),
    password: Joi.string().required(),
    securityQuestion: Joi.string().required(),
    securityAnswer: Joi.string().required()
  }),
  identityInfo: Joi.object({
    displayName: Joi.string().default(""),
    profilePic: Joi.string().default("images/DefaultProfilePic.jpg")
  }),
  speedgolfInfo: Joi.object({
    bio: Joi.string().max(500).default(""),
    homeCourse: Joi.string().default(""),
    firstRound: Joi.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).default("").allow(""),
    personalBest: Joi.object({
      strokes: Joi.number().default(100),
      seconds: Joi.number().default(5400),
      course: Joi.string().default("")
    }),
    clubs: Joi.object({
      "1W": Joi.boolean().default(false),
      "3W": Joi.boolean().default(false),
      "4W": Joi.boolean().default(false),
      "5W": Joi.boolean().default(false),
      Hybrid: Joi.boolean().default(false),
      "1I": Joi.boolean().default(false),
      "2I": Joi.boolean().default(false),
      "3I": Joi.boolean().default(false),
      "4I": Joi.boolean().default(false),
      "5I": Joi.boolean().default(false),
      "6I": Joi.boolean().default(false),
      "7I": Joi.boolean().default(false),
      "8I": Joi.boolean().default(false),
      "9I": Joi.boolean().default(false),
      PW: Joi.boolean().default(false),
      GW: Joi.boolean().default(false),
      SW: Joi.boolean().default(false),
      LW: Joi.boolean().default(false),
      Putter: Joi.boolean().default(false)
    }).default(),
    clubComments: Joi.string().default("")
  }),
  rounds: Joi.array().items(roundJoiSchema)
});