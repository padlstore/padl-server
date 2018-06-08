/*
 * auth.js
 * Handles the creation of a Firebase Admin connection to Firebase.
 *
 */
 
var admin = require('firebase-admin');

var serviceAccount = require('../secrets/service_account_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://padl-origin.firebaseio.com'
});

module.exports = admin
