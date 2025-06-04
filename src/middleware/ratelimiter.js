import { RateLimiterMemory } from 'rate-limiter-flexible';
import { TooManyRequestsError } from '../utils/errors.js';

const rateLimiterMem = new RateLimiterMemory({
  points: 20, 
  duration: process.env.NODE_ENV === 'test' ? 10 : 60 // 10 seconds for testing, 60 seconds for production 
});

const rateLimiter = async(req, res, next) => {
  try {
    await rateLimiterMem.consume(req.ip);
    next();
  } catch (err) {
    return next(new TooManyRequestsError("You are limited to " + rateLimiterMem.points + " requests per " + 
                 rateLimiterMem.duration + " seconds. Please try again later."));
  }
}

export default rateLimiter;