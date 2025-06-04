/***********************************************************************
 * @file userController.js
 * @desc Contains the controller functions for handling user requests.
 *************************************************************************/
import userService from '../services/userService.js';

/***********************************************************************
 * getusers (GET /users/:userId)
 * @desc Get all users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/
export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * getUser (GET /users/:userId)
 * @desc Get a user by ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *************************************************************************/ 
export const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.userId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * updateUser (PUT /users/:userId)
 * @desc Update a user by ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * *********************************************************************/
export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.userId, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

/***********************************************************************
 * deleteUser (DELETE /users/:userId)
 * @desc Delete a user by ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * *********************************************************************/
export const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.userId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}


