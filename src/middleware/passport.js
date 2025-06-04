/*************************************************************************
 * @File: src/middleware/passport.js
 * @Desc: Contains the configuration for the Github OAuth strategy.
 * @Module: Passport
 ************************************************************************/
import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github2';
import User from '../models/User.js'; // Adjust the path to your User model
import { githubConfig } from '../server.js';
 
/*************************************************************************
 * @desc Configure the Github OAuth strategy if environ vars available.
 * @param {Object} accessToken - The access token returned by Github.
 * @param {Object} refreshToken - The refresh token returned by Github.
 * @param {Object} profile - The user's Github profile.Carriage Hills Dr, Granger, IN
 * @param {Function} done - The callback function.
 * @returns {Function} - Calls the done function.
 * **********************************************************************/

    passport.use(new GithubStrategy({githubConfig}, 
      async (accessToken, refreshToken, profile, done) => {
        // In our test environment, profile has a _json field, which
        //needs to be removed for the code below to work
        if (profile._json) {
          profile = profile._json
        };
        try {
          let email;
          if (profile.emails && profile.emails[0].value) {
            email = profile.emails[0].value;
          } else if (profile.email) {
            email = profile.email;
          } else {
            return done(new Error('Cannot authenticate with GitHub. Github profile does not have an email address'));
          }
        // Find or create user in your database
        let user = await User.findOne({'accountInfo.email': email });
        if (user) {
          // Check if the oauthProvider is not 'github'
          if (user.accountInfo.oauthProvider !== 'github') {
            // Update oauthProvider to 'github' and delete password
            user.accountInfo.oauthProvider = 'github';
            user.accountInfo.password = null; // Delete password
            await user.save();
          }
        } else {
          user = new User({
            accountInfo: {
              email: email,
              password: null, // No password needed
              oauthProvider: 'github',
              emailVerified: true
            },
            identityInfo: {
              displayName: profile.displayName,
              profilePic: profile.avatar_url ? profile.avatar_url : 'images/DefaultProfilePic.jpg'
            }
          });
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }));