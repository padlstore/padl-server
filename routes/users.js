/*
 * users.js
 * --------
 * Handles the viewing and modification of user profile data.
 * All the routes in this file require authentication, handled by middleware.
 *
 */

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
      throw new Error("'Users' table/key missing in database");

    // Send information about the user
    let usersInfo = snap.val();
    res.send(usersInfo);

  }).catch((err) => {
    next(createError(500, "Couldn't get all users: " + err.message));
    return;
  });
});

/* GET request for a specific user */
router.get('/:user_id', function(req, res, next) {
  let uid = req.params.user_id;
  let user = users.child(uid);

  // Check that the user exists, both in Firebase Auth and Firebase DB
  var firebase_auth_promise = admin.auth().getUser(uid);
  var firebase_db_promise = user.once('value');

  Promise.all([firebase_auth_promise, firebase_db_promise]).then((values) => {
    let [record, snap] = values;

    // Verify that the user exists in Firebase DB
    if (snap.val() === null)
      throw new Error("User '" + uid + "'  missing in database");

    // Augment and send information about the user
    let userInfo = snap.val();
    userInfo.displayName = record.displayName;
    userInfo.emailVerified = record.emailVerified;
    userInfo.disabled = record.disabled;
    userInfo.uid = record.uid;

    res.send(userInfo);

  }).catch((err) => {
    next(createError(500, "Couldn't get user info: " + err.message));
    return;
  })

});

/*
 *********************
 *** POST requests ***
 *********************
 */

/* POST request to edit a user's profile */
router.post('/:user_id/edit_profile', function(req, res, next) {
  let uid = req.params.user_id;
  let user = users.child(uid);
  let edits = req.body.edits;

  // Check that user supplied edits
  if (edits == null)
    next(createError(400, "Edits are null"));

  // Convert edits to JSON
  try {
    edits = JSON.parse(edits);
  } catch (e) {
    next(createError(400, "Malformed request: Edits not in JSON format"));
    return;
  }

  const fields = [
    'email',
    'password',
    'displayName',
    'propic',
    'isServiceAccount',
    'school',
    'location',
  ];

  // TODO: validate input
  var valid_format = function(key, value) {
    return true;
  }

  // Check that all the proposed edits are "good", i.e. non empty and formatted correctly
  for (const field of fields) {
    if (edits[field] !== undefined && !valid_format(field, edits[field])) {
      next(createError(400, "Edit error: Bad format for '" + field + "'"));
      return;
    }
  }

  var firebase_auth_promise = admin.auth().getUser(uid);
  var firebase_db_promise = user.once('value');

  Promise.all([firebase_auth_promise, firebase_db_promise]).then((values) => {
    let [record, snap] = values;

    // Verify that the user exists in Firebase DB
    if (snap.val() === null) {
      next(createError(500, "User '" + user_id + "'  missing in database"));
      return;
    }

    // Update on Firebase Auth
    admin.auth().updateUser(uid, edits).then((userRecord) => {
      console.log('Updated user info in Firebase Auth: ' + userRecord.toJSON());
    }).catch((err) => {
      next(createError(500, "Couldn't update user in Firebase Auth:" + err.message));
      return;
    })

    // Update custom fields in Firebase Database
    user.update(edits, (err) => {
      if (err) {
        console.log(err);
        next(createError(500, "Couldn't update user info: " + err));
        return;
      } else {
        console.log('Updated user info in Firebase Database.');
        res.send('User info updated successfully.');
      }
    });

  }).catch((err) => {
    next(createError(500, "User doesn't exist: " + err.message));
    return;
  });

});

module.exports = router;
