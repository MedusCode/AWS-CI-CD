import app from './src/server'; // Adjust the path to your server file
import http from 'http';
import dotenv from 'dotenv';

let server;
dotenv.config({path: './.env'});

jest.setTimeout(30000); // timeout for async operations

beforeAll((done) => {
  server = http.createServer(app);
  server.listen(3000, () => {
    console.log('Test server running on port 3000');
    done();
  });
});

afterAll((done) => {
  server.close(() => {
    console.log('Test server closed');
    done();
  });
});