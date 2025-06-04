import session from 'supertest-session';
import {app, server, mongoClient} from '../../server.js'; // Ensure your server exports the Express app
import * as emailService from '../../services/emailService.js';
import {generateRandomEmail, generateValidPassword, registerUser, 
        verifyAccountEmail, loginUser, 
        retryRequest,
        getAntiCsrfToken} from '../../utils/testUtils.js';
import mongoose from 'mongoose';
import User from '../../models/User.js';
const numTestRounds = 1;

//Array of users to test
const newUsers = Array(numTestRounds).fill(null).map(() => ({
  email: generateRandomEmail(),
  password: generateValidPassword()
}));

let testSession, loggedInUser, mockSendVerificationEmail;

describe('Test Log in and log out routes', () => {

  beforeAll(async () => {
    testSession = session(app);
    mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
    mockSendVerificationEmail.mockImplementation((email, verificationToken) => null);
  });

  // After all tests, clear mocks, delete users, and close server and database connection
  afterAll(async() => {
    jest.clearAllMocks(); // Clear all mocks after all tests
    await Promise.all(newUsers.map(async (newUser) => {
      await User.findOneAndDelete({ 'accountInfo.email': newUser.email });
    }));
    await mongoose.connection.close();
    try {
      await mongoClient.close();
      console.log('MongoClient connection closed');
    } catch (error) {
      console.log('Error closing MongoClient connection:', error);
    }
    await new Promise(resolve => server.close(resolve));
  });

  newUsers.forEach((newUser) => {
    //Test /auth/login user for unregistered user
    it('should not log in unregistered user', async () => {
      await loginUser(testSession, newUser, false);
    });

    //Test the /auth/register route with a valid, random email and password
    it('should register a new user', async () => {
      await registerUser(testSession, newUser);
    });
    
    //Test the /auth/verify-email route
    it('should verify user email', async () => {
      await verifyAccountEmail(mockSendVerificationEmail);
    });

    //Test the /auth/login route
    it('should log in the user', async () => {
      loggedInUser = await loginUser(testSession, newUser);
    });

   //Test the /auth/logout route
   it('should log out the user', async () => {
      const antiCsrfToken = getAntiCsrfToken(testSession, loggedInUser.user._id, loggedInUser.accessToken, loggedInUser.refreshToken);
      const response = await retryRequest(async() => 
        testSession
          .delete(`/auth/logout/${loggedInUser.user._id}`)
          .set('x-anti-csrf-token', antiCsrfToken)
          .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
      );
      expect(response.statusCode).toBe(200);
    });

    //Test the /auth/login route with invalid password
    it('should not log in user with invalid password', async () => {
      await loginUser(testSession, {email: newUser.email, password: 'Invalid'}, false);
    });
  });
});