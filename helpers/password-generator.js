const crypto = require('crypto');

function generateRandomPassword(length = 24) {
  return crypto.randomBytes(length).toString('hex'); 
}

module.exports = {generateRandomPassword};