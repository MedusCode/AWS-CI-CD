/***********************************************************************
 * @file roundController.js
 * @desc Contains the controller functions for handling round requests.
 *************************************************************************/
import roundService from '../services/roundService.js';

/***********************************************************************
 * getRounds (GET /users/:userId/rounds)
 * @desc Retrieves rounds for a specific user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the rounds 
 *          are retrieved.
 *************************************************************************/
export const getRounds = async (req, res, next) => {
  try {
    const rounds = await roundService.getRounds(req.params.userId);
    res.status(200).json(rounds);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * addRound (POST /users/:userId/rounds)
 * @desc Adds a new round for a specific user.
  * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the round is added.
 *************************************************************************/
export const addRound = async (req, res, next) => {
  try {
    const newRound = await roundService.addRound(req.params.userId, req.body);
    res.status(201).json(newRound);
  } catch (err) {
    next(err)   
  } 
}

/***********************************************************************
 * updateRound (PUT /users/:userId/rounds/:roundId)
 * @desc Updates a round for a specific user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the round is updated.
 *************************************************************************/
export const updateRound = async (req, res, next) => {
  try {
    const updatedRound = await roundService.updateRound(req.params.userId, req.params.roundId, req.body);
    res.status(200).json(updatedRound);
  } catch (err) {
    next(err);
  } 
}