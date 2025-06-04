import session from 'supertest-session';
import {app, server, mongoClient} from '../../server.js';
import * as emailService from '../../services/emailService';
import { generateRandomEmail, generateValidPassword, registerUser,
         verifyAccountEmail, loginUser, getAntiCsrfToken,
         retryRequest} from '../../utils/testUtils.js';
import mongoose from 'mongoose';
import { authenticator } from 'otplib';
import User from '../../models/User.js';

//Array of users to test; adjust number of users as needed
const newUsers = Array(1).fill(null).map(() => ({
  email: generateRandomEmail(),
  password: generateValidPassword()
}));

let testSession, secret, mfaCode, loggedInUser, mockSendVerificationEmail;
const invalidMfaCode = '12345';

describe('Test enable MFA workflow', () => {

    beforeAll(async () => {
      testSession = session(app);
      mockSendVerificationEmail = jest.spyOn(emailService, 'sendVerificationEmail');
      mockSendVerificationEmail.mockImplementation((email, verificationToken) => null);
    });

    afterAll(async() => {
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
    
      it('should start the process of enabling MFA', async () => {
        loggedInUser.antiCsrfToken = await getAntiCsrfToken(testSession, loggedInUser.user._id, loggedInUser.accessToken, loggedInUser.refreshToken);
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/enable/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
        );
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('qrCodeDataUrl');
        expect(response.body).toHaveProperty('secret');
        // Extract the secret from the response
        secret = response.body.secret;
        // Generate a TOTP using the secret
        mfaCode = authenticator.generate(secret);
      });

      //Try to verify the MFA code without starting the verification session
      it('should not verify the MFA code because /auth/mfa/start-verify not called', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
            .send({ code: mfaCode })
        );
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error','MFA session has expired or you have not started an MFA session');
        });

      it('should start an MFA verification session', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/start-verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'MFA verification started');
      });

      //Enter invalid MFA token -- attempt 1
      it('should not verify the MFA token due to the token being invalid', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
            .send({ code: invalidMfaCode })
        );
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid MFA token');
        });

      //Enter invalid MFA token -- attempt 2
      it('should not verify the MFA token due to the token being invalid', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
            .send({ code: invalidMfaCode })
        );
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid MFA token');
        });

      //Enter invalid MFA token -- attempt 3
      it('should not verify the MFA token due to the token being invalid', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
            .send({ code: invalidMfaCode })
        );
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid MFA token');
        });

      //Enter invalid MFA token -- attempt 4
      it('should not verify the MFA token due to the token being invalid', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
            .send({ code: invalidMfaCode })
        );
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid MFA token');
        });

      //Enter invalid MFA token -- attempt 5
      it('should not verify the MFA token due to the token being invalid', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
            .send({ code: invalidMfaCode })
        );
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid MFA token');
        });

      //Enter invalid MFA token -- attempt 6
      it('should not verify the MFA token due to too many attempts', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
            .send({ code: invalidMfaCode })
        );
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Maximum number of MFA attempts exceeded');
      });

      //Start the MFA verification session again
      it('should start another MFA verification session', async () => {
        const response = await retryRequest(async() =>
          testSession
            .post(`/auth/mfa/start-verify/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
        );
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'MFA verification started');
      });

      //Enter correct MFA code
      it('should verify the MFA token', async () => {
        const response = await testSession
          .post(`/auth/mfa/verify/${loggedInUser.user._id}`)
          .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
          .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
          .send({ code: mfaCode });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'MFA code verified');
        });
      
      //Confirm that MFA is enabled
      it('should confirm that MFA is enabled for the user', async () => {
        const user = await User.findById(loggedInUser.user._id);
        expect(user.accountInfo.mfaVerified).toBe(true);
      });

      //Delete the user to leave no trace
      it('should delete the user', async () => {
        const response = await retryRequest(async() =>
          testSession
            .delete(`/users/${loggedInUser.user._id}`)
            .set('x-anti-csrf-token', loggedInUser.antiCsrfToken)
            .set('Cookie', `accessToken=${loggedInUser.accessToken}; refreshToken=${loggedInUser.refreshToken}`)
        );
        expect(response.statusCode).toBe(200);
      });
    });
});

