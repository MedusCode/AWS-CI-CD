/***************************************************************************************
 * @file: registerUser.test.js
 * @desc: Test the /auth/register and /auth/login and /auth/verify-email routes.
 *        We use /auth/login to verify that a user's account is activated.
 *        We use /users/:userId to delete the user we created.
 **************************************************************************************/

// Import the necessary modules and services
import session from 'supertest-session';
import {app, server, mongoClient} from '../../server.js'; // Ensure your server exports the Express app
import * as emailService from '../../services/emailService';
import { generateRandomEmail, generateValidPassword, generateCustomPassword,
        registerUser, verifyAccountEmail, requestResendVerificationEmail} from '../../utils/testUtils.js';
import mongoose from 'mongoose';
const numTestRounds = 1; // Number of test rounds to run

//Array of users to test
const newUsers = Array(numTestRounds).fill(null).map(() => ({
  email: generateRandomEmail(),
  password: generateValidPassword()
}));

const newUsersInvalidEmail = Array(numTestRounds).fill(null).map(() => ({
  email: generateValidPassword(), //Invalid email
  password: generateValidPassword()
}));

const newUsersInvalidPassword = Array(numTestRounds).fill(null).map(() => ({
  email: generateRandomEmail(),
  password: generateCustomPassword(6,1,1) //Invalid password
}));

const newUsersInvalidEmailAndPassword = Array(numTestRounds).fill(null).map(() => ({
  email: generateValidPassword(), //Invalid email
  password: generateCustomPassword(6,1,1) //Invalid password
}));

//Variables used in tests
let testSession, mockSendVerificationEmail;

// Describe the test suite
describe('Test routes to register new users and verify their email addresses', () => {

  // Before all tests, create a test session and spy on the sendVerificationEmail function
  beforeAll(() => {
    testSession = session(app);
    mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
    mockSendVerificationEmail.mockImplementation((email, verificationToken) => null);
  });

  // After each test, clear all timers
  afterEach(() => {
    jest.clearAllTimers(); // Clear all timers after each test
  });

  // After all tests, clear all mocks and close the server and database connection
  afterAll(async() => {
    jest.clearAllMocks(); // Clear all mocks after all tests
    await mongoose.connection.close();
    try {
      await mongoClient.close();
      console.log('MongoClient connection closed');
    } catch (error) {
      console.log('Error closing MongoClient connection:', error);
    }
    await new Promise(resolve => server.close(resolve));
  });

  for (let i = 0; i < numTestRounds; i++) {
    //Test the /auth/register route with a invalid email and invalid password
    it('should not register a new user with invalid email and invalid password', async () => {
      await registerUser(testSession, newUsersInvalidEmailAndPassword[i], false);
    });

     //Test the /auth/register route with a valid email and invalid password
     it('should not register a new user with valid email and invalid password', async () => {
      await registerUser(testSession, newUsersInvalidPassword[i], false);
    });

    //Test the /auth/register route with an invalid email and valid password
    it('should not register a new user invalid email and valid password', async () => {
      await registerUser(testSession, newUsersInvalidEmail[i], false);
    });

    //Test the /auth/register route with a valid email and valid password
    it('should register a new user with valid email and valid password', async () => {
      await registerUser(testSession, newUsers[i]);
    });

    //Test the /auth/resend-verification-email route with an invalid email
    it('should not re-send verification email to invalid email', async () => {
      await requestResendVerificationEmail(testSession, newUsersInvalidEmail[i].email, false);
    });

    //Test the /auth/resend-verification-email route with a valid, registered email
    it('should re-send verification email to valid, registered user', async () => {
      await requestResendVerificationEmail(testSession, newUsers[i].email, true);
    });

    //Test the /auth/verify-email route with invalid token
    it('should not verify user email with invalid token', async () => {
      await verifyAccountEmail(mockSendVerificationEmail, false);
    });

    //Test the /auth/verify-email route with valid token
    it('should verify user email with valid token', async () => {
      await verifyAccountEmail(mockSendVerificationEmail, true);
    });

    // Test the /auth/register route with an existing email
    it('should not register a user who already has an account', async () => {
      await registerUser(testSession, newUsers[i], false);
    });
  }
})
