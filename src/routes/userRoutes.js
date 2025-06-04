/***********************************************************************
 * @file userRoutes.js
 * @desc Defines the routes for handling user requests.
 *************************************************************************/
import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { csrfProtection } from '../middleware/csrfProtection.js';
import { authorize } from '../middleware/authorize.js';

const userRouter = express.Router();

/***********************************************************************
 * @route GET /users
 * @desc Get all users.
 * @access Public
 * @returns {Array} - An array of user objects.
 * *********************************************************************/
userRouter.get('/users', authenticate, csrfProtection, userController.getUsers);

/***********************************************************************
 * @route GET /users/:userId
 * @desc Get a user by ID.
 * @access Private -- only admin or the user themselves can access
 * @returns {Object} - The user object.
 * *********************************************************************/
userRouter.get('/users/:userId', authenticate, csrfProtection, authorize, userController.getUser);

userRouter.put('/users/:userId', authenticate, csrfProtection, authenticate, userController.updateUser);

/***********************************************************************
 * @route DELETE /users/:userId
 * @desc Delete a user by ID.
 * @access Private -- only admin or the user themselves can delete
 * @returns {Object} - The user object.
 * *********************************************************************/
userRouter.delete('/users/:userId', authenticate, csrfProtection, authorize, userController.deleteUser);

export default userRouter;