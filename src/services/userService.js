/***********************************************************************
 * @file userService.js
 * @desc This file contains functions to fulfill user route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module userService
 *************************************************************************/
import User from '../models/User.js';
import RoundSchema from '../models/Round.js';
import mongoose from 'mongoose';

/***********************************************************************
 * @function traverseObject
 * @descr Recursively traverses sourceObj, setting each corresponding
 *        property in destObj to the prop value in sourceObj.
 * @param {Object} destObj - The object to copy properties to.
 * @param {Object} sourceObj - The object to copy properties from.
 * @returns {Object} - A new object with the same keys and values.
 * *********************************************************************/
function deepCopy(destObj, sourceObj) {
  for (const key in sourceObj) {
    if (typeof sourceObj[key] === 'object' && sourceObj[key] !== null) {
      // If the property is an object, recursively call deepCopy
      if (!destObj[key]) {
        destObj[key] = {};
      }
      deepCopy(destObj[key], sourceObj[key]);
    } else {
      // If the property is not an object, simply assign the value
      destObj[key] = sourceObj[key];
    }
  }
  return destObj;
}

export default {

  /***********************************************************************
   * getUsers 
   * @descr Get all users.
   * @returns {Promise<Array<Object>>} An array of user objects.
   *************************************************************************/
  getUsers: async () => {
    const users = await User.find().lean();
    return users.map(user => {
                      const userObject = {...user};
                      delete userObject.accountInfo.password;
                      delete userObject.__v;
                      return userObject;
                    }
                  );
  },

  /***********************************************************************
   * getUser
   * @descr Get a user by ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<Object>} The user object.
  *************************************************************************/
  getUser: async (userId) => {
    try {
      const Round = mongoose.model('Round', RoundSchema);
      const user = await User.findById(userId).lean();
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
      delete user.accountInfo.passResetToken;
      delete user.accountInfo.passResetVerifiedToken;
      delete user.accountInfo.mfaSecret;
      delete user.accountInfo.mfaVerified;
      delete user.accountInfo.mfaAttempts;
      delete user.accountInfo.mfaStartTime;
      delete user.__v;
      return user;
    } catch (err) {
      console.error(err);
      next(err);
    }
  },

  /***********************************************************************
   * updateUser
   * @descr Update document whose ID matches the userId. The user object
   *       contains the fields to be updated. For each field in user, 
   *       update the corresponding field in the document. Any fields not
   *       present in the user object will remain unchanged.
   * @param {string} userId - The ID of the user to update.
   * @param {Object} user - The updated user object.
   * @returns {Promise<Object>} The user object.
   * *********************************************************************/
  updateUser: async (userId, user) => {
    const userDoc = await User.findById(userId).lean();
    if (!userDoc) {
      throw new UserNotFoundError('User with id ' + userId + ' not found');
    }
    try {
      const updatedUser = deepCopy(userDoc, user);
      const savedUpdatedUser = await User.findByIdAndUpdate(
        userId,
        updatedUser,
        { new: true }, // Return the updated document
      ).lean();
      //Remove sensitive information from the user object
      delete savedUpdatedUser.accountInfo.password;
      delete savedUpdatedUser.accountInfo.emailVerified;
      delete savedUpdatedUser.accountInfo.passResetToken;
      delete savedUpdatedUser.accountInfo.passResetVerifiedToken;
      delete savedUpdatedUser.accountInfo.mfaSecret;
      delete savedUpdatedUser.accountInfo.mfaVerified;
      delete savedUpdatedUser.accountInfo.mfaAttempts;
      delete savedUpdatedUser.accountInfo.mfaStartTime;
      delete savedUpdatedUser.__v;
      return savedUpdatedUser;
    } catch (err) {
      console.error(err);
      next(err);
    }
},

 /***********************************************************************
   * deleteUser
   * @descr Delete a user by ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<Object>} The user object.
  *************************************************************************/
  deleteUser: async (userId) => {
    const user = await User.findByIdAndDelete(userId).lean();
    const userObject = {...user};
    delete userObject.accountInfo.password;
    delete userObject.__v;
    return userObject;
  }
}
