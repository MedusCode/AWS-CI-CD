//process.env.DEBUG = 'nock.*'; // Enable nock debugging
import session from 'supertest-session';
import * as emailService from '../../services/emailService.js';
import { app, server, mongoClient } from '../../server.js'; 
import { registerUser, verifyAccountEmail, generateRandomEmail, 
          generateValidPassword, registerUserViaGitHubOAuth } 
          from '../../utils/testUtils.js';
import mongoose from 'mongoose';
import User from '../../models/User';
import nock from 'nock';

let testSession, mockSendVerificationEmail;

//Array of users to test
const newUser = {
  email: generateRandomEmail(),
  password: generateValidPassword()
};

describe('GitHub Authentication Routes', () => {
  
  beforeAll(async () => {
    testSession = session(app); // Create a new session
    mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
    mockSendVerificationEmail.mockImplementation((email, verificationToken) => null);
  });

  afterEach(async () => {
    nock.cleanAll(); // Clean all nock interceptors after each test
  });

  afterAll(async () => {
    await User.deleteMany({}); // Clear the users collection after all tests
    await mongoose.connection.close(); // Close MongoDB connection
    try {
      await mongoClient.close(); // Close MongoClient connection
      console.log('MongoClient connection closed');
    } catch (error) {
      console.log('Error closing MongoClient connection:', error);
    }
    await new Promise(resolve => server.close(resolve)); // Close the server
  });


  //Create a new user acccount
  it('should register and verify email for a new user', async () => {
    await registerUser(testSession, newUser);
    await verifyAccountEmail(mockSendVerificationEmail);
  });

  //Register new user created in previous test for GitHub OAuth
  it('should register an existing user for GitHub OAuth', async () => {
    await registerUserViaGitHubOAuth(testSession, newUser.email);
  });

  //Register a new user for GitHub OAuth
  it('should register a new user for GitHub OAuth', async () => {
    await registerUserViaGitHubOAuth(testSession, generateRandomEmail());
  });
});