/*************************************************************************
 * @file: server.js
 * @desc: Defines the main server code for SpeedScore's API.
  *************************************************************************/

import dotenv from 'dotenv';
dotenv.config();
export const githubConfig = {
  clientID: process.env.GH_CLIENT_ID,
  clientSecret: process.env.GH_CLIENT_SECRET,
  callbackURL: process.env.API_DEPLOYMENT_URL + '/auth/github/callback'
};
import sgMail from '@sendgrid/mail';
import express from 'express';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import mongoose, { set } from 'mongoose';
import { MongoClient } from 'mongodb';
import passport from 'passport';
//import './middleware/passport.js';
import userRouter from './routes/userRoutes.js';
import roundRouter from './routes/roundRoutes.js';
import authRouter from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import rateLimiter from './middleware/ratelimiter.js';
import setupSwagger from './swagger.js';



sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const connectStr = process.env.MONGODB_URI;
const clientDeploymentUrl = process.env.CLIENT_DEPLOYMENT_URL;
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const mongoClient = new MongoClient(connectStr);

//Connect to MongoDB database using Mongoose library
mongoose.connect(connectStr)
  .then(
    () =>  {console.log(`Connected to ${connectStr}.`)},
    err => {console.error(`Error connecting to ${connectStr}: ${err}`)}
  );

const db = mongoose.connection;

// Create TTL index on the 'expires' field in the 'sessions' collection
db.once('open', () => {
  db.collection('sessions').createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });
});

//Initialize Express app
const app = express();

//Install rate limiter middleware
app.use(rateLimiter);

// Set up cookie parsing
app.use(cookieParser());

// Set up JSON request body parsing
app.use(express.json({ limit: '2mb' }));

// Set trust proxy if behind a proxy
if (isProduction) {
  app.set('trust proxy', 1); // Trust the first proxy
}

const mongoStore = new MongoStore({
  clientPromise: mongoClient.connect(),
  collectionName: 'sessions'
});

// Set up session handling
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: { secure: isProduction,
            sameSite: isProduction ? 'None' : false, // SameSite=None in production, disable SameSite in development
            httpOnly: true,}
}));

// Enable CORS for all routes
const corsOptions = {
  origin: isProduction ? clientDeploymentUrl : `http://localhost:${port}`,
  credentials: true // Allow cookies to be sent with requests
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Initialize Passport
app.use(passport.initialize());

// Set up Swagger API documentation
setupSwagger(app);

// Install app routes
app.use(userRouter);
app.use(roundRouter);
app.use(authRouter);

//Install error-handling middleware
app.use(errorHandler);

console.log(`SpeedScore API Version 1.0.0 (14-Sep-2024)`);
const server = app.listen(port, () => console.log(`Server running on port ${port}...`));

export { app, server, db, mongoClient};
