/*
 * newaccount.js
 * -------------
 * Handles the creation of new accounts.
 * 
 */

var createError = require('http-errors');
var express = require('express');
var router = express.Router();

var admin = require('./auth')

var db = admin.database()
var users = db.ref('users')

/* POST request to create a new account. */
router.post('/', function(req, res, next) {
  let email = req.body.email;
  let emailVerified = false;
  let disabled = false;
  let password = req.body.password;
  let displayName = req.body.displayName;
  let propic = "https://s3.amazonaws.com/padl.storage1/profile_pictures/default.jpg";
  let isServiceAccount = false;
  let ratings = {"sentinel": ""};
  let school = "MIT";
  let location = req.body.location;
  let offers = {"sentinel": ""};
  let wishes = {"sentinel": ""};


  // Check that all the proposed edits are "good", i.e. non empty and formatted correctly
  // isString test
  let isString = function(obj) {
    return (Object.prototype.toString.call(obj) === '[object String]');
  }

  // Email validation
  let testEmail = function(addr) {
    let re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    return isString(addr) && re.test(addr);
  }

  let testPassword = function(pwd) {
    return isString(pwd) && pwd.length > 6;
  }

  let testDisplayName = function(name) {
    return isString(name) && name.length > 3;
  }

  let testLocation = function(loc) {
    // TODO: Replace hard coded locations with something more flexible
    // TODO: Add locations based on school
    let validLocations = ['Simmons Hall', 'Maseeh Hall',
                          'McCormick Hall', 'Burton Conner',
                          'Random Hall', 'Next House',
                          'New House', 'Martin Trust Center'];
    return isString(loc) && validLocations.includes(loc);
  }

  valid = (testEmail(email) &&
           testPassword(password) &&
           testDisplayName(displayName) &&
           testLocation(location));

  if (!valid) {
    next(createError(400, "Invalid input provided."));
    return;
  }

  // Create the user settings that are passed into Firebase Auth (createUser)
  // Firebase Database (set)
  let user_settings_firebase_auth = {
    "email": email,
    "emailVerified": emailVerified,
    "password": password,
    "disabled": disabled,
    "displayName": displayName,
  };

  let user_settings_firebase_db = {
    "email": email,
    "isServiceAccount": isServiceAccount,
    "propic": propic,
    "location": location,
    "school": school,
    "offers": offers,
    "ratings": ratings,
    "wishes": wishes,
  };

  admin.auth().createUser(user_settings_firebase_auth).then((userRecord) => {
    let user = users.child(userRecord.uid)
    user.set(user_settings_firebase_db, (err) => {
      if (err) { // if an error actually occured
        next(createError(500, "Couldn't create new account in Firebase DB"));
        return;
      } else {
        console.log("Creating new account with email: " + email);
        res.send("Created new account successfully.");
      }
    });

  }).catch((err) => {
    next(createError(500, "Couldn't create new account in Firebase Auth"));
    return;
  });

});

module.exports = router;
