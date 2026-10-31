// Vercel Serverless Function entry point
// Forwards incoming HTTP requests to TasteCrave request handler
const requestHandler = require('../server.js');

module.exports = (req, res) => {
  return requestHandler(req, res);
};
