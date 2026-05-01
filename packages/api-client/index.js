const { TokenStorage } = require('./src/token');
const { configure } = require('./src/client');
const endpoints = require('./src/endpoints');

module.exports = {
  TokenStorage,
  configure,
  ...endpoints,
};
