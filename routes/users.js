var createError = require('http-errors');
var express = require('express');
var router = express.Router();

var admin = require('./auth');

var db = admin.database();
var users = db.ref('users');

/*
 ********************
 *** GET requests ***
 ********************
 */

/* GET request for all users */
router.get('/', function(req, res, next) {
  users.once('value').then((snap) => {
    // Verify that the 'users' dictionary exists
    if (snap.val() === null)
      throw new Error("'Users' missing in database");

    // Send information about the user
    res.send(snap.val());
  }).catch((err) => {
    console.log(err);
    next(createError(500, "Couldn't get all users: " + err.message));
  });
});

/* GET request for a specific user */
router.get('/:user_id', function(req, res, next) {
  let user_id = req.params.user_id;
  let user = users.child(user_id);

  // Check that the user exists, both in Firebase Auth and Firebase DB
  var firebase_auth_promise = admin.auth().getUser(user_id);
  var firebase_db_promise = user.once('value');

  Promise.all([firebase_auth_promise, firebase_db_promise]).then((values) => {
    let [record, snap] = values;

    // Verify that the user exists in Firebase DB
    if (snap.val() === null)
      throw new Error("User '" + user_id + "'  missing in database");

    // Send information about the user
    res.send(snap.val());

  }).catch((err) => {
    console.log(err);
    next(createError(500, "Couldn't get user info: " + err.message));
  })

});


/*
 *********************
 *** POST requests ***
 *********************
 */

/* POST request to edit a user's profile */
router.post('/:user_id/edit_profile', function(req, res, next) {
  let user_id = req.params.user_id;
  let user = users.child(user_id);
  let edits = req.body.edits;

  if (edits === null)
    throw new Error("Edits are null");

  // DEBUG
  console.log(edits);

  const fields = [
    'email',
    'password',
    'displayName',
    'propic',
    'isServiceAccount',
    'school',
    'location',
  ]

  var valid_format = function(key, value) {
    return true;
  }

  // Check that all the proposed edits are "good", i.e. non empty and formatted correctly
  for (var field in fields) {
    if (edits[field] !== null && valid_format(field, edits[field])) {
      throw new Error("Edit error: Bad format for '" + key + "'");
    }
  }

  var firebase_auth_promise = admin.auth().getUser(user_id);
  var firebase_db_promise = user.once('value');

  Promise.all([firebase_auth_promise, firebase_db_promise]).then((values) => {
    let [record, snap] = values;

    // Verify that the user exists in Firebase DB
    if (snap.val() === null)
      throw new Error("User '" + user_id + "'  missing in database");

    user.update(edits, (err) => {
      if (err) {
        console.log(err);
        next(createError(500, "Couldn't update user info: " + err));
      } else {
        res.send('User info updated successfully.');
      }
    });

  }).catch((err) => {
    console.log(err);
    next(createError(500, "Couldn't get user info (edit_profile_picture): " + err.message));
  });
});





module.exports = router;
