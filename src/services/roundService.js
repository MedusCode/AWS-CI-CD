
/***********************************************************************
 * @file roundService.js
 * @desc This file contains functions to fulfill round route requests by
 *        updating the database. Uses Mongoose models for CRUD operations.
 * @module roundService
 *************************************************************************/
import mongoose from 'mongoose';
import User from '../models/User.js';
import {RoundNotFoundError, RoundObjectInvalidError, UserNotFoundError, ObjectIdInvalidError} from '../utils/errors.js';

export default {

  /***********************************************************************
   * getRounds
   * @desc Gets the rounds of a user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array>} The rounds array of the user.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  getRounds: async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ObjectIdInvalidError('User ID is invalid; it must be a 24-character hexidecimal string');
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new UserNotFoundError('Cannot get rounds. No user with id ' + userId + ' exists.');
    }
    const roundObjects = userObject.rounds.map(round => {
      delete round.__v;
      return round;
    });
    return roundObjects;
  },

  /***********************************************************************
   * addRound
   * @desc Adds a round to a user document's rounds subdocument. 
   * @param {string} userId - The ID of the user.
   * @param {Object} roundObject - The round object to be added.
   * @returns {Promise<User>} The round object added, including _id.
   * @throws {RoundObjectInvalidError} If the round object is invalid.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  addRound: async (userId, roundObject) => {
    if (!roundObject) {
      throw new RoundObjectInvalidError('Round to be added must have properties');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ObjectIdInvalidError('User ID is invalid; it must be a 24-character hexadecimal string');
    }
    const user = await User.findById(userId); // Fetch the user document
    if (!user) {
      throw new UserNotFoundError('Cannot add round. No user with id ' + userId + ' exists.');
    }
    if (!user.rounds) { // Initialize rounds if it doesn't exist
      user.rounds = [];
    }
    user.rounds.push(roundObject);
    await user.save(); 
    //Using toObject() gets us min, sec, SGS, and time virtual fields
    const savedRound = user.rounds[user.rounds.length - 1].toObject();
    delete savedRound.id; // Remove the id property
    delete savedRound.__v;
    return savedRound;
  },

  /***********************************************************************
   * updateRound
   * @desc  a round to a user document's rounds subdocument. 
   * @param {string} userId - The ID of the user.
   * @param {string} roundId - The ID of the round to be updated
   * @param {Object} roundObject - The round object to replace
   *        the current one.
   * @param {Object} roundObject - The round object to be added.
   * @returns {Promise<User>} The round object added, including _id.
   * @throws {RoundObjectInvalidError} If the round object is invalid.
   * @throws {UserNotFoundError} If the user is not found.
   *************************************************************************/
  updateRound: async (userId, roundId, roundObject) => {
    const user = await User.findById(userId); // Fetch the user document
    if (!user) {
      throw new UserNotFoundError('Cannot add round. No user with id ' + userId + ' exists.');
    }
    const round = user.rounds.id(roundId);
    if (!round) {
      throw new RoundNotFoundError('Cannot update round. No round with id ' + roundId + ' exists.');
    }
    Object.assign(round, roundObject);
    await user.save(); 
    // Re-fetch the user document to get the latest version
    const updatedUser = await User.findById(userId);
    if (!updatedUser) {
      throw new UserNotFoundError('User not found after update');
    }
    // Find the updated round subdocument
    const updatedRound = updatedUser.rounds.id(roundId);
    if (!updatedRound) {
      throw new RoundNotFoundError('Updated round not found');
    }
    // Convert the updated round subdocument to a plain JavaScript object
    const updatedRoundObject = updatedRound.toObject();
    delete updatedRoundObject.id; // Remove the id property
    delete updatedRoundObject.__v;
    return updatedRoundObject; // Return the updated round object
  }

  
};