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
    if (snap.val() === null)
      throw new Error("'Users' missing in database");

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

  user.once('value').then((snap) => {
    if (snap.val() === null)
      throw new Error("User '" + user_id + "'  missing in database");

    res.send(snap.val());
  }).catch((err) => {
    console.log(err);
    next(createError(500, "Couldn't get user info: " + err.message));
  });
});


/*
 *********************
 *** POST requests ***
 *********************
 */

/* PUT request to edit a user's profile picture */
router.post('/:user_id/edit_profile_picture', function(req, res, next) {
  let user_id = req.params.user_id;
  let user = users.child(user_id);
  console.log(req.body)
  let new_propic = req.body.propic;

  // first check that they provided a profile picture URL
  if (new_propic == null) {
    next(createError(500, "Couldn't update user profile picture: empty 'propic' argument"));
  }

  // handles the actual updating of the profile picture; needed to prevent
  // nesting of callbacks
  var update_propic = function (userRef) {
    userRef.update({
      'propic': new_propic,
    }, (err) => {
      if (err) {
        console.log(err);
        next(createError(500, "Couldn't update user profile picture:" + err));
      } else {
        res.send('Profile picture updated successfully.');
      }
    });
  }

  user.once('value').then((snap) => {
    // Verify that the user exists
    if (snap.val() === null)
      throw new Error("User '" + user_id + "'  missing in database, can't update profile picture");

    // Update the user profile picture synchronously
    update_propic(user);
  }).catch((err) => {
    console.log(err);
    next(createError(500, "Couldn't get user info (edit_profile_picture): " + err.message));
  });

});




module.exports = router;
