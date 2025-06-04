/*****************************************************************************
 * @file User.js
 * @description Defines the User model schema using Mongoose.
 ****************************************************************************/
import mongoose from 'mongoose';
import roundSchema from './Round.js';

const userSchema = new mongoose.Schema({
  accountInfo: {
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: props => `${props.value} is not a valid email address`
      }
    },
    password: {
      type: String,
      validate: {
        validator: function(value) {
          // `this` refers to the current document being validated
          return this.oauthProvider !== 'none' || (value && value.length > 0);
        },
        message: 'Password is required if not using OAuth'
      }
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationDueBy: {
      type: Date,
      default: () => new Date(Date.now() + 1000*60*60*24) //24 hours from now
    },
    passResetToken: {
      type: String,
      default: null
    },
    passResetVerifiedToken: {
      type: String,
     default: null
    },
    mfaSecret: {
        type: String,
        default: null
    },
    mfaVerified: {
        type: Boolean,
        default: false
    },
    mfaAttempts: {
        type: Number,
        default: 0
    },
    mfaStartTime: {
      type: Date,
      default: null
    },
    oauthProvider: {
      type: String,
      enum: ['none', 'github'],
      default: 'none'
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  identityInfo: {
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      default: function() {
        return this.accountInfo.email.split('@')[0];
      }
    },
    profilePic: {
      type: String,
      default: "images/DefaultProfilePic.jpg",
    }
  },
  speedgolfInfo: {
    bio: {
      type: String, 
      maxLength: 500,
      default: ""},
    homeCourse: {
      type: String,
      default: ""},
    firstRound: {
        type: String,
        match: /^\d{4}-(0[1-9]|1[0-2])$/, // YYYY-MM format
        default: ""
    },
    personalBest: {
      strokes: {
        type: Number,
        default: ""
      },
      seconds: {
        type: Number,
        default: ""
      },
      course: {
        type: String,
        default: ""
      }
    },
    clubs: {
      "1W": {type: Boolean, default: false},
      "3W": {type: Boolean, default: false},
      "4W": {type: Boolean, default: false},
      "5W": {type: Boolean, default: false},
      "Hybrid": {type: Boolean, default: false},
      "1I": {type: Boolean, default: false},
      "2I": {type: Boolean, default: false},
      "3I": {type: Boolean, default: false},
      "4I": {type: Boolean, default: false},
      "5I": {type: Boolean, default: false},
      "6I": {type: Boolean, default: false},
      "7I": {type: Boolean, default: false},
      "8I": {type: Boolean, default: false},
      "9I": {type: Boolean, default: false},
      "PW": {type: Boolean, default: false},
      "GW": {type: Boolean, default: false},
      "SW": {type: Boolean, default: false},
      "LW": {type: Boolean, default: false},
      "Putter": {type: Boolean, default: false}
    },
    clubComments: {
      type: String,
      default: ""
    }
  },
  rounds: [roundSchema]
});

const User = mongoose.model('User', userSchema);

User.init().catch(error => console.log(error));

export default User;