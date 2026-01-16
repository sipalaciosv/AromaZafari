const serverless = require('serverless-http');
const app = require('../src/app');

const handler = serverless(app);

module.exports = (req, res) => {
  // Vercel routes calls to /api/<file> and strips the /api prefix
  // Our Express app defines routes under `/api/...`, so restore that prefix
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return handler(req, res);
};
